import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models
from .database import get_db
from .security import decode_token

bearer = HTTPBearer(auto_error=False)


def get_current_user(cred: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)):
    if cred is None:
        raise HTTPException(401, "Not authenticated")
    try:
        data = decode_token(cred.credentials)
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired token")
    user = db.get(models.User, int(data["sub"]))
    if not user:
        raise HTTPException(401, "User not found")
    txs = db.scalars(select(models.Transaction).where(models.Transaction.user_id == user.id)).all()
    user.savings_balance = round(sum(t.amount for t in txs if t.is_credit) - sum(t.amount for t in txs if not t.is_credit), 2)
    return user


def get_current_user_optional(cred: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)):
    if cred is None:
        return None
    try:
        data = decode_token(cred.credentials)
        return db.get(models.User, int(data["sub"]))
    except Exception:
        return None



def require_roles(*roles: str):
    def checker(user: models.User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(403, "You do not have permission for this action")
        return user
    return checker


def audit(db: Session, actor_id, action: str, entity: str, entity_id=None, detail: str = ""):
    actual_id = actor_id.id if isinstance(actor_id, models.User) else actor_id
    db.add(models.AuditLog(actor_id=actual_id, action=action, entity=entity, entity_id=entity_id, detail=detail))



def notify(db: Session, user_id: int, message: str):
    db.add(models.Notification(user_id=user_id, message=message))
