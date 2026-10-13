from datetime import date, datetime, timezone

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class SHG(Base):
    __tablename__ = "shgs"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    village: Mapped[str] = mapped_column(String(120), default="")
    leader_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    monthly_thrift_amount: Mapped[float] = mapped_column(Float, default=0.0)
    corpus_balance: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    members: Mapped[list["SHGMember"]] = relationship(back_populates="shg", cascade="all, delete-orphan")
    meetings: Mapped[list["SHGMeeting"]] = relationship(back_populates="shg", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(20), default="")
    password_hash: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(20), default="user")  # user | shg_leader | officer | admin
    language: Mapped[str] = mapped_column(String(5), default="en")  # en | hi | mr
    monthly_income: Mapped[float] = mapped_column(Float, default=0)
    monthly_expenses: Mapped[float] = mapped_column(Float, default=0)
    existing_emi: Mapped[float] = mapped_column(Float, default=0)
    declared_savings: Mapped[float] = mapped_column(Float, default=0)  # Self-declared for affordability
    savings_balance: Mapped[float] = mapped_column(Float, default=0)  # Derived/maintained ledger wallet
    shg_id: Mapped[int | None] = mapped_column(ForeignKey("shgs.id"), nullable=True)
    kyc_status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | verified | rejected
    kyc_aadhaar_last4: Mapped[str | None] = mapped_column(String(4), nullable=True)
    consent_version: Mapped[str] = mapped_column(String(20), default="1.0")
    consent_given_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    deletion_requested: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class SHGMember(Base):
    __tablename__ = "shg_members"
    id: Mapped[int] = mapped_column(primary_key=True)
    shg_id: Mapped[int] = mapped_column(ForeignKey("shgs.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(30), default="member")  # president | secretary | treasurer | member
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    shg: Mapped["SHG"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship()


class SHGInvite(Base):
    __tablename__ = "shg_invites"
    id: Mapped[int] = mapped_column(primary_key=True)
    shg_id: Mapped[int] = mapped_column(ForeignKey("shgs.id"), index=True)
    invited_email: Mapped[str] = mapped_column(String(200), index=True)
    invited_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | accepted | declined
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    shg: Mapped["SHG"] = relationship()


class SHGMeeting(Base):
    __tablename__ = "shg_meetings"
    id: Mapped[int] = mapped_column(primary_key=True)
    shg_id: Mapped[int] = mapped_column(ForeignKey("shgs.id"), index=True)
    meeting_date: Mapped[date] = mapped_column(Date)
    agenda: Mapped[str] = mapped_column(String(255))
    minutes: Mapped[str] = mapped_column(Text, default="")
    quorum_met: Mapped[bool] = mapped_column(Boolean, default=True)
    conducted_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    shg: Mapped["SHG"] = relationship(back_populates="meetings")
    attendances: Mapped[list["SHGAttendance"]] = relationship(cascade="all, delete-orphan")


class SHGAttendance(Base):
    __tablename__ = "shg_attendances"
    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("shg_meetings.id"), index=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    present: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped["User"] = relationship()


class ThriftContribution(Base):
    __tablename__ = "thrift_contributions"
    id: Mapped[int] = mapped_column(primary_key=True)
    shg_id: Mapped[int] = mapped_column(ForeignKey("shgs.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    month_year: Mapped[str] = mapped_column(String(10), index=True)  # e.g. "2026-10"
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    amount_due: Mapped[float] = mapped_column(Float, default=0.0)
    amount_paid: Mapped[float] = mapped_column(Float, default=0.0)
    payment_mode: Mapped[str] = mapped_column(String(50), default="wallet")
    reference_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="paid")  # pending | paid | late
    paid_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    user: Mapped["User"] = relationship()
    shg: Mapped["SHG"] = relationship()


class InternalLoan(Base):
    __tablename__ = "internal_loans"
    id: Mapped[int] = mapped_column(primary_key=True)
    shg_id: Mapped[int] = mapped_column(ForeignKey("shgs.id"), index=True)
    borrower_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[float] = mapped_column(Float)
    interest_rate: Mapped[float] = mapped_column(Float, default=12.0)
    tenure_months: Mapped[int] = mapped_column(Integer, default=6)
    purpose: Mapped[str] = mapped_column(String(200), default="")
    status: Mapped[str] = mapped_column(String(20), default="requested")  # requested | approved | rejected | active | closed
    repaid_amount: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    borrower: Mapped["User"] = relationship()
    shg: Mapped["SHG"] = relationship()


class LoanProduct(Base):
    __tablename__ = "loan_products"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    name_hi: Mapped[str] = mapped_column(String(120), default="")
    name_mr: Mapped[str] = mapped_column(String(120), default="")
    annual_rate: Mapped[float] = mapped_column(Float)
    min_amount: Mapped[float] = mapped_column(Float)
    max_amount: Mapped[float] = mapped_column(Float)
    min_tenure: Mapped[int] = mapped_column(Integer)
    max_tenure: Mapped[int] = mapped_column(Integer)
    allowed_schedule_types: Mapped[list] = mapped_column(JSON, default=list)  # ["monthly"] or ["monthly", "harvest_bullet"]
    required_documents: Mapped[list] = mapped_column(JSON, default=list)
    eligibility_notes: Mapped[str] = mapped_column(Text, default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Loan(Base):
    __tablename__ = "loans"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    shg_id: Mapped[int | None] = mapped_column(ForeignKey("shgs.id"), nullable=True)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("loan_products.id"), nullable=True)
    amount: Mapped[float] = mapped_column(Float)
    annual_rate: Mapped[float] = mapped_column(Float)
    tenure_months: Mapped[int] = mapped_column(Integer)
    purpose: Mapped[str] = mapped_column(String(200), default="")
    product_type: Mapped[str] = mapped_column(String(50), default="standard")
    schedule_type: Mapped[str] = mapped_column(String(30), default="monthly")
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | approved | disbursed | rejected | withdrawn | closed
    emi: Mapped[float] = mapped_column(Float, default=0)
    ai_score: Mapped[float] = mapped_column(Float, default=0)
    ai_band: Mapped[str] = mapped_column(String(20), default="")
    ai_factors: Mapped[list] = mapped_column(JSON, default=list)
    officer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    officer_note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    disbursed_on: Mapped[date | None] = mapped_column(Date, nullable=True)

    installments: Mapped[list["Installment"]] = relationship(
        back_populates="loan", order_by="Installment.number", cascade="all, delete-orphan"
    )
    documents: Mapped[list["LoanDocument"]] = relationship(cascade="all, delete-orphan")
    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    product: Mapped["LoanProduct | None"] = relationship()


class LoanDocument(Base):
    __tablename__ = "loan_documents"
    id: Mapped[int] = mapped_column(primary_key=True)
    loan_id: Mapped[int] = mapped_column(ForeignKey("loans.id"))
    doc_type: Mapped[str] = mapped_column(String(50))
    file_path: Mapped[str] = mapped_column(String(300), default="")
    original_name: Mapped[str] = mapped_column(String(200), default="")
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    content_type: Mapped[str] = mapped_column(String(100), default="")
    reference: Mapped[str] = mapped_column(String(200), default="")
    status: Mapped[str] = mapped_column(String(20), default="uploaded")  # uploaded | verified | rejected
    reject_reason: Mapped[str] = mapped_column(String(300), default="")
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class Installment(Base):
    __tablename__ = "installments"
    id: Mapped[int] = mapped_column(primary_key=True)
    loan_id: Mapped[int] = mapped_column(ForeignKey("loans.id"), index=True)
    number: Mapped[int] = mapped_column(Integer)
    due_date: Mapped[date] = mapped_column(Date, index=True)
    amount: Mapped[float] = mapped_column(Float)
    principal_part: Mapped[float] = mapped_column(Float)
    interest_part: Mapped[float] = mapped_column(Float)
    paid_amount: Mapped[float] = mapped_column(Float, default=0)
    paid_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(10), default="pending")  # pending | partial | paid
    phase: Mapped[str] = mapped_column(String(50), default="Regular EMI")
    is_harvest: Mapped[bool] = mapped_column(Boolean, default=False)
    reminded: Mapped[bool] = mapped_column(Boolean, default=False)

    loan: Mapped["Loan"] = relationship(back_populates="installments")


class SavingsGoal(Base):
    __tablename__ = "savings_goals"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    target_amount: Mapped[float] = mapped_column(Float)
    saved_amount: Mapped[float] = mapped_column(Float, default=0)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class SavingsEntry(Base):
    __tablename__ = "savings_entries"
    id: Mapped[int] = mapped_column(primary_key=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("savings_goals.id"), index=True)
    amount: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Course(Base):
    __tablename__ = "courses"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(60), index=True)
    language: Mapped[str] = mapped_column(String(5), index=True)
    title: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str] = mapped_column(String(400), default="")
    content: Mapped[str] = mapped_column(Text)
    questions: Mapped[list["QuizQuestion"]] = relationship(cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    question: Mapped[str] = mapped_column(String(300))
    options: Mapped[list] = mapped_column(JSON)
    answer_index: Mapped[int] = mapped_column(Integer)
    explanation: Mapped[str] = mapped_column(String(300), default="")


class CourseProgress(Base):
    __tablename__ = "course_progress"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    course_slug: Mapped[str] = mapped_column(String(60))
    best_score: Mapped[float] = mapped_column(Float, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Scheme(Base):
    __tablename__ = "schemes"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(50), default="")
    name: Mapped[str] = mapped_column(String(160))
    language: Mapped[str] = mapped_column(String(5), default="en")
    category: Mapped[str] = mapped_column(String(50), default="agriculture")
    benefit_summary: Mapped[str] = mapped_column(String(200), default="")
    benefit_value: Mapped[float] = mapped_column(Float, default=0.0)
    description: Mapped[str] = mapped_column(Text)
    eligibility: Mapped[str] = mapped_column(Text, default="")
    eligibility_rules: Mapped[dict] = mapped_column(JSON, default=dict)
    url: Mapped[str] = mapped_column(String(300), default="")
    last_verified: Mapped[str] = mapped_column(String(20), default="2026-10-01")


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    message: Mapped[str] = mapped_column(String(300))
    link: Mapped[str] = mapped_column(String(100), default="")
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    actor_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    action: Mapped[str] = mapped_column(String(60))
    entity: Mapped[str] = mapped_column(String(40))
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    detail: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Transaction(Base):
    __tablename__ = "transactions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    category: Mapped[str] = mapped_column(String(50), default="general")
    title: Mapped[str] = mapped_column(String(200))
    amount: Mapped[float] = mapped_column(Float)
    is_credit: Mapped[bool] = mapped_column(Boolean, default=True)
    mode: Mapped[str] = mapped_column(String(50), default="UPI")
    reference_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(20))  # user | assistant
    content: Mapped[str] = mapped_column(Text)
    card_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    language: Mapped[str] = mapped_column(String(5), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Grievance(Base):
    __tablename__ = "grievances"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    category: Mapped[str] = mapped_column(String(50))
    subject: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="open")  # open | in_progress | resolved
    response: Mapped[str] = mapped_column(Text, default="")
    resolved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
