"""Centralized, atomic financial ledger service for FinanceSaathi.
Enforces double-entry style ledger invariants, ensures non-negative wallet balances,
and maintains an immutable transaction audit log.
"""
from datetime import date, datetime, timezone
from typing import Optional
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import models
from .deps import audit


def record_credit(
    db: Session,
    user: models.User,
    amount: float,
    category: str,
    title: str,
    mode: str = "Direct Credit",
    reference_id: Optional[str] = None,
) -> models.Transaction:
    """Credits funds to user's wallet balance and creates an immutable transaction record."""
    amount = round(float(amount), 2)
    if amount <= 0:
        raise HTTPException(400, "Credit amount must be greater than zero")

    user.savings_balance = round(user.savings_balance + amount, 2)
    tx = models.Transaction(
        user_id=user.id,
        category=category,
        title=title,
        amount=amount,
        is_credit=True,
        mode=mode,
        reference_id=reference_id,
    )
    db.add(tx)
    db.flush()
    audit(db, user.id, "ledger_credit", "user", user.id, f"amount={amount} cat={category} ref={reference_id or 'none'}")
    return tx


def record_debit(
    db: Session,
    user: models.User,
    amount: float,
    category: str,
    title: str,
    mode: str = "Direct Debit",
    reference_id: Optional[str] = None,
) -> models.Transaction:
    """Debits funds from user's wallet balance after strictly checking non-negative balance invariant."""
    amount = round(float(amount), 2)
    if amount <= 0:
        raise HTTPException(400, "Debit amount must be greater than zero")

    if user.savings_balance < amount:
        raise HTTPException(
            400,
            f"Insufficient funds: Available balance Rs {user.savings_balance:,.2f} is less than required Rs {amount:,.2f}"
        )

    user.savings_balance = round(user.savings_balance - amount, 2)
    tx = models.Transaction(
        user_id=user.id,
        category=category,
        title=title,
        amount=amount,
        is_credit=False,
        mode=mode,
        reference_id=reference_id,
    )
    db.add(tx)
    db.flush()
    audit(db, user.id, "ledger_debit", "user", user.id, f"amount={amount} cat={category} ref={reference_id or 'none'}")
    return tx


def record_transfer_to_goal(
    db: Session,
    user: models.User,
    goal: models.SavingsGoal,
    amount: float,
    note: str = "",
) -> models.Transaction:
    """Internal transfer from user's main wallet balance to a specific savings goal."""
    amount = round(float(amount), 2)
    if amount <= 0:
        raise HTTPException(400, "Transfer amount must be greater than zero")

    if user.savings_balance < amount:
        raise HTTPException(
            400,
            f"Insufficient funds: Available balance Rs {user.savings_balance:,.2f} is less than transfer amount Rs {amount:,.2f}"
        )

    user.savings_balance = round(user.savings_balance - amount, 2)
    goal.saved_amount = round(goal.saved_amount + amount, 2)
    db.add(models.SavingsEntry(goal_id=goal.id, amount=amount))

    title = f"Transfer to {goal.title}" + (f" ({note})" if note else "")
    tx = models.Transaction(
        user_id=user.id,
        category="transfer",
        title=title,
        amount=amount,
        is_credit=False,
        mode="Internal Transfer",
        reference_id=f"GOAL-{goal.id}",
    )
    db.add(tx)
    db.flush()
    audit(db, user.id, "goal_transfer", "goal", goal.id, f"amount={amount}")
    return tx


def record_transfer_from_goal(
    db: Session,
    user: models.User,
    goal: models.SavingsGoal,
    amount: float,
) -> models.Transaction:
    """Withdraws accumulated funds from a savings goal back to the main wallet balance."""
    amount = round(float(amount), 2)
    if amount <= 0:
        raise HTTPException(400, "Withdrawal amount must be greater than zero")

    if goal.saved_amount < amount:
        raise HTTPException(
            400,
            f"Cannot withdraw Rs {amount:,.2f}. Available in goal: Rs {goal.saved_amount:,.2f}"
        )

    goal.saved_amount = round(goal.saved_amount - amount, 2)
    user.savings_balance = round(user.savings_balance + amount, 2)

    tx = models.Transaction(
        user_id=user.id,
        category="goal_withdrawal",
        title=f"Goal Withdrawal to Wallet: {goal.title}",
        amount=amount,
        is_credit=True,
        mode="Internal Wallet Transfer",
        reference_id=f"GOAL-WD-{goal.id}",
    )
    db.add(tx)
    db.flush()
    audit(db, user.id, "goal_withdraw", "goal", goal.id, f"amount={amount}")
    return tx


def record_thrift_contribution(
    db: Session,
    member: models.User,
    shg: models.SHG,
    amount: float,
    source: str = "wallet",
    reference_id: Optional[str] = None,
    month_year: Optional[str] = None,
) -> tuple[models.ThriftContribution, Optional[models.Transaction]]:
    """Records a monthly thrift contribution to the SHG joint corpus."""
    amount = round(float(amount), 2)
    if amount <= 0:
        raise HTTPException(400, "Thrift contribution amount must be greater than zero")

    tx = None
    if source == "wallet":
        tx = record_debit(
            db=db,
            user=member,
            amount=amount,
            category="shg_thrift",
            title=f"SHG Monthly Thrift: {shg.name}",
            mode="Wallet Debit",
            reference_id=reference_id or f"SHG-THRIFT-{shg.id}",
        )
    else:
        # External payment (UPI / Cash at meeting)
        tx = models.Transaction(
            user_id=member.id,
            category="shg_thrift",
            title=f"SHG Monthly Thrift: {shg.name}",
            amount=amount,
            is_credit=False,
            mode="UPI / Meeting Cash",
            reference_id=reference_id or f"SHG-THRIFT-{shg.id}",
        )
        db.add(tx)

    my = month_year or datetime.now(timezone.utc).strftime("%Y-%m")
    shg.corpus_balance = round(shg.corpus_balance + amount, 2)
    tc = models.ThriftContribution(
        shg_id=shg.id,
        user_id=member.id,
        month_year=my,
        amount=amount,
        payment_mode=source,
        status="paid",
        paid_on=date.today(),
        reference_id=reference_id or f"THRIFT-{shg.id}-{int(datetime.now(timezone.utc).timestamp())}",
    )
    db.add(tc)
    db.flush()
    audit(db, member.id, "thrift_contribution", "shg", shg.id, f"amount={amount} source={source}")
    return tc, tx



def get_user_ledger_summary(db: Session, user_id: int) -> dict:
    """Computes total credits, debits, and verifies mathematical integrity of wallet balance."""
    txs = db.scalars(select(models.Transaction).where(models.Transaction.user_id == user_id)).all()
    credits = round(sum(t.amount for t in txs if t.is_credit), 2)
    debits = round(sum(t.amount for t in txs if not t.is_credit), 2)
    computed_balance = round(credits - debits, 2)

    user = db.get(models.User, user_id)
    actual_balance = user.savings_balance if user else 0.0

    return {
        "user_id": user_id,
        "total_credits": credits,
        "total_debits": debits,
        "computed_net": computed_balance,
        "recorded_balance": actual_balance,
        "transaction_count": len(txs),
        "is_reconciled": abs(computed_balance - actual_balance) < 0.01,
    }
