"""SHGs (group lending) and savings goals."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import audit, get_current_user, require_roles

router = APIRouter(tags=["community"])


def _own_shg(shg_id: int, user: models.User, db: Session) -> models.SHG:
    shg = db.get(models.SHG, shg_id)
    if not shg or (user.role != "admin" and shg.leader_id != user.id):
        raise HTTPException(404, "SHG not found")
    return shg


@router.post("/shgs", status_code=201)
def create_shg(body: schemas.SHGIn, user=Depends(require_roles("shg_leader", "admin")),
               db: Session = Depends(get_db)):
    shg = models.SHG(name=body.name, village=body.village, leader_id=user.id)
    db.add(shg)
    db.flush()
    if user.role == "shg_leader":
        user.shg_id = shg.id
    audit(db, user.id, "create_shg", "shg", shg.id)
    db.commit()
    return {"id": shg.id, "name": shg.name, "village": shg.village}


@router.post("/shgs/{shg_id}/members")
def add_member(shg_id: int, body: schemas.MemberIn, user=Depends(require_roles("shg_leader", "admin")),
               db: Session = Depends(get_db)):
    shg = _own_shg(shg_id, user, db)
    member = db.scalar(select(models.User).where(models.User.email == body.email.lower()))
    if not member:
        raise HTTPException(404, "No user with that email. Ask them to register first.")
    member.shg_id = shg.id
    audit(db, user.id, "add_member", "shg", shg.id, member.email)
    db.commit()
    return {"shg_id": shg.id, "member": member.name}


@router.get("/shgs/{shg_id}/summary")
def shg_summary(shg_id: int, user=Depends(require_roles("shg_leader", "admin", "officer")),
                db: Session = Depends(get_db)):
    shg = db.get(models.SHG, shg_id)
    if not shg or (user.role == "shg_leader" and shg.leader_id != user.id):
        raise HTTPException(404, "SHG not found")
    members = db.scalars(select(models.User).where(models.User.shg_id == shg.id)).all()
    loans = db.scalars(select(models.Loan).where(models.Loan.shg_id == shg.id)).all()
    from datetime import date
    outstanding = overdue = 0
    for ln in loans:
        if ln.status != "approved":
            continue
        for i in ln.installments:
            if i.status != "paid":
                outstanding += i.amount - i.paid_amount
                overdue += 1 if i.due_date < date.today() else 0
    return {"id": shg.id, "name": shg.name, "village": shg.village,
            "members": [{"id": m.id, "name": m.name} for m in members],
            "group_loans": len(loans), "outstanding": round(outstanding, 2), "overdue_installments": overdue}


# ---- savings goals ----
@router.post("/savings/goals", status_code=201)
def create_goal(body: schemas.GoalIn, user=Depends(get_current_user), db: Session = Depends(get_db)):
    g = models.SavingsGoal(user_id=user.id, title=body.title, target_amount=body.target_amount,
                           deadline=body.deadline)
    db.add(g)
    db.commit()
    return _goal(g)


def _goal(g: models.SavingsGoal) -> dict:
    return {"id": g.id, "title": g.title, "target_amount": g.target_amount, "saved_amount": g.saved_amount,
            "progress_pct": round(min(100, g.saved_amount / g.target_amount * 100), 1),
            "deadline": g.deadline.isoformat() if g.deadline else None}


@router.get("/savings/goals")
def list_goals(user=Depends(get_current_user), db: Session = Depends(get_db)):
    gs = db.scalars(select(models.SavingsGoal).where(models.SavingsGoal.user_id == user.id)).all()
    return [_goal(g) for g in gs]


@router.post("/savings/goals/{goal_id}/deposit")
def deposit(goal_id: int, body: schemas.DepositIn, user=Depends(get_current_user), db: Session = Depends(get_db)):
    g = db.get(models.SavingsGoal, goal_id)
    if not g or g.user_id != user.id:
        raise HTTPException(404, "Goal not found")
    g.saved_amount = round(g.saved_amount + body.amount, 2)
    db.add(models.SavingsEntry(goal_id=g.id, amount=body.amount))
    db.commit()
    return _goal(g)
