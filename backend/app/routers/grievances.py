from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, notify, require_roles

router = APIRouter(prefix="/grievances", tags=["grievances"])


@router.post("", response_model=schemas.GrievanceOut, status_code=status.HTTP_201_CREATED)
def lodge_grievance(
    body: schemas.GrievanceIn,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lodge a formal grievance ticket under RBI Fair Practice Redressal mechanism."""
    g = models.Grievance(
        user_id=user.id,
        category=body.category,
        subject=body.subject,
        description=body.description,
        status="open",
        response="",
    )
    db.add(g)
    db.flush()

    notify(
        db,
        user.id,
        f"Grievance #{g.id} registered: '{g.subject[:35]}'. Statutory turnaround time is within 30 days under RBI code.",
    )
    db.commit()
    db.refresh(g)
    return g


@router.get("", response_model=list[schemas.GrievanceOut])
def list_grievances(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve grievances. Borrowers view their own tickets; staff/officers/admins view institutional register."""
    if user.role in ("officer", "admin"):
        grievances = db.scalars(
            select(models.Grievance).order_by(models.Grievance.created_at.desc())
        ).all()
    else:
        grievances = db.scalars(
            select(models.Grievance)
            .where(models.Grievance.user_id == user.id)
            .order_by(models.Grievance.created_at.desc())
        ).all()
    return grievances


@router.get("/{grievance_id}", response_model=schemas.GrievanceOut)
def get_grievance(
    grievance_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch grievance details by ID with access control."""
    g = db.get(models.Grievance, grievance_id)
    if not g:
        raise HTTPException(status_code=404, detail="Grievance ticket not found")
    if g.user_id != user.id and user.role not in ("officer", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to view this ticket")
    return g


@router.post("/{grievance_id}/resolve", response_model=schemas.GrievanceOut)
def resolve_grievance(
    grievance_id: int,
    body: schemas.GrievanceResponseIn,
    staff: models.User = Depends(require_roles("officer", "admin")),
    db: Session = Depends(get_db),
):
    """Staff or Administrator marks grievance as resolved or in progress with official resolution remarks."""
    g = db.get(models.Grievance, grievance_id)
    if not g:
        raise HTTPException(status_code=404, detail="Grievance ticket not found")

    g.status = body.status
    g.response = body.response
    g.resolved_by = staff.id
    if body.status == "resolved":
        g.resolved_at = datetime.now()

    notify(
        db,
        g.user_id,
        f"Grievance #{g.id} updated to {g.status.upper()}: {g.response[:60]}",
    )
    db.commit()
    db.refresh(g)
    return g
