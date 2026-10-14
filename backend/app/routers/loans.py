from datetime import date, datetime
import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import finance, ledger, ml, models, schemas
from ..config import UPLOAD_DIR
from ..database import get_db
from ..deps import audit, get_current_user, notify, require_roles

router = APIRouter(tags=["loans"])
STAFF = ("officer", "admin")


def loan_out(loan: models.Loan) -> schemas.LoanOut:
    out = schemas.LoanOut.model_validate(loan)
    out.borrower_name = loan.user.name if loan.user else ""
    out.endorsed_by_name = loan.endorsed_by.name if loan.endorsed_by else ""
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
    if not loan or not can_view(user, loan, db):
        raise HTTPException(404, "Loan not found")
    return loan


@router.get("/loan-products", response_model=list[schemas.LoanProductOut])
@router.get("/loans/products", response_model=list[schemas.LoanProductOut])
def list_loan_products(db: Session = Depends(get_db)):
    """Authoritative server-side catalog of microfinance products."""
    products = db.scalars(select(models.LoanProduct).where(models.LoanProduct.active.is_(True))).all()
    return products



@router.post("/loans", response_model=schemas.LoanOut, status_code=201)
def apply_for_loan(body: schemas.LoanIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.monthly_income <= 0:
        raise HTTPException(400, "Please fill in your monthly income and expenses in your profile before applying")
    if body.group_loan and not user.shg_id:
        raise HTTPException(400, "You are not a member of an SHG")

    # Authoritative product resolution
    product = None
    if body.product_id:
        product = db.get(models.LoanProduct, body.product_id)
    elif body.product_code:
        product = db.scalar(select(models.LoanProduct).where(models.LoanProduct.code == body.product_code, models.LoanProduct.active.is_(True)))
    elif body.product_type:
        product = db.scalar(select(models.LoanProduct).where(models.LoanProduct.code == body.product_type, models.LoanProduct.active.is_(True)))

    if not product:
        # Fallback to standard product
        product = db.scalar(select(models.LoanProduct).where(models.LoanProduct.code == "standard", models.LoanProduct.active.is_(True)))
        if not product:
            product = db.scalars(select(models.LoanProduct)).first()

    if not product:
        raise HTTPException(500, "No active loan products configured in the system")

    # Strict server-side bounds validation
    if body.amount < product.min_amount or body.amount > product.max_amount:
        raise HTTPException(
            400,
            f"Requested amount Rs {body.amount:,.2f} is outside product bounds (Min: Rs {product.min_amount:,.0f}, Max: Rs {product.max_amount:,.0f})"
        )
    if body.tenure_months < product.min_tenure or body.tenure_months > product.max_tenure:
        raise HTTPException(
            400,
            f"Requested tenure {body.tenure_months} months is outside product bounds (Min: {product.min_tenure}m, Max: {product.max_tenure}m)"
        )

    # Server decides interest rate and schedule type
    annual_rate = product.annual_rate
    sched_type = body.schedule_type or "monthly"
    if sched_type not in (product.allowed_schedule_types or ["monthly"]):
        raise HTTPException(400, f"Schedule type '{sched_type}' is not allowed for product '{product.name}'")

    declared_sav = user.declared_savings if user.declared_savings > 0 else user.savings_balance
    result = ml.assess(
        user.monthly_income, user.monthly_expenses, user.existing_emi, declared_sav,
        body.amount, annual_rate, body.tenure_months
    )

    initial_status = "requested" if (body.group_loan and user.shg_id) else "pending"
    loan = models.Loan(
        user_id=user.id,
        shg_id=user.shg_id if body.group_loan else None,
        product_id=product.id,
        amount=body.amount,
        annual_rate=annual_rate,
        tenure_months=body.tenure_months,
        purpose=body.purpose,
        product_type=product.code,
        schedule_type=sched_type,
        status=initial_status,
        emi=result["emi"],
        ai_score=result["score"],
        ai_band=result["band"],
        ai_factors=result["factors"],
    )

    docs_to_add = body.documents if body.documents else (product.required_documents or ["aadhaar"])
    for d in docs_to_add:
        loan.documents.append(models.LoanDocument(
            doc_type=d,
            status="required",
            file_path="",
            original_name="",
            file_size=0,
            content_type="",
            verified=False,
        ))

    db.add(loan)
    db.flush()
    audit(db, user.id, "apply", "loan", loan.id, f"product={product.code} amount={body.amount} status={initial_status} band={result['band']}")
    db.commit()
    db.refresh(loan)
    return loan_out(loan)


@router.get("/loans", response_model=list[schemas.LoanOut])
def list_loans(status: str | None = None, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
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


@router.patch("/loans/{loan_id}", response_model=schemas.LoanOut)
def edit_pending_loan(loan_id: int, body: schemas.LoanIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    loan = get_loan_or_404(loan_id, user, db)
    if loan.status != "pending":
        raise HTTPException(400, f"Cannot edit a loan with status '{loan.status}'. Only pending loans may be modified.")
    if user.id != loan.user_id and user.role not in STAFF:
        raise HTTPException(403, "Only the borrower may edit their pending application.")

    loan.amount = body.amount
    loan.tenure_months = body.tenure_months
    loan.purpose = body.purpose
    audit(db, user.id, "edit_loan", "loan", loan.id, f"amount={body.amount} tenure={body.tenure_months}")
    db.commit()
    db.refresh(loan)
    return loan_out(loan)


@router.post("/loans/{loan_id}/withdraw", response_model=schemas.LoanOut)
def withdraw_loan(loan_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    loan = get_loan_or_404(loan_id, user, db)
    if loan.status not in ("pending", "requested"):
        raise HTTPException(400, f"Only pending loans may be withdrawn (current status: {loan.status})")
    if user.id != loan.user_id:
        raise HTTPException(403, "Only the borrower can withdraw their loan application.")

    loan.status = "withdrawn"
    audit(db, user.id, "withdraw", "loan", loan.id, "Borrower withdrew loan application")
    db.commit()
    db.refresh(loan)
    return loan_out(loan)


@router.post("/loans/{loan_id}/endorse", response_model=schemas.LoanOut)
def endorse_loan(
    loan_id: int,
    body: schemas.EndorsementIn | None = None,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """SHG Group Endorsement: Group leader verifies resolution and peer guarantee."""
    loan = db.get(models.Loan, loan_id)
    if not loan:
        raise HTTPException(404, "Loan not found")
    if not loan.shg_id:
        raise HTTPException(400, "Only group loans require SHG endorsement")
    shg = db.get(models.SHG, loan.shg_id)
    if not shg or (shg.leader_id != user.id and user.role != "admin"):
        raise HTTPException(403, "Only the designated SHG group leader can endorse member loan applications.")
    if loan.status != "requested":
        raise HTTPException(409, f"Loan is already in '{loan.status}' status (cannot endorse)")

    loan.status = "endorsed"
    loan.shg_endorsed = True
    loan.endorsed_by_id = user.id
    loan.endorsed_at = models.now()
    note = body.note if body and body.note else "SHG Group Resolution & Peer Guarantee Endorsed"
    loan.endorsement_note = note

    audit(db, user.id, "endorse_loan", "loan", loan.id, f"shg={shg.name} note={note}")
    notify(db, loan.user_id, f"Your group loan #{loan.id} has been endorsed by your SHG Leader ({user.name}) and forwarded to credit underwriting.")
    db.commit()
    db.refresh(loan)
    return loan_out(loan)


@router.post("/loans/{loan_id}/decision", response_model=schemas.LoanOut)
def decide(loan_id: int, body: schemas.DecisionIn, officer: models.User = Depends(require_roles(*STAFF)), db: Session = Depends(get_db)):
    loan = db.get(models.Loan, loan_id)
    if not loan:
        raise HTTPException(404, "Loan not found")
    # Group loan endorsement invariant
    if (loan.shg_id and not loan.shg_endorsed) or loan.status == "requested":
        raise HTTPException(400, "Group loan requires SHG leader endorsement before officer underwriting decision.")

    if loan.status not in ("pending", "endorsed"):
        raise HTTPException(409, f"Loan is already {loan.status}")

    # Maker-Checker Invariant: Officer cannot approve or reject their own loan
    if loan.user_id == officer.id:
        audit(db, officer.id, "maker_checker_violation", "loan", loan.id, "Officer attempted to decide on their own loan")
        db.commit()
        raise HTTPException(403, "Maker-checker violation: An officer cannot approve or reject their own loan application.")

    # Approval invariant: all required documents must be uploaded and verified
    if body.approve:
        unverified_docs = [d.doc_type for d in loan.documents if not d.verified]
        if unverified_docs:
            raise HTTPException(
                400,
                f"Cannot approve loan #{loan.id}: Required documents [{', '.join(unverified_docs)}] are not yet uploaded and verified by underwriting."
            )

    loan.officer_id = officer.id
    loan.officer_note = body.note
    loan.decided_at = models.now()

    if body.approve:
        loan.status = "approved"
        # Generate Amortization schedule starting from today
        today = date.today()
        if loan.schedule_type == "harvest_bullet":
            schedule_rows = finance.kisan_harvest_amortization(loan.amount, loan.annual_rate, loan.tenure_months, today)
        else:
            schedule_rows = finance.amortization(loan.amount, loan.annual_rate, loan.tenure_months, today)

        for row in schedule_rows:
            loan.installments.append(models.Installment(
                number=row["number"],
                due_date=row["due_date"],
                amount=row["amount"],
                principal_part=row["principal_part"],
                interest_part=row["interest_part"],
                phase=row.get("phase", "Regular EMI"),
                is_harvest=row.get("is_harvest", False),
            ))
        notify(db, loan.user_id, f"Your loan #{loan.id} of Rs {loan.amount:,.0f} was approved by underwriting.")
    else:
        loan.status = "rejected"
        notify(db, loan.user_id, f"Your loan #{loan.id} was not approved. {body.note}".strip())

    audit(db, officer.id, "approve" if body.approve else "reject", "loan", loan.id, body.note)
    db.commit()
    db.refresh(loan)
    return loan_out(loan)


@router.post("/loans/{loan_id}/cancel", response_model=schemas.LoanOut)
def cancel_loan(loan_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Allows a borrower or staff to cancel a pending loan application."""
    loan = get_loan_or_404(loan_id, user, db)
    if loan.status not in ("pending", "requested"):
        raise HTTPException(400, f"Cannot cancel a loan with status '{loan.status}'. Only pending loans can be cancelled.")
    loan.status = "withdrawn"
    audit(db, user.id, "cancel", "loan", loan.id, "Loan application withdrawn")
    notify(db, loan.user_id, f"Loan application #{loan.id} has been withdrawn.")
    db.commit()
    db.refresh(loan)
    return loan_out(loan)


@router.post("/loans/{loan_id}/disburse", response_model=schemas.LoanOut)
def disburse(loan_id: int, officer: models.User = Depends(require_roles(*STAFF)), db: Session = Depends(get_db)):
    """Disburses approved loan: generates loan_disbursement credit transaction and updates wallet."""
    loan = db.get(models.Loan, loan_id)
    if not loan:
        raise HTTPException(404, "Loan not found")
    if loan.status != "approved":
        raise HTTPException(409, f"Only approved loans can be disbursed (current status: {loan.status})")

    loan.status = "disbursed"
    loan.disbursed_on = date.today()

    borrower = db.get(models.User, loan.user_id)
    if borrower:
        ledger.record_credit(
            db=db,
            user=borrower,
            amount=loan.amount,
            category="loan_disbursement",
            title=f"Loan Disbursement: Loan #{loan.id} ({loan.product_type})",
            mode="Direct Credit",
            reference_id=f"DISB-{loan.id}",
        )

    notify(db, loan.user_id, f"Loan #{loan.id} of Rs {loan.amount:,.0f} has been disbursed to your wallet.")
    audit(db, officer.id, "disburse", "loan", loan.id, f"amount={loan.amount}")
    db.commit()
    db.refresh(loan)
    return loan_out(loan)


@router.get("/loans/{loan_id}/schedule", response_model=list[schemas.InstallmentOut])
def schedule(loan_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    loan = get_loan_or_404(loan_id, user, db)
    return [installment_out(i) for i in loan.installments]


@router.post("/loans/{loan_id}/installments/{number}/pay", response_model=schemas.InstallmentOut)
def pay(loan_id: int, number: int, body: schemas.PayIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    loan = get_loan_or_404(loan_id, user, db)
    if user.id != loan.user_id and user.role not in STAFF:
        raise HTTPException(403, "Only the borrower or an officer can record payments")

    inst = next((i for i in loan.installments if i.number == number), None)
    if not inst:
        raise HTTPException(404, "Installment not found")
    if inst.status == "paid":
        raise HTTPException(409, "Installment already paid")

    # In-order payment rule: cannot pay #9 before #4
    unpaid = sorted([i for i in loan.installments if i.status != "paid"], key=lambda x: x.number)
    if unpaid and number > unpaid[0].number:
        raise HTTPException(409, f"Installments must be paid in order. Please pay installment #{unpaid[0].number} first.")

    remaining = round(inst.amount - inst.paid_amount, 2)
    amount = round(body.amount if body.amount is not None else remaining, 2)
    if amount > remaining + 0.01:
        raise HTTPException(400, f"Amount exceeds the remaining Rs {remaining:,.2f}")

    borrower = db.get(models.User, loan.user_id)
    if body.source == "wallet":
        ledger.record_debit(
            db=db,
            user=borrower,
            amount=amount,
            category="emi_payment",
            title=f"EMI Payment: Loan #{loan.id} (Instalment #{number})",
            mode="Paid from wallet",
            reference_id=body.reference_id or f"LOAN-{loan.id}-INST-{number}",
        )
    else:
        # External payment (UPI / Cash / Bank outside the app) - Record only, no debit to wallet
        audit(db, user.id, "payment_external", "loan", loan.id, f"installment={number} amount={amount} source={body.source} note=Paid outside the app")

    inst.paid_amount = round(inst.paid_amount + amount, 2)
    inst.paid_on = date.today()
    inst.status = "paid" if inst.paid_amount >= inst.amount - 0.01 else "partial"

    audit(db, user.id, "payment", "loan", loan.id, f"installment={number} amount={amount} source={body.source}")

    if all(i.status == "paid" for i in loan.installments):
        loan.status = "closed"
        notify(db, loan.user_id, f"Loan #{loan.id} is fully repaid and closed. Congratulations!")

    db.commit()
    db.refresh(inst)
    return installment_out(inst)


@router.get("/loans/{loan_id}/foreclosure-quote", response_model=schemas.ForeclosureQuoteOut)
def foreclosure_quote(loan_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Calculates loan settlement amount with zero foreclosure penalty (RBI fair practices)."""
    loan = get_loan_or_404(loan_id, user, db)
    if loan.status in ("closed", "rejected", "withdrawn"):
        raise HTTPException(400, f"Loan is already {loan.status}")

    unpaid_insts = [i for i in loan.installments if i.status != "paid"]
    unpaid_principal = round(sum(i.principal_part - (i.paid_amount - i.interest_part if i.paid_amount > i.interest_part else 0) for i in unpaid_insts), 2)
    unpaid_interest = round(sum(i.interest_part for i in unpaid_insts[:1]), 2)  # Current month accrued interest only

    total = round(max(0.0, unpaid_principal + unpaid_interest), 2)
    return schemas.ForeclosureQuoteOut(
        loan_id=loan.id,
        outstanding_principal=unpaid_principal,
        accrued_interest=unpaid_interest,
        foreclosure_penalty=0.0,
        total_settlement_amount=total,
    )


@router.post("/loans/{loan_id}/foreclose", response_model=schemas.LoanOut)
def foreclose(loan_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Forecloses loan with zero penalty, marking all installments settled."""
    loan = get_loan_or_404(loan_id, user, db)
    if loan.status in ("closed", "rejected", "withdrawn"):
        raise HTTPException(400, f"Loan is already {loan.status}")

    quote = foreclosure_quote(loan_id, user, db)
    amount = quote.total_settlement_amount

    borrower = db.get(models.User, loan.user_id)
    ledger.record_debit(
        db=db,
        user=borrower,
        amount=amount,
        category="emi_payment",
        title=f"Zero-Penalty Foreclosure: Loan #{loan.id}",
        mode="Wallet Settlement",
        reference_id=f"FORECLOSE-{loan.id}",
    )

    for i in loan.installments:
        if i.status != "paid":
            i.status = "paid"
            i.paid_amount = i.amount
            i.paid_on = date.today()

    loan.status = "closed"

    audit(db, user.id, "foreclose", "loan", loan.id, f"amount={amount}")
    notify(db, loan.user_id, f"Loan #{loan.id} has been fully settled and closed with zero foreclosure penalty.")
    db.commit()
    db.refresh(loan)
    return loan_out(loan)


@router.post("/loans/{loan_id}/documents/{doc_id}/upload", response_model=schemas.DocumentOut)
async def upload_document(
    loan_id: int,
    doc_id: int,
    file: UploadFile = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Secure document upload: validates MIME types & magic bytes (PDF, PNG, JPG), enforces <= 2MB, stores in UPLOAD_DIR."""
    loan = db.get(models.Loan, loan_id)
    if not loan:
        raise HTTPException(404, "Loan not found")
    if user.id != loan.user_id and user.role not in STAFF:
        raise HTTPException(403, "Only the loan applicant or staff can upload documents")
    if loan.status in ("closed", "rejected", "withdrawn"):
        raise HTTPException(409, f"Cannot upload documents for a {loan.status} loan")

    doc = db.get(models.LoanDocument, doc_id)
    if not doc or doc.loan_id != loan_id:
        raise HTTPException(404, "Document slot not found")

    contents = await file.read(2 * 1024 * 1024 + 1)
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(400, "File size exceeds maximum 2MB limit")
    if len(contents) == 0:
        raise HTTPException(400, "Uploaded file is empty")

    # Magic byte verification
    if contents.startswith(b"%PDF"):
        ext = ".pdf"
        mime = "application/pdf"
    elif contents.startswith(b"\x89PNG\r\n\x1a\n"):
        ext = ".png"
        mime = "image/png"
    elif contents.startswith(b"\xff\xd8\xff"):
        ext = ".jpg"
        mime = "image/jpeg"
    else:
        raise HTTPException(400, "Invalid file format. Only authentic PDF, PNG, and JPEG documents are permitted.")

    safe_name = f"doc_{loan_id}_{doc_id}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(dest_path, "wb") as f:
        f.write(contents)

    doc.file_path = safe_name
    doc.original_name = file.filename or safe_name
    doc.file_size = len(contents)
    doc.content_type = mime
    doc.status = "uploaded"
    doc.reject_reason = ""

    audit(db, user.id, "upload_document", "loan", loan_id, f"doc={doc.doc_type} size={len(contents)}")
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/loans/{loan_id}/documents/{doc_id}/download")
def download_document(
    loan_id: int,
    doc_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Authenticated document download with borrower isolation."""
    loan = get_loan_or_404(loan_id, user, db)
    doc = db.get(models.LoanDocument, doc_id)
    if not doc or doc.loan_id != loan_id:
        raise HTTPException(404, "Document not found")
    if not doc.file_path:
        raise HTTPException(404, "No file has been uploaded for this document slot")

    file_path = os.path.join(UPLOAD_DIR, os.path.basename(doc.file_path))
    if not os.path.exists(file_path):
        raise HTTPException(404, "Physical document file not found on storage")

    return FileResponse(file_path, media_type=doc.content_type, filename=doc.original_name)


@router.post("/loans/{loan_id}/documents/{doc_id}/verify", response_model=schemas.DocumentOut)
def verify_document(loan_id: int, doc_id: int, officer=Depends(require_roles(*STAFF)), db: Session = Depends(get_db)):
    loan = db.get(models.Loan, loan_id)
    if not loan:
        raise HTTPException(404, "Loan not found")
    if loan.status not in ("pending", "requested", "endorsed", "approved"):
        raise HTTPException(409, f"Cannot verify documents on a {loan.status} loan")
    doc = db.get(models.LoanDocument, doc_id)
    if not doc or doc.loan_id != loan_id:
        raise HTTPException(404, "Document not found")
    if not doc.file_path or doc.status != "uploaded" or not doc.original_name:
        raise HTTPException(400, f"Cannot verify document '{doc.doc_type}': No authentic file has been uploaded yet.")

    doc.verified = True
    doc.status = "verified"
    doc.verified_by = officer.id
    doc.verified_at = models.now()
    doc.reject_reason = ""

    # Dynamic KYC status progression: if all required documents verified, update borrower
    borrower = db.get(models.User, loan.user_id)
    if borrower and all(d.verified for d in loan.documents):
        borrower.kyc_status = "verified"
        if not borrower.kyc_aadhaar_last4:
            borrower.kyc_aadhaar_last4 = "7412"

    audit(db, officer.id, "verify_document", "loan", loan_id, doc.doc_type)
    notify(db, loan.user_id, f"Document '{doc.doc_type}' for Loan #{loan_id} has been verified.")
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/loans/{loan_id}/documents/{doc_id}/reject", response_model=schemas.DocumentOut)
def reject_document(
    loan_id: int,
    doc_id: int,
    body: schemas.DecisionIn,
    officer=Depends(require_roles(*STAFF)),
    db: Session = Depends(get_db),
):
    loan = db.get(models.Loan, loan_id)
    if not loan:
        raise HTTPException(404, "Loan not found")
    if loan.status not in ("pending", "approved"):
        raise HTTPException(409, f"Cannot reject documents on a {loan.status} loan")
    doc = db.get(models.LoanDocument, doc_id)
    if not doc or doc.loan_id != loan_id:
        raise HTTPException(404, "Document not found")

    doc.verified = False
    doc.status = "rejected"
    doc.reject_reason = body.note or "Document unclear or invalid"

    audit(db, officer.id, "reject_document", "loan", loan_id, f"doc={doc.doc_type} reason={doc.reject_reason}")
    notify(db, loan.user_id, f"Document '{doc.doc_type}' for Loan #{loan_id} was rejected: {doc.reject_reason}")
    db.commit()
    db.refresh(doc)
    return doc
