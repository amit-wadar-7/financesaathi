from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import audit, get_current_user, require_roles
from ..security import create_token, hash_password, verify_password

router = APIRouter(tags=["auth"])


@router.post("/auth/register", response_model=schemas.UserOut, status_code=201)
def register(body: schemas.RegisterIn, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.scalar(select(models.User).where(models.User.email == email)):
        raise HTTPException(409, "Email already registered")
    # Public registration always creates a normal user; admins promote roles.
    user = models.User(name=body.name, email=email, phone=body.phone, language=body.language,
                       password_hash=hash_password(body.password), role="user")
    db.add(user)
    db.flush()
    audit(db, user.id, "register", "user", user.id)
    db.commit()
    return user


@router.post("/auth/login", response_model=schemas.TokenOut)
def login(body: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(models.User).where(models.User.email == body.email.lower()))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return schemas.TokenOut(access_token=create_token(user.id, user.role), role=user.role)


@router.get("/auth/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user


@router.patch("/auth/me", response_model=schemas.UserOut)
def update_profile(body: schemas.ProfileIn, user: models.User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(user, k, v)
    db.commit()
    return user


@router.get("/admin/users", response_model=list[schemas.UserOut])
def list_users(_=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    return db.scalars(select(models.User).order_by(models.User.id)).all()


@router.patch("/admin/users/{user_id}/role", response_model=schemas.UserOut)
def set_role(user_id: int, body: schemas.RoleIn, admin=Depends(require_roles("admin")),
             db: Session = Depends(get_db)):
    u = db.get(models.User, user_id)
    if not u:
        raise HTTPException(404, "User not found")
    audit(db, admin.id, "set_role", "user", u.id, f"{u.role} -> {body.role}")
    u.role = body.role
    db.commit()
    return u
