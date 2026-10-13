import time
from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import audit, get_current_user, require_roles
from ..security import (
    create_token,
    generate_refresh_token,
    generate_reset_token,
    hash_password,
    verify_password,
)

router = APIRouter(tags=["auth"])

# In-memory rate limiting for login attempts
_FAILED_LOGINS = defaultdict(list)
_MAX_FAILED_ATTEMPTS = 5
_LOCKOUT_WINDOW_SECONDS = 900  # 15 minutes lockout


def _check_rate_limit(email: str):
    now = time.time()
    valid_attempts = [t for t in _FAILED_LOGINS[email] if now - t < _LOCKOUT_WINDOW_SECONDS]
    _FAILED_LOGINS[email] = valid_attempts
    if len(valid_attempts) >= _MAX_FAILED_ATTEMPTS:
        raise HTTPException(
            429,
            "Account temporarily locked due to 5 consecutive failed login attempts. Please wait 15 minutes before trying again."
        )


def _record_failed_attempt(email: str):
    _FAILED_LOGINS[email].append(time.time())


def _clear_failed_attempts(email: str):
    _FAILED_LOGINS.pop(email, None)


@router.post("/auth/register", response_model=schemas.UserOut, status_code=201)
def register(body: schemas.RegisterIn, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.scalar(select(models.User).where(models.User.email == email)):
        raise HTTPException(409, "Email already registered")

    user = models.User(
        name=body.name,
        email=email,
        phone=body.phone,
        language=body.language,
        password_hash=hash_password(body.password),
        role="user",
        consent_version="1.0",
        consent_given_at=datetime.now(timezone.utc).replace(tzinfo=None),
        declared_savings=0.0,
        savings_balance=0.0,
    )
    db.add(user)
    db.flush()
    audit(db, user.id, "register", "user", user.id, "DPDP consent recorded (v1.0)")
    db.commit()
    db.refresh(user)
    return user


@router.post("/auth/login", response_model=schemas.TokenOut)
def login(body: schemas.LoginIn, db: Session = Depends(get_db)):
    email = body.email.lower()
    _check_rate_limit(email)
    user = db.scalar(select(models.User).where(models.User.email == email))
    if not user or not verify_password(body.password, user.password_hash):
        _record_failed_attempt(email)
        raise HTTPException(401, "Incorrect email or password")

    if not user.is_active:
        raise HTTPException(403, "Account is disabled. Contact system administrator.")

    _clear_failed_attempts(email)

    access_token = create_token(user.id, user.role)
    refresh_tok, exp = generate_refresh_token()
    db.add(models.RefreshToken(user_id=user.id, token=refresh_tok, expires_at=exp))
    audit(db, user.id, "login", "user", user.id, "User session initiated")
    db.commit()

    return schemas.TokenOut(
        access_token=access_token,
        refresh_token=refresh_tok,
        role=user.role,
        user_id=user.id,
        name=user.name,
    )


@router.post("/auth/refresh", response_model=schemas.TokenOut)
def refresh_token(body: schemas.RefreshTokenIn, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    rt = db.scalar(
        select(models.RefreshToken).where(
            models.RefreshToken.token == body.refresh_token,
            models.RefreshToken.revoked.is_(False),
            models.RefreshToken.expires_at > now,
        )
    )
    if not rt:
        raise HTTPException(401, "Invalid or expired refresh token")

    # Rotate refresh token
    rt.revoked = True
    user = db.get(models.User, rt.user_id)
    if not user or not user.is_active:
        raise HTTPException(401, "User account no longer active")

    new_access = create_token(user.id, user.role)
    new_refresh, exp = generate_refresh_token()
    db.add(models.RefreshToken(user_id=user.id, token=new_refresh, expires_at=exp))
    db.commit()

    return schemas.TokenOut(
        access_token=new_access,
        refresh_token=new_refresh,
        role=user.role,
        user_id=user.id,
        name=user.name,
    )


@router.post("/auth/change-password")
def change_password(body: schemas.ChangePasswordIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(body.old_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect")

    user.password_hash = hash_password(body.new_password)
    audit(db, user.id, "change_password", "user", user.id, "Password updated successfully")
    db.commit()
    return {"ok": True, "message": "Password changed successfully"}


@router.post("/auth/forgot-password")
def forgot_password(body: schemas.ForgotPasswordIn, db: Session = Depends(get_db)):
    user = db.scalar(select(models.User).where(models.User.email == body.email.lower()))
    if user:
        token, exp = generate_reset_token()
        db.add(models.PasswordResetToken(user_id=user.id, token=token, expires_at=exp))
        db.commit()
        # In development / local environment, log the reset token to console
        print(f"[AUTH DEV] Password reset token for {user.email}: {token} (Valid for 15 mins)")

    return {"message": "If your email is registered, a password reset link has been dispatched."}


@router.post("/auth/reset-password")
def reset_password(body: schemas.ResetPasswordIn, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    prt = db.scalar(
        select(models.PasswordResetToken).where(
            models.PasswordResetToken.token == body.token,
            models.PasswordResetToken.used.is_(False),
            models.PasswordResetToken.expires_at > now,
        )
    )
    if not prt:
        raise HTTPException(400, "Invalid or expired reset token")

    user = db.get(models.User, prt.user_id)
    if not user:
        raise HTTPException(404, "User not found")

    user.password_hash = hash_password(body.new_password)
    prt.used = True
    audit(db, user.id, "reset_password", "user", user.id, "Password reset with token")
    db.commit()
    return {"ok": True, "message": "Password reset successfully. You can now login with your new password."}


@router.post("/auth/logout")
def logout(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Revoke all active refresh tokens for the user
    tokens = db.scalars(select(models.RefreshToken).where(models.RefreshToken.user_id == user.id, models.RefreshToken.revoked.is_(False))).all()
    for t in tokens:
        t.revoked = True
    audit(db, user.id, "logout", "user", user.id, "Session terminated")
    db.commit()
    return {"ok": True, "message": "Logged out successfully"}


@router.get("/auth/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user


@router.patch("/auth/me", response_model=schemas.UserOut)
def update_profile(body: schemas.ProfileIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(user, k, v)
    audit(db, user.id, "update_profile", "user", user.id, "Profile demographic details updated")
    db.commit()
    return user


@router.get("/me/export")
def export_user_data(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """DPDP Act 2023 - Right to Data Portability: export complete user portfolio as JSON."""
    loans = db.scalars(select(models.Loan).where(models.Loan.user_id == user.id)).all()
    goals = db.scalars(select(models.SavingsGoal).where(models.SavingsGoal.user_id == user.id)).all()
    txs = db.scalars(select(models.Transaction).where(models.Transaction.user_id == user.id)).all()
    progress = db.scalars(select(models.CourseProgress).where(models.CourseProgress.user_id == user.id)).all()
    audit_events = db.scalars(select(models.AuditLog).where(models.AuditLog.actor_id == user.id)).all()

    audit(db, user.id, "data_export", "user", user.id, "DPDP data export generated")
    db.commit()

    return {
        "profile": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "language": user.language,
            "monthly_income": user.monthly_income,
            "monthly_expenses": user.monthly_expenses,
            "existing_emi": user.existing_emi,
            "declared_savings": user.declared_savings,
            "wallet_balance": user.savings_balance,
            "kyc_status": user.kyc_status,
            "consent_version": user.consent_version,
            "created_at": user.created_at.isoformat(),
        },
        "loans": [
            {
                "id": ln.id,
                "amount": ln.amount,
                "annual_rate": ln.annual_rate,
                "tenure_months": ln.tenure_months,
                "product_type": ln.product_type,
                "status": ln.status,
                "purpose": ln.purpose,
                "created_at": ln.created_at.isoformat(),
            }
            for ln in loans
        ],
        "savings_goals": [
            {"id": g.id, "title": g.title, "target": g.target_amount, "saved": g.saved_amount}
            for g in goals
        ],
        "transactions": [
            {"id": t.id, "title": t.title, "amount": t.amount, "is_credit": t.is_credit, "category": t.category, "created_at": t.created_at.isoformat()}
            for t in txs
        ],
        "course_progress": [
            {"slug": cp.course_slug, "score": cp.best_score, "completed": cp.completed}
            for cp in progress
        ],
        "audit_trail_count": len(audit_events),
        "exported_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/me/delete-request")
def request_account_deletion(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """DPDP Act 2023 - Right to Erasure: lodge an erasure request."""
    user.deletion_requested = True
    audit(db, user.id, "deletion_request", "user", user.id, "DPDP account erasure requested by user")
    db.commit()
    return {
        "ok": True,
        "message": "Account erasure request registered under DPDP Act 2023. Our data compliance officer will review pending obligations and execute erasure within statutory timelines."
    }


@router.get("/admin/users", response_model=list[schemas.UserOut])
def list_users(_=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    return db.scalars(select(models.User).order_by(models.User.id)).all()


@router.patch("/admin/users/{user_id}/role", response_model=schemas.UserOut)
def set_role(user_id: int, body: schemas.RoleIn, admin=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    u = db.get(models.User, user_id)
    if not u:
        raise HTTPException(404, "User not found")

    # Invariant: Admin cannot demote themselves
    if admin.id == user_id and body.role != "admin":
        raise HTTPException(400, "Administrators cannot demote themselves.")

    # Invariant: Cannot demote the last remaining admin
    if u.role == "admin" and body.role != "admin":
        admin_count = db.scalar(select(func.count(models.User.id)).where(models.User.role == "admin"))
        if admin_count <= 1:
            raise HTTPException(400, "Cannot demote the last remaining administrator in the system.")

    audit(db, admin.id, "set_role", "user", u.id, f"{u.role} -> {body.role}")
    u.role = body.role
    db.commit()
    db.refresh(u)
    return u
