"""SHGs (group lending, meetings, thrift, internal loans) and savings goals."""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import ledger, models, schemas
from ..database import get_db
from ..deps import audit, get_current_user, require_roles, notify

router = APIRouter(tags=["community"])


def _own_shg(shg_id: int, user: models.User, db: Session) -> models.SHG:
    shg = db.get(models.SHG, shg_id)
    if not shg or (user.role != "admin" and shg.leader_id != user.id):
        raise HTTPException(404, "SHG not found or you are not the leader")
    return shg


@router.post("/shgs", status_code=201)
def create_shg(body: schemas.SHGIn, user=Depends(require_roles("shg_leader", "admin")), db: Session = Depends(get_db)):
    shg = models.SHG(name=body.name, village=body.village, leader_id=user.id, monthly_thrift_amount=body.monthly_thrift_amount)
    db.add(shg)
    db.flush()
    if user.role == "shg_leader":
        user.shg_id = shg.id
        db.add(models.SHGMember(shg_id=shg.id, user_id=user.id, role="president"))
    audit(db, user.id, "create_shg", "shg", shg.id)
    db.commit()
    return {"id": shg.id, "name": shg.name, "village": shg.village, "monthly_thrift_amount": shg.monthly_thrift_amount}


# --- Consent-based Invite Flow ---

@router.post("/shgs/{shg_id}/invites", status_code=201)
def invite_member(shg_id: int, body: schemas.SHGInviteIn, user=Depends(require_roles("shg_leader", "admin")), db: Session = Depends(get_db)):
    shg = _own_shg(shg_id, user, db)
    email = body.email.lower()
    target = db.scalar(select(models.User).where(models.User.email == email))
    if not target:
        raise HTTPException(404, "No registered user found with that email. Ask them to create an account first.")

    if target.shg_id == shg.id:
        raise HTTPException(400, "User is already an enrolled member of this SHG.")
    if target.shg_id and target.shg_id != shg.id:
        raise HTTPException(409, f"User '{target.name}' is currently enrolled in another SHG (#{target.shg_id}). They must leave their current SHG first.")

    existing_invite = db.scalar(select(models.SHGInvite).where(
        models.SHGInvite.shg_id == shg.id,
        models.SHGInvite.invited_email == email,
        models.SHGInvite.status == "pending"
    ))
    if existing_invite:
        raise HTTPException(409, "A pending invitation has already been dispatched to this user.")

    invite = models.SHGInvite(shg_id=shg.id, invited_email=email, invited_by_id=user.id, status="pending")
    db.add(invite)
    audit(db, user.id, "invite_member", "shg", shg.id, email)
    db.commit()
    db.refresh(invite)
    return {"id": invite.id, "shg_id": shg.id, "email": email, "status": "pending"}


@router.get("/shgs/invites/my")
def my_invites(user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieves all pending SHG membership invitations for the authenticated user."""
    invites = db.scalars(select(models.SHGInvite).where(
        models.SHGInvite.invited_email == user.email.lower(),
        models.SHGInvite.status == "pending"
    )).all()

    out = []
    for inv in invites:
        shg = db.get(models.SHG, inv.shg_id)
        out.append({
            "id": inv.id,
            "shg_id": inv.shg_id,
            "shg_name": shg.name if shg else "SHG Group",
            "village": shg.village if shg else "",
            "invited_at": inv.created_at.isoformat(),
        })
    return out


@router.post("/shgs/invites/{invite_id}/respond")
def respond_to_invite(invite_id: int, body: schemas.InviteResponseIn, user=Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.get(models.SHGInvite, invite_id)
    if not inv or inv.invited_email.lower() != user.email.lower() or inv.status != "pending":
        raise HTTPException(404, "Valid pending invitation not found")

    if not body.accept:
        inv.status = "declined"
        inv.responded_at = models.now()
        audit(db, user.id, "decline_invite", "shg", inv.shg_id)
        db.commit()
        return {"ok": True, "status": "declined"}

    # User accepted: ensure user is not already in another SHG
    if user.shg_id:
        raise HTTPException(409, f"You are already a member of another SHG (#{user.shg_id}). Please leave that group first before joining a new one.")

    user.shg_id = inv.shg_id
    inv.status = "accepted"
    inv.responded_at = models.now()

    # Add to SHGMember table
    db.add(models.SHGMember(shg_id=inv.shg_id, user_id=user.id, role="member"))
    audit(db, user.id, "accept_invite", "shg", inv.shg_id)
    db.commit()
    return {"ok": True, "status": "accepted", "shg_id": inv.shg_id}


@router.post("/shgs/{shg_id}/leave")
def leave_shg(shg_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Allows a member to leave an SHG, provided they have zero outstanding active group loans."""
    if user.shg_id != shg_id:
        raise HTTPException(400, "You are not a member of this SHG")

    # Check active loans
    active_loans = db.scalars(select(models.Loan).where(
        models.Loan.user_id == user.id,
        models.Loan.shg_id == shg_id,
        models.Loan.status.in_(["approved", "disbursed"])
    )).all()
    if active_loans:
        raise HTTPException(400, "Cannot leave group while you have active group loans outstanding. Please close all loans first.")

    user.shg_id = None
    member = db.scalar(select(models.SHGMember).where(models.SHGMember.shg_id == shg_id, models.SHGMember.user_id == user.id))
    if member:
        member.active = False

    audit(db, user.id, "leave_shg", "shg", shg_id, "Member departed group")
    db.commit()
    return {"ok": True, "message": "Successfully departed the Self-Help Group"}


@router.post("/shgs/{shg_id}/members")
def add_member(shg_id: int, body: schemas.MemberIn, user=Depends(require_roles("shg_leader", "admin")), db: Session = Depends(get_db)):
    """Administrative member addition with strict single-SHG invariant check."""
    shg = _own_shg(shg_id, user, db)
    member = db.scalar(select(models.User).where(models.User.email == body.email.lower()))
    if not member:
        raise HTTPException(404, "No user with that email. Ask them to register first.")
    if member.shg_id and member.shg_id != shg.id:
        raise HTTPException(409, f"User '{member.name}' is already enrolled in another SHG (#{member.shg_id})")

    member.shg_id = shg.id
    existing_mem = db.scalar(select(models.SHGMember).where(models.SHGMember.shg_id == shg.id, models.SHGMember.user_id == member.id))
    if not existing_mem:
        db.add(models.SHGMember(shg_id=shg.id, user_id=member.id, role="member"))

    audit(db, user.id, "add_member", "shg", shg.id, member.email)
    db.commit()
    return {"shg_id": shg.id, "member": member.name}


@router.get("/shgs/{shg_id}/summary")
def shg_summary(shg_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    shg = db.get(models.SHG, shg_id)
    if not shg:
        raise HTTPException(404, "SHG not found")
    if user.role not in ("admin", "officer"):
        if user.role == "shg_leader" and shg.leader_id != user.id:
            raise HTTPException(403, "You are not the leader of this SHG")
        if user.role == "user" and user.shg_id != shg.id:
            raise HTTPException(403, "You are not a member of this SHG")

    members = db.scalars(select(models.User).where(models.User.shg_id == shg.id)).all()
    loans = db.scalars(select(models.Loan).where(models.Loan.shg_id == shg.id)).all()

    outstanding = overdue = 0
    today = date.today()
    for ln in loans:
        if ln.status not in ("approved", "disbursed"):
            continue
        for i in ln.installments:
            if i.status != "paid":
                outstanding += i.amount - i.paid_amount
                overdue += 1 if i.due_date < today else 0

    return {
        "id": shg.id,
        "name": shg.name,
        "village": shg.village,
        "monthly_thrift_amount": shg.monthly_thrift_amount,
        "corpus_balance": shg.corpus_balance,
        "members": [{"id": m.id, "name": m.name, "savings": m.savings_balance} for m in members],
        "group_loans": len(loans),
        "outstanding": round(outstanding, 2),
        "overdue_installments": overdue,
    }


# --- SHG Meetings & Quorum ---

@router.post("/shgs/{shg_id}/meetings", status_code=201)
def create_meeting(shg_id: int, body: schemas.SHGMeetingIn, user=Depends(get_current_user), db: Session = Depends(get_db)):
    shg = db.get(models.SHG, shg_id)
    if not shg:
        raise HTTPException(404, "SHG not found")
    if user.role != "admin" and shg.leader_id != user.id:
        raise HTTPException(403, "Only the SHG leader or an administrator can record group meetings")

    members = db.scalars(select(models.User).where(models.User.shg_id == shg.id)).all()
    member_ids = {m.id for m in members}
    total_members = max(1, len(members))
    attendees = [mid for mid in body.attendee_ids if mid in member_ids]
    quorum_pct = round((len(attendees) / total_members) * 100, 1)
    quorum_met = quorum_pct >= 50.0

    meeting = models.SHGMeeting(
        shg_id=shg.id,
        meeting_date=body.meeting_date,
        agenda=body.agenda,
        minutes=body.minutes,
        quorum_met=quorum_met,
        conducted_by_id=user.id,
    )
    db.add(meeting)
    db.flush()

    for mid in attendees:
        db.add(models.SHGAttendance(meeting_id=meeting.id, member_id=mid, present=True))

    audit(db, user.id, "record_meeting", "shg", shg.id, f"agenda={body.agenda} quorum={quorum_pct}%")
    db.commit()
    db.refresh(meeting)

    return {
        "id": meeting.id,
        "shg_id": meeting.shg_id,
        "meeting_date": meeting.meeting_date.isoformat(),
        "agenda": meeting.agenda,
        "minutes": meeting.minutes,
        "quorum_met": meeting.quorum_met,
        "quorum_pct": quorum_pct,
        "attendees_count": len(attendees),
        "total_members": total_members,
    }


@router.get("/shgs/{shg_id}/meetings")
def list_meetings(shg_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    shg = db.get(models.SHG, shg_id)
    if not shg:
        raise HTTPException(404, "SHG not found")
    if user.role not in ("admin", "officer") and user.shg_id != shg.id and shg.leader_id != user.id:
        raise HTTPException(403, "You do not have access to this SHG's meeting records")

    members = db.scalars(select(models.User).where(models.User.shg_id == shg.id)).all()
    total_members = max(1, len(members))

    meetings = db.scalars(select(models.SHGMeeting).where(models.SHGMeeting.shg_id == shg.id).order_by(models.SHGMeeting.meeting_date.desc())).all()
    out = []
    for m in meetings:
        att_ids = [a.member_id for a in m.attendances if a.present]
        att_names = [mem.name for mem in members if mem.id in att_ids]
        pct = round((len(att_ids) / total_members) * 100, 1)
        out.append({
            "id": m.id,
            "shg_id": m.shg_id,
            "meeting_date": m.meeting_date.isoformat(),
            "agenda": m.agenda,
            "minutes": m.minutes,
            "quorum_met": m.quorum_met,
            "quorum_pct": pct,
            "attendees_count": len(att_ids),
            "total_members": total_members,
            "attendees": att_names,
        })
    return out


# --- Thrift Savings Register ---

@router.post("/shgs/{shg_id}/thrift", status_code=201)
def pay_thrift(shg_id: int, body: schemas.ThriftDepositIn, user=Depends(get_current_user), db: Session = Depends(get_db)):
    shg = db.get(models.SHG, shg_id)
    if not shg:
        raise HTTPException(404, "SHG not found")
    if user.shg_id != shg.id and user.role != "admin":
        raise HTTPException(403, "You must be an enrolled member of this SHG to contribute thrift savings")

    tc, tx = ledger.record_thrift_contribution(
        db=db,
        member=user,
        shg=shg,
        amount=body.amount,
        source=body.source,
        reference_id=body.reference_id,
        month_year=body.month_year,
    )
    db.commit()
    db.refresh(tc)
    db.refresh(shg)

    return {
        "id": tc.id,
        "shg_id": tc.shg_id,
        "member_name": user.name,
        "month_year": tc.month_year,
        "amount": tc.amount,
        "payment_mode": tc.payment_mode,
        "status": tc.status,
        "paid_on": tc.paid_on.isoformat() if tc.paid_on else None,
        "corpus_balance": shg.corpus_balance,
    }


@router.get("/shgs/{shg_id}/thrift")
def list_thrift(shg_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    shg = db.get(models.SHG, shg_id)
    if not shg:
        raise HTTPException(404, "SHG not found")
    if user.role not in ("admin", "officer") and user.shg_id != shg.id and shg.leader_id != user.id:
        raise HTTPException(403, "You do not have access to this SHG's thrift register")

    contributions = db.scalars(
        select(models.ThriftContribution)
        .where(models.ThriftContribution.shg_id == shg.id)
        .order_by(models.ThriftContribution.created_at.desc())
    ).all()

    out = []
    for c in contributions:
        u = db.get(models.User, c.user_id)
        out.append({
            "id": c.id,
            "shg_id": c.shg_id,
            "user_id": c.user_id,
            "member_name": u.name if u else "Member",
            "month_year": c.month_year,
            "amount": c.amount,
            "payment_mode": c.payment_mode,
            "status": c.status,
            "paid_on": c.paid_on.isoformat() if c.paid_on else None,
            "created_at": c.created_at.isoformat(),
        })
    return out


# --- Internal Peer Loans (Inter-loaning) ---

@router.post("/shgs/{shg_id}/internal-loans", status_code=201)
def request_internal_loan(shg_id: int, body: schemas.InternalLoanIn, user=Depends(get_current_user), db: Session = Depends(get_db)):
    shg = db.get(models.SHG, shg_id)
    if not shg:
        raise HTTPException(404, "SHG not found")
    if user.shg_id != shg.id:
        raise HTTPException(403, "Only enrolled members of this SHG may apply for internal peer loans")

    if body.amount > shg.corpus_balance:
        raise HTTPException(
            400,
            f"Requested internal loan Rs {body.amount:,.2f} exceeds available collective SHG corpus of Rs {shg.corpus_balance:,.2f}"
        )

    loan = models.InternalLoan(
        shg_id=shg.id,
        borrower_id=user.id,
        amount=round(body.amount, 2),
        interest_rate=12.0,
        tenure_months=body.tenure_months,
        purpose=body.purpose,
        status="requested",
    )
    db.add(loan)
    audit(db, user.id, "request_internal_loan", "shg", shg.id, f"amount={body.amount}")
    db.commit()
    db.refresh(loan)

    return {
        "id": loan.id,
        "shg_id": loan.shg_id,
        "borrower_id": loan.borrower_id,
        "borrower_name": user.name,
        "amount": loan.amount,
        "interest_rate": loan.interest_rate,
        "tenure_months": loan.tenure_months,
        "purpose": loan.purpose,
        "status": loan.status,
        "repaid_amount": loan.repaid_amount,
        "created_at": loan.created_at.isoformat(),
    }


@router.get("/shgs/{shg_id}/internal-loans")
def list_internal_loans(shg_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    shg = db.get(models.SHG, shg_id)
    if not shg:
        raise HTTPException(404, "SHG not found")
    if user.role not in ("admin", "officer") and user.shg_id != shg.id and shg.leader_id != user.id:
        raise HTTPException(403, "Access restricted to SHG members and officers")

    loans = db.scalars(
        select(models.InternalLoan)
        .where(models.InternalLoan.shg_id == shg.id)
        .order_by(models.InternalLoan.created_at.desc())
    ).all()

    out = []
    for ln in loans:
        b = db.get(models.User, ln.borrower_id)
        out.append({
            "id": ln.id,
            "shg_id": ln.shg_id,
            "borrower_id": ln.borrower_id,
            "borrower_name": b.name if b else "Member",
            "amount": ln.amount,
            "interest_rate": ln.interest_rate,
            "tenure_months": ln.tenure_months,
            "purpose": ln.purpose,
            "status": ln.status,
            "repaid_amount": ln.repaid_amount,
            "created_at": ln.created_at.isoformat(),
            "decided_at": ln.decided_at.isoformat() if ln.decided_at else None,
        })
    return out


@router.post("/shgs/{shg_id}/internal-loans/{loan_id}/decide")
def decide_internal_loan(shg_id: int, loan_id: int, body: schemas.InternalLoanDecisionIn, user=Depends(get_current_user), db: Session = Depends(get_db)):
    shg = db.get(models.SHG, shg_id)
    if not shg:
        raise HTTPException(404, "SHG not found")
    if user.role != "admin" and shg.leader_id != user.id:
        raise HTTPException(403, "Only the SHG leader or administrator can sanction internal loans")

    loan = db.get(models.InternalLoan, loan_id)
    if not loan or loan.shg_id != shg_id:
        raise HTTPException(404, "Internal loan request not found")
    if loan.status != "requested":
        raise HTTPException(400, f"Cannot decide on loan with status '{loan.status}'")

    # Maker-checker: Leader cannot approve their own loan
    if loan.borrower_id == user.id:
        raise HTTPException(403, "Maker-checker violation: An SHG leader cannot approve their own internal loan.")

    loan.decided_at = models.now()
    if body.approve:
        if shg.corpus_balance < loan.amount:
            raise HTTPException(400, f"Insufficient SHG corpus balance (Available: Rs {shg.corpus_balance:,.2f}, Required: Rs {loan.amount:,.2f})")

        shg.corpus_balance = round(shg.corpus_balance - loan.amount, 2)
        borrower = db.get(models.User, loan.borrower_id)
        ledger.record_credit(
            db=db,
            user=borrower,
            amount=loan.amount,
            category="shg_loan",
            title=f"SHG Internal Microloan #{loan.id}",
            mode="SHG Corpus Disbursement",
            reference_id=f"INT-LOAN-{loan.id}",
        )
        loan.status = "active"
        notify(db, borrower.id, f"Your SHG internal loan of Rs {loan.amount:,.0f} has been approved and credited to your wallet.")
    else:
        loan.status = "rejected"
        borrower = db.get(models.User, loan.borrower_id)
        if borrower:
            notify(db, borrower.id, f"Your SHG internal loan request #{loan.id} was declined: {body.note}".strip())

    audit(db, user.id, "decide_internal_loan", "internal_loan", loan.id, f"approved={body.approve}")
    db.commit()
    db.refresh(loan)
    db.refresh(shg)
    return {
        "id": loan.id,
        "status": loan.status,
        "decided_at": loan.decided_at.isoformat(),
        "corpus_balance": shg.corpus_balance,
    }


@router.post("/shgs/{shg_id}/internal-loans/{loan_id}/repay")
def repay_internal_loan(shg_id: int, loan_id: int, body: schemas.InternalLoanRepayIn, user=Depends(get_current_user), db: Session = Depends(get_db)):
    shg = db.get(models.SHG, shg_id)
    if not shg:
        raise HTTPException(404, "SHG not found")

    loan = db.get(models.InternalLoan, loan_id)
    if not loan or loan.shg_id != shg_id:
        raise HTTPException(404, "Internal loan not found")
    if loan.status != "active":
        raise HTTPException(400, f"Only active internal loans can be repaid (current status: {loan.status})")

    borrower = db.get(models.User, loan.borrower_id)
    if user.id != borrower.id and user.role not in ("admin", "shg_leader"):
        raise HTTPException(403, "Only the borrower or SHG leader can record repayment")

    amount = round(body.amount, 2)
    ledger.record_debit(
        db=db,
        user=borrower,
        amount=amount,
        category="shg_loan_repayment",
        title=f"SHG Internal Loan Repayment #{loan.id}",
        mode="Wallet Settlement",
        reference_id=f"INT-REPAY-{loan.id}",
    )

    shg.corpus_balance = round(shg.corpus_balance + amount, 2)
    loan.repaid_amount = round(loan.repaid_amount + amount, 2)
    if loan.repaid_amount >= loan.amount:
        loan.status = "closed"
        notify(db, borrower.id, f"SHG Internal loan #{loan.id} is fully repaid and closed.")

    audit(db, user.id, "repay_internal_loan", "internal_loan", loan.id, f"amount={amount}")
    db.commit()
    db.refresh(loan)
    db.refresh(shg)

    return {
        "id": loan.id,
        "repaid_amount": loan.repaid_amount,
        "amount": loan.amount,
        "status": loan.status,
        "corpus_balance": shg.corpus_balance,
    }


# ---- Savings Goals & Ledger Invariant Fixes ----

@router.post("/savings/goals", status_code=201)
def create_goal(body: schemas.GoalIn, user=Depends(get_current_user), db: Session = Depends(get_db)):
    g = models.SavingsGoal(user_id=user.id, title=body.title, target_amount=body.target_amount, deadline=body.deadline)
    db.add(g)
    db.commit()
    return _goal(g)


def _goal(g: models.SavingsGoal) -> dict:
    return {
        "id": g.id,
        "title": g.title,
        "target_amount": g.target_amount,
        "saved_amount": g.saved_amount,
        "progress_pct": round(min(100, g.saved_amount / g.target_amount * 100), 1),
        "deadline": g.deadline.isoformat() if g.deadline else None,
    }


@router.get("/savings/goals")
def list_goals(user=Depends(get_current_user), db: Session = Depends(get_db)):
    gs = db.scalars(select(models.SavingsGoal).where(models.SavingsGoal.user_id == user.id)).all()
    return [_goal(g) for g in gs]


@router.post("/savings/goals/{goal_id}/deposit")
def deposit_to_goal(goal_id: int, body: schemas.DepositIn, user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Deposits funds into a goal directly from external UPI/Bank."""
    g = db.get(models.SavingsGoal, goal_id)
    if not g or g.user_id != user.id:
        raise HTTPException(404, "Goal not found")

    amount = round(body.amount, 2)
    g.saved_amount = round(g.saved_amount + amount, 2)
    db.add(models.SavingsEntry(goal_id=g.id, amount=amount))
    db.add(models.Transaction(
        user_id=user.id,
        category="savings_deposit",
        title=f"Savings Deposit: {g.title}",
        amount=amount,
        is_credit=True,
        mode="UPI / Bank",
        reference_id=f"GOAL-{g.id}",
    ))
    audit(db, user.id, "goal_deposit", "goal", g.id, f"amount={amount}")
    db.commit()
    return _goal(g)


@router.post("/savings/goals/{goal_id}/withdraw")
def withdraw_from_goal(goal_id: int, body: schemas.DepositIn, user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Withdraws funds from a savings goal back to the main wallet."""
    g = db.get(models.SavingsGoal, goal_id)
    if not g or g.user_id != user.id:
        raise HTTPException(404, "Goal not found")

    ledger.record_transfer_from_goal(db, user, g, body.amount)
    db.commit()
    return _goal(g)


@router.delete("/savings/goals/{goal_id}")
def delete_goal(goal_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Deletes goal and refunds accumulated savings back to the user's main wallet."""
    g = db.get(models.SavingsGoal, goal_id)
    if not g or g.user_id != user.id:
        raise HTTPException(404, "Goal not found")

    refund_amt = g.saved_amount
    if refund_amt > 0:
        ledger.record_credit(
            db=db,
            user=user,
            amount=refund_amt,
            category="goal_withdrawal",
            title=f"Goal Closed (Refund): {g.title}",
            mode="Goal Closure Refund",
            reference_id=f"GOAL-CLOSE-{g.id}",
        )

    audit(db, user.id, "delete_goal", "goal", g.id, f"refunded={refund_amt}")
    db.delete(g)
    db.commit()
    return {"ok": True, "message": f"Goal deleted. Rs {refund_amt:,.2f} refunded to wallet balance."}
