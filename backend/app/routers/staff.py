"""Dashboards, officer early-warning, notifications, reminders, audit log."""
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import ledger, models, schemas
from ..database import get_db
from ..deps import audit, get_current_user, notify, require_roles

router = APIRouter(tags=["staff"])


def _overdue_count(loan: models.Loan) -> int:
    return sum(1 for i in loan.installments if i.status != "paid" and i.due_date < date.today())


@router.get("/officer/at-risk")
def at_risk(_=Depends(require_roles("officer", "admin")), db: Session = Depends(get_db)):
    """Early-warning: active loans with overdue instalments or a low affordability score at application."""
    out = []
    for ln in db.scalars(select(models.Loan).where(models.Loan.status == "approved")).all():
        overdue = _overdue_count(ln)
        if overdue or ln.ai_score < 0.4:
            reasons = []
            if overdue:
                reasons.append(f"{overdue} overdue instalment(s)")
            if ln.ai_score < 0.4:
                reasons.append(f"low affordability score at application ({ln.ai_score:.2f})")
            out.append({"loan_id": ln.id, "borrower": ln.user.name, "overdue": overdue,
                        "ai_score": ln.ai_score, "reasons": reasons})
    return sorted(out, key=lambda r: (-r["overdue"], r["ai_score"]))


@router.post("/money/deposit")
def deposit_funds(body: schemas.WalletDepositIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Wallet top-up / UPI deposit with authoritative ledger recording."""
    ref = body.reference_id or f"DEP-{int(date.today().strftime('%Y%m%d'))}-{user.id}"
    tx = ledger.record_credit(
        db=db,
        user=user,
        amount=body.amount,
        category="wallet_deposit",
        title=f"Wallet Top-Up ({body.mode})",
        mode=body.mode,
        reference_id=ref,
    )
    db.commit()
    db.refresh(tx)
    return {
        "ok": True,
        "balance": user.savings_balance,
        "transaction": {
            "id": f"tx-{tx.id}",
            "date": tx.created_at.strftime("%d %b %Y"),
            "category": tx.category,
            "type": tx.title,
            "title": tx.title,
            "amount": tx.amount,
            "mode": tx.mode,
            "reference_id": tx.reference_id,
            "is_credit": True,
        },
    }


@router.post("/money/income")
def add_income(body: schemas.IncomeIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    tx = ledger.record_credit(
        db=db,
        user=user,
        amount=body.amount,
        category=body.category,
        title=body.title,
        mode=body.mode,
        reference_id=f"INC-{user.id}",
    )
    db.commit()
    db.refresh(tx)
    return {
        "ok": True,
        "balance": user.savings_balance,
        "transaction": {
            "id": f"tx-{tx.id}",
            "date": tx.created_at.strftime("%d %b %Y"),
            "category": tx.category,
            "type": tx.title,
            "title": tx.title,
            "amount": tx.amount,
            "mode": tx.mode,
            "is_credit": tx.is_credit,
        },
    }


@router.post("/money/expense")
def add_expense(body: schemas.ExpenseIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    tx = ledger.record_debit(
        db=db,
        user=user,
        amount=body.amount,
        category=body.category,
        title=body.title,
        mode=body.mode,
        reference_id=f"EXP-{user.id}",
    )
    db.commit()
    db.refresh(tx)
    return {
        "ok": True,
        "balance": user.savings_balance,
        "transaction": {
            "id": f"tx-{tx.id}",
            "date": tx.created_at.strftime("%d %b %Y"),
            "category": tx.category,
            "type": tx.title,
            "title": tx.title,
            "amount": tx.amount,
            "mode": tx.mode,
            "is_credit": tx.is_credit,
        },
    }


@router.post("/money/transfer")
def transfer_to_goal(body: schemas.TransferIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.get(models.SavingsGoal, body.target_goal_id)
    if not goal or goal.user_id != user.id:
        raise HTTPException(404, "Savings goal not found")

    tx = ledger.record_transfer_to_goal(db, user, goal, body.amount, body.note)
    db.commit()
    db.refresh(tx)
    return {
        "ok": True,
        "balance": user.savings_balance,
        "goal_saved": goal.saved_amount,
        "transaction": {
            "id": f"tx-{tx.id}",
            "date": tx.created_at.strftime("%d %b %Y"),
            "category": tx.category,
            "type": tx.title,
            "title": tx.title,
            "amount": tx.amount,
            "mode": tx.mode,
            "is_credit": tx.is_credit,
        },
    }


@router.get("/money/transactions")
def list_transactions(category: str | None = None, limit: int = 50, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = select(models.Transaction).where(models.Transaction.user_id == user.id)
    if category:
        q = q.where(models.Transaction.category == category)
    rows = db.scalars(q.order_by(models.Transaction.id.desc()).limit(min(limit, 100))).all()
    return [{
        "id": f"tx-{t.id}",
        "raw_id": t.id,
        "date": t.created_at.strftime("%d %b %Y"),
        "category": t.category,
        "type": t.title,
        "title": t.title,
        "amount": t.amount,
        "mode": t.mode,
        "is_credit": t.is_credit,
        "reference_id": t.reference_id,
        "created_at": t.created_at.isoformat(),
    } for t in rows]


@router.get("/dashboard")
def dashboard(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role in ("officer", "admin"):
        counts = dict(db.execute(select(models.Loan.status, func.count()).group_by(models.Loan.status)).all())
        d = {"role": user.role, "loans_by_status": counts,
             "pending_review": counts.get("pending", 0),
             "overdue_loans": sum(1 for l in db.scalars(select(models.Loan).where(models.Loan.status == "approved"))
                                  if _overdue_count(l))}
        if user.role == "admin":
            d["total_users"] = db.scalar(select(func.count()).select_from(models.User))
        return d

    loans = db.scalars(select(models.Loan).where(models.Loan.user_id == user.id)).all()
    outstanding, next_due = 0.0, None
    next_due_date = None
    upcoming_repayments = []

    for ln in loans:
        if ln.status != "approved":
            continue
        unpaid = [i for i in ln.installments if i.status != "paid"]
        for i in unpaid:
            outstanding += i.amount - i.paid_amount
            days_left = (i.due_date - date.today()).days
            if next_due_date is None or i.due_date < next_due_date:
                next_due_date = i.due_date
                next_due = {
                    "loan_id": ln.id,
                    "purpose": ln.purpose or "Microfinance Facility",
                    "number": i.number,
                    "due_date": i.due_date.isoformat(),
                    "amount": i.amount - i.paid_amount,
                    "days_left": days_left,
                    "overdue": days_left < 0,
                }
            if len(upcoming_repayments) < 3:
                upcoming_repayments.append({
                    "id": f"inst-{i.id}",
                    "loan_id": ln.id,
                    "title": f"Loan Repayment: {ln.purpose or 'Microfinance'}",
                    "purpose": ln.purpose or "Microfinance Facility",
                    "number": i.number,
                    "amount": round(i.amount - i.paid_amount, 2),
                    "due_date": i.due_date.strftime("%d %b %Y"),
                    "raw_due_date": i.due_date.isoformat(),
                    "days_left": days_left,
                    "status_text": "Overdue" if days_left < 0 else f"Due in {days_left} days" if days_left <= 7 else "Scheduled",
                    "overdue": days_left < 0,
                    "type": "loan_emi",
                })

    goals = db.scalars(select(models.SavingsGoal).where(models.SavingsGoal.user_id == user.id)).all()
    done = db.scalar(select(func.count()).select_from(models.CourseProgress).where(
        models.CourseProgress.user_id == user.id, models.CourseProgress.completed.is_(True)))

    # SHG details
    shg_info = None
    if user.shg_id:
        shg_obj = db.get(models.SHG, user.shg_id)
        if shg_obj:
            shg_info = {"id": shg_obj.id, "name": shg_obj.name, "village": shg_obj.village}
            # Add SHG monthly thrift due to upcoming repayments
            thrift_due_day = 25
            today = date.today()
            if today.day <= thrift_due_day:
                thrift_date = today.replace(day=thrift_due_day)
            else:
                thrift_date = (today + timedelta(days=20)).replace(day=thrift_due_day)
            days_thrift = (thrift_date - today).days
            upcoming_repayments.append({
                "id": "shg-thrift",
                "loan_id": None,
                "title": f"SHG Monthly Contribution ({shg_obj.name})",
                "purpose": "Monthly Thrift Pool",
                "number": 1,
                "amount": 500.0,
                "due_date": thrift_date.strftime("%d %b %Y"),
                "raw_due_date": thrift_date.isoformat(),
                "days_left": days_thrift,
                "status_text": "Scheduled",
                "overdue": False,
                "type": "shg_thrift",
            })

    # Top goal
    top_goal = None
    if goals:
        g0 = goals[0]
        top_goal = {
            "id": g0.id,
            "title": g0.title,
            "saved_amount": g0.saved_amount,
            "target_amount": g0.target_amount,
            "progress_pct": round(min(100.0, (g0.saved_amount / g0.target_amount * 100) if g0.target_amount > 0 else 0), 1),
        }

    # Real health score calculation
    score = 100.0
    if user.monthly_income > 0:
        foir = (user.existing_emi) / user.monthly_income
        exp_ratio = user.monthly_expenses / user.monthly_income
        cov = (user.savings_balance / user.monthly_expenses) if user.monthly_expenses > 0 else 0
        score -= max(0, foir - 0.2) * 100
        score -= max(0, exp_ratio - 0.6) * 80
        score += min(cov, 6) * 3
    overdue_count = sum(1 for ln in loans if ln.status == "approved" for i in ln.installments if i.status != "paid" and i.due_date < date.today())
    score -= overdue_count * 8
    health_score_raw = int(max(0, min(100, score)))
    cibil_equivalent = int(300 + (health_score_raw / 100.0) * 600)

    # Real transaction history from Transaction table
    txns = []
    db_txns = db.scalars(select(models.Transaction).where(
        models.Transaction.user_id == user.id).order_by(models.Transaction.id.desc()).limit(12)).all()
    if db_txns:
        for t in db_txns:
            txns.append({
                "id": f"tx-{t.id}",
                "date": t.created_at.strftime("%d %b %Y"),
                "category": t.category,
                "type": t.title,
                "title": t.title,
                "amount": t.amount,
                "mode": t.mode,
                "is_credit": t.is_credit,
            })
    else:
        # Fallback to legacy entries if no new transactions recorded yet
        entries = db.scalars(select(models.SavingsEntry).join(models.SavingsGoal).where(
            models.SavingsGoal.user_id == user.id).order_by(models.SavingsEntry.id.desc()).limit(8)).all()
        for e in entries:
            goal = db.get(models.SavingsGoal, e.goal_id)
            txns.append({
                "id": f"sav-{e.id}",
                "date": e.created_at.strftime("%d %b %Y"),
                "category": "savings_deposit",
                "type": f"Savings Deposit: {goal.title if goal else 'Target Goal'}",
                "title": f"Savings Deposit: {goal.title if goal else 'Target Goal'}",
                "amount": e.amount,
                "mode": "UPI / Bank",
                "is_credit": True,
            })
        paid_insts = db.scalars(select(models.Installment).join(models.Loan).where(
            models.Loan.user_id == user.id, models.Installment.paid_amount > 0).order_by(models.Installment.id.desc()).limit(8)).all()
        for pi in paid_insts:
            txns.append({
                "id": f"inst-{pi.id}",
                "date": (pi.paid_on or pi.due_date).strftime("%d %b %Y"),
                "category": "emi_payment",
                "type": f"EMI Payment: Loan #{pi.loan_id} (Instalment #{pi.number})",
                "title": f"EMI Payment: Loan #{pi.loan_id} (Instalment #{pi.number})",
                "amount": pi.paid_amount,
                "mode": "UPI Settlement",
                "is_credit": False,
            })
        if not txns and user.savings_balance > 0:
            txns.append({
                "id": "open-1",
                "date": user.created_at.strftime("%d %b %Y"),
                "category": "general",
                "type": "Opening Verified Savings Deposit",
                "title": "Opening Verified Savings Deposit",
                "amount": user.savings_balance,
                "mode": "Core Banking Ledger",
                "is_credit": True,
            })

    tot_saved = round(sum(g.saved_amount for g in goals), 2)
    tot_assets = round(user.savings_balance + tot_saved, 2)

    # 6-Month cashflow history calculated dynamically from actual transactions
    today = date.today()
    months_series = []
    curr_y, curr_m = today.year, today.month
    for offset in range(5, -1, -1):
        m = curr_m - offset
        y = curr_y
        while m <= 0:
            m += 12
            y -= 1
        m_date = date(y, m, 1)
        months_series.append((y, m, m_date.strftime("%b")))

    earliest_date = date(months_series[0][0], months_series[0][1], 1)
    txs_period = db.scalars(
        select(models.Transaction).where(
            models.Transaction.user_id == user.id,
            models.Transaction.created_at >= earliest_date,
        )
    ).all()

    monthly_credits = {}
    monthly_debits = {}
    for tx in txs_period:
        key = (tx.created_at.year, tx.created_at.month)
        if tx.is_credit:
            monthly_credits[key] = monthly_credits.get(key, 0.0) + tx.amount
        else:
            monthly_debits[key] = monthly_debits.get(key, 0.0) + tx.amount

    cashflow_history = []
    for y, m, lbl in months_series:
        inc = monthly_credits.get((y, m), 0.0)
        exp = monthly_debits.get((y, m), 0.0)
        if inc == 0.0 and exp == 0.0 and (y, m) == (curr_y, curr_m):
            inc = user.monthly_income or 0.0
            exp = user.monthly_expenses or 0.0
        cashflow_history.append({
            "month": lbl,
            "income": round(inc, 2),
            "expenses": round(exp, 2),
        })

    curr_inc = cashflow_history[-1]["income"]
    curr_exp = cashflow_history[-1]["expenses"]
    prev_inc = cashflow_history[-2]["income"] if len(cashflow_history) >= 2 else 0.0
    prev_exp = cashflow_history[-2]["expenses"] if len(cashflow_history) >= 2 else 0.0

    inc_delta = f"{((curr_inc - prev_inc) / prev_inc * 100):+.0f}%" if prev_inc > 0 else ("+100%" if curr_inc > 0 else "0%")
    exp_delta = f"{((curr_exp - prev_exp) / prev_exp * 100):+.0f}%" if prev_exp > 0 else ("+100%" if curr_exp > 0 else "0%")
    curr_sav = max(0.0, curr_inc - curr_exp)
    prev_sav = max(0.0, prev_inc - prev_exp)
    sav_delta = f"{((curr_sav - prev_sav) / prev_sav * 100):+.0f}%" if prev_sav > 0 else ("+100%" if curr_sav > 0 else "0%")

    kpi_metrics = {
        "income_this_month": round(curr_inc, 2),
        "income_delta": inc_delta,
        "expenses_this_month": round(curr_exp, 2),
        "expenses_delta": exp_delta,
        "savings_this_month": round(curr_sav, 2),
        "savings_delta": sav_delta,
    }

    seasonal_tip = {
        "title": "Sugarcane & Rabi Harvest Advisory",
        "description": "Upcoming sugarcane harvest in Nov-Dec. Consider setting aside 20% extra into your emergency fund to build a 6-month buffer before planting season.",
        "action_label": "Calculate Harvest Plan →",
        "action_target": "/tools?calc=kisan",
    }

    return {
        "role": user.role,
        "name": user.name,
        "shg": shg_info,
        "active_loans": sum(1 for l in loans if l.status == "approved"),
        "pending_loans": sum(1 for l in loans if l.status == "pending"),
        "outstanding": round(outstanding, 2),
        "next_installment": next_due,
        "upcoming_repayments": upcoming_repayments,
        "savings_balance": user.savings_balance,
        "total_saved": tot_saved,
        "total_savings_and_assets": tot_assets,
        "monthly_income": user.monthly_income,
        "monthly_expenses": user.monthly_expenses,
        "existing_emi": user.existing_emi,
        "top_goal": top_goal,
        "goals": [{"id": g.id, "title": g.title, "saved_amount": g.saved_amount, "target_amount": g.target_amount} for g in goals],
        "health_score": health_score_raw,
        "cibil_score": cibil_equivalent,
        "transactions": txns,
        "cashflow_history": cashflow_history,
        "kpi_metrics": kpi_metrics,
        "seasonal_tip": seasonal_tip,
        "courses_completed": done,
    }



@router.get("/notifications")
def notifications(user=Depends(get_current_user), db: Session = Depends(get_db)):
    ns = db.scalars(select(models.Notification).where(models.Notification.user_id == user.id)
                    .order_by(models.Notification.id.desc()).limit(50)).all()
    return [{"id": n.id, "message": n.message, "read": n.read, "created_at": n.created_at} for n in ns]


@router.post("/notifications/{nid}/read")
def mark_read(nid: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.get(models.Notification, nid)
    if n and n.user_id == user.id:
        n.read = True
        db.commit()
    return {"ok": True}


def run_reminders(db: Session, days_ahead: int = 3) -> int:
    """Create in-app reminders for instalments due soon (call daily; free alternative to SMS)."""
    limit = date.today() + timedelta(days=days_ahead)
    count = 0
    rows = db.scalars(select(models.Installment).where(
        models.Installment.status != "paid", models.Installment.reminded.is_(False),
        models.Installment.due_date <= limit)).all()
    for i in rows:
        notify(db, i.loan.user_id, f"Reminder: instalment {i.number} of Rs {i.amount:,.0f} for loan #{i.loan_id} "
                                   f"is due on {i.due_date.isoformat()}.")
        i.reminded = True
        count += 1
    db.commit()
    return count


@router.post("/admin/run-reminders")
def reminders(_=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    return {"created": run_reminders(db)}


@router.get("/admin/audit")
def audit_log(limit: int = 100, _=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    rows = db.scalars(select(models.AuditLog).order_by(models.AuditLog.id.desc()).limit(min(limit, 500))).all()
    return [{"id": r.id, "actor_id": r.actor_id, "action": r.action, "entity": r.entity,
             "entity_id": r.entity_id, "detail": r.detail, "created_at": r.created_at} for r in rows]
