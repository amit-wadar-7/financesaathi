from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import finance, ml, models, schemas
from ..database import get_db
from ..deps import audit, get_current_user, notify, require_roles

router = APIRouter(tags=["loans"])
STAFF = ("officer", "admin")


def loan_out(loan: models.Loan) -> schemas.LoanOut:
    out = schemas.LoanOut.model_validate(loan)
    out.borrower_name = loan.user.name if loan.user else ""
    return out


def installment_out(i: models.Installment) -> schemas.InstallmentOut:
    out = schemas.InstallmentOut.model_validate(i)
    out.overdue = i.status != "paid" and i.due_date < date.today()
    return out


def can_view(user: models.User, loan: models.Loan, db: Session) -> bool:
    if user.role in STAFF or loan.user_id == user.id:
        return True
    if user.role == "shg_leader" and loan.shg_id:
        shg = db.get(models.SHG, loan.shg_id)
        return bool(shg and shg.leader_id == user.id)
    return False


def get_loan_or_404(loan_id: int, user: models.User, db: Session) -> models.Loan:
    loan = db.get(models.Loan, loan_id)
    # 404 for both missing and forbidden so loan ids can't be probed
    if not loan or not can_view(user, loan, db):
        raise HTTPException(404, "Loan not found")
    return loan


@router.post("/loans", response_model=schemas.LoanOut, status_code=201)
def apply_for_loan(body: schemas.LoanIn, user: models.User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    if user.monthly_income <= 0:
        raise HTTPException(400, "Please fill in your income and expenses in your profile before applying")
    if body.group_loan and not user.shg_id:
        raise HTTPException(400, "You are not a member of an SHG")
    result = ml.assess(user.monthly_income, user.monthly_expenses, user.existing_emi, user.savings_balance,
                       body.amount, body.annual_rate, body.tenure_months)
    loan = models.Loan(user_id=user.id, shg_id=user.shg_id if body.group_loan else None, amount=body.amount,
                       annual_rate=body.annual_rate, tenure_months=body.tenure_months, purpose=body.purpose,
                       product_type=body.product_type, schedule_type=body.schedule_type,
                       emi=result["emi"], ai_score=result["score"], ai_band=result["band"],
                       ai_factors=result["factors"])
    for d in body.documents:
        loan.documents.append(models.LoanDocument(doc_type=d))
    db.add(loan)
    db.flush()
    audit(db, user.id, "apply", "loan", loan.id, f"amount={body.amount} band={result['band']}")
    db.commit()
    db.refresh(loan)
    return loan_out(loan)


@router.get("/loans", response_model=list[schemas.LoanOut])
def list_loans(status: str | None = None, user: models.User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    q = select(models.Loan).order_by(models.Loan.id.desc())
    if status:
        q = q.where(models.Loan.status == status)
    if user.role not in STAFF:
        if user.role == "shg_leader":
            shg_ids = [s.id for s in db.scalars(select(models.SHG).where(models.SHG.leader_id == user.id))]
            q = q.where((models.Loan.user_id == user.id) | (models.Loan.shg_id.in_(shg_ids)))
        else:
            q = q.where(models.Loan.user_id == user.id)
    return [loan_out(l) for l in db.scalars(q).all()]


@router.get("/loans/{loan_id}", response_model=schemas.LoanOut)
def get_loan(loan_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return loan_out(get_loan_or_404(loan_id, user, db))


@router.post("/loans/{loan_id}/decision", response_model=schemas.LoanOut)
def decide(loan_id: int, body: schemas.DecisionIn, officer: models.User = Depends(require_roles(*STAFF)),
           db: Session = Depends(get_db)):
    loan = db.get(models.Loan, loan_id)
    if not loan:
        raise HTTPException(404, "Loan not found")
    if loan.status != "pending":
        raise HTTPException(409, f"Loan is already {loan.status}")
    loan.officer_id, loan.officer_note, loan.decided_at = officer.id, body.note, models.now()
    if body.approve:
        loan.status = "approved"
        if loan.schedule_type == "harvest_bullet" or (loan.product_type == "kisan_agri" and loan.schedule_type == "harvest_bullet"):
            schedule_rows = finance.kisan_harvest_amortization(loan.amount, loan.annual_rate, loan.tenure_months, date.today())
        else:
            schedule_rows = finance.amortization(loan.amount, loan.annual_rate, loan.tenure_months, date.today())
        for row in schedule_rows:
            loan.installments.append(models.Installment(
                number=row["number"], due_date=row["due_date"], amount=row["amount"],
                principal_part=row["principal_part"], interest_part=row["interest_part"],
                phase=row.get("phase", "Regular EMI"), is_harvest=row.get("is_harvest", False)))
        notify(db, loan.user_id, f"Your loan #{loan.id} of Rs {loan.amount:,.0f} was approved.")
    else:
        loan.status = "rejected"
        notify(db, loan.user_id, f"Your loan #{loan.id} was not approved. {body.note}".strip())
    audit(db, officer.id, "approve" if body.approve else "reject", "loan", loan.id, body.note)
    db.commit()
    db.refresh(loan)
    return loan_out(loan)


@router.post("/loans/{loan_id}/documents/{doc_id}/verify", response_model=schemas.DocumentOut)
def verify_document(loan_id: int, doc_id: int, officer=Depends(require_roles(*STAFF)),
                    db: Session = Depends(get_db)):
    doc = db.get(models.LoanDocument, doc_id)
    if not doc or doc.loan_id != loan_id:
        raise HTTPException(404, "Document not found")
    doc.verified = True
    audit(db, officer.id, "verify_document", "loan", loan_id, doc.doc_type)
    db.commit()
    return doc


@router.get("/loans/{loan_id}/schedule", response_model=list[schemas.InstallmentOut])
def schedule(loan_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    loan = get_loan_or_404(loan_id, user, db)
    return [installment_out(i) for i in loan.installments]


@router.post("/loans/{loan_id}/installments/{number}/pay", response_model=schemas.InstallmentOut)
def pay(loan_id: int, number: int, body: schemas.PayIn, user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)):
    loan = get_loan_or_404(loan_id, user, db)
    # Only the borrower or staff may record a payment (leaders can view but not record).
    if user.id != loan.user_id and user.role not in STAFF:
        raise HTTPException(403, "Only the borrower or an officer can record payments")
    inst = next((i for i in loan.installments if i.number == number), None)
    if not inst:
        raise HTTPException(404, "Installment not found")
    if inst.status == "paid":
        raise HTTPException(409, "Installment already paid")
    remaining = round(inst.amount - inst.paid_amount, 2)
    amount = body.amount if body.amount is not None else remaining
    if amount > remaining + 0.01:
        raise HTTPException(400, f"Amount exceeds the remaining Rs {remaining}")
    inst.paid_amount = round(inst.paid_amount + amount, 2)
    inst.paid_on = date.today()
    inst.status = "paid" if inst.paid_amount >= inst.amount - 0.01 else "partial"
    audit(db, user.id, "payment", "loan", loan.id, f"installment={number} amount={amount}")
    if all(i.status == "paid" for i in loan.installments):
        loan.status = "closed"
        notify(db, loan.user_id, f"Loan #{loan.id} is fully repaid. Congratulations!")
    db.commit()
    db.refresh(inst)
    return installment_out(inst)
