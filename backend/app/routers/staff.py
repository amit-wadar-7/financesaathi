"""Dashboards, officer early-warning, notifications, reminders, audit log."""
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..deps import get_current_user, notify, require_roles

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
    for ln in loans:
        if ln.status != "approved":
            continue
        for i in ln.installments:
            if i.status != "paid":
                outstanding += i.amount - i.paid_amount
                if next_due is None or i.due_date < next_due["due_date"]:
                    next_due = {
                        "loan_id": ln.id,
                        "purpose": ln.purpose or "Microfinance Facility",
                        "number": i.number,
                        "due_date": i.due_date.isoformat(),
                        "amount": i.amount - i.paid_amount,
                        "overdue": i.due_date < date.today(),
                    }

    goals = db.scalars(select(models.SavingsGoal).where(models.SavingsGoal.user_id == user.id)).all()
    done = db.scalar(select(func.count()).select_from(models.CourseProgress).where(
        models.CourseProgress.user_id == user.id, models.CourseProgress.completed.is_(True)))

    # SHG details
    shg_info = None
    if user.shg_id:
        shg_obj = db.get(models.SHG, user.shg_id)
        if shg_obj:
            shg_info = {"id": shg_obj.id, "name": shg_obj.name, "village": shg_obj.village}

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

    # Real transaction history
    txns = []
    entries = db.scalars(select(models.SavingsEntry).join(models.SavingsGoal).where(
        models.SavingsGoal.user_id == user.id).order_by(models.SavingsEntry.id.desc()).limit(8)).all()
    for e in entries:
        goal = db.get(models.SavingsGoal, e.goal_id)
        txns.append({
            "id": f"sav-{e.id}",
            "date": e.created_at.strftime("%d %b %Y"),
            "type": f"Savings Deposit: {goal.title if goal else 'Target Goal'}",
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
            "type": f"EMI Payment: Loan #{pi.loan_id} (Instalment #{pi.number})",
            "amount": pi.paid_amount,
            "mode": "UPI Settlement",
            "is_credit": False,
        })
    if not txns and user.savings_balance > 0:
        txns.append({
            "id": "open-1",
            "date": user.created_at.strftime("%d %b %Y"),
            "type": "Opening Verified Savings Deposit",
            "amount": user.savings_balance,
            "mode": "Core Banking Ledger",
            "is_credit": True,
        })

    tot_saved = round(sum(g.saved_amount for g in goals), 2)
    tot_assets = round(user.savings_balance + tot_saved, 2)

    return {
        "role": user.role,
        "name": user.name,
        "shg": shg_info,
        "active_loans": sum(1 for l in loans if l.status == "approved"),
        "pending_loans": sum(1 for l in loans if l.status == "pending"),
        "outstanding": round(outstanding, 2),
        "next_installment": next_due,
        "savings_balance": user.savings_balance,
        "total_saved": tot_saved,
        "total_savings_and_assets": tot_assets,
        "monthly_income": user.monthly_income,
        "monthly_expenses": user.monthly_expenses,
        "existing_emi": user.existing_emi,
        "top_goal": top_goal,
        "health_score": health_score_raw,
        "cibil_score": cibil_equivalent,
        "transactions": txns,
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
