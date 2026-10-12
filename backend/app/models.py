from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def now():
    return datetime.utcnow()


class SHG(Base):
    __tablename__ = "shgs"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    village: Mapped[str] = mapped_column(String(120), default="")
    leader_id: Mapped[int | None] = mapped_column(Integer, nullable=True)  # plain int avoids a circular FK


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
    savings_balance: Mapped[float] = mapped_column(Float, default=0)
    shg_id: Mapped[int | None] = mapped_column(ForeignKey("shgs.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Loan(Base):
    __tablename__ = "loans"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    shg_id: Mapped[int | None] = mapped_column(ForeignKey("shgs.id"), nullable=True)
    amount: Mapped[float] = mapped_column(Float)
    annual_rate: Mapped[float] = mapped_column(Float)
    tenure_months: Mapped[int] = mapped_column(Integer)
    purpose: Mapped[str] = mapped_column(String(200), default="")
    product_type: Mapped[str] = mapped_column(String(50), default="standard")  # standard|kisan_agri|shg_enterprise|pm_svanidhi|emergency_health|solar_green
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|approved|rejected|closed
    emi: Mapped[float] = mapped_column(Float, default=0)
    ai_score: Mapped[float] = mapped_column(Float, default=0)
    ai_band: Mapped[str] = mapped_column(String(20), default="")
    ai_factors: Mapped[list] = mapped_column(JSON, default=list)
    officer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    officer_note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    installments: Mapped[list["Installment"]] = relationship(
        back_populates="loan", order_by="Installment.number", cascade="all, delete-orphan"
    )
    documents: Mapped[list["LoanDocument"]] = relationship(cascade="all, delete-orphan")
    user: Mapped[User] = relationship(foreign_keys=[user_id])


class LoanDocument(Base):
    """Checklist item (ID proof, income proof...). Metadata only; file upload can be added later."""
    __tablename__ = "loan_documents"
    id: Mapped[int] = mapped_column(primary_key=True)
    loan_id: Mapped[int] = mapped_column(ForeignKey("loans.id"))
    doc_type: Mapped[str] = mapped_column(String(50))
    reference: Mapped[str] = mapped_column(String(200), default="")
    verified: Mapped[bool] = mapped_column(Boolean, default=False)


class Installment(Base):
    __tablename__ = "installments"
    id: Mapped[int] = mapped_column(primary_key=True)
    loan_id: Mapped[int] = mapped_column(ForeignKey("loans.id"), index=True)
    number: Mapped[int] = mapped_column(Integer)
    due_date: Mapped[date] = mapped_column(Date)
    amount: Mapped[float] = mapped_column(Float)
    principal_part: Mapped[float] = mapped_column(Float)
    interest_part: Mapped[float] = mapped_column(Float)
    paid_amount: Mapped[float] = mapped_column(Float, default=0)
    paid_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(10), default="pending")  # pending|partial|paid
    reminded: Mapped[bool] = mapped_column(Boolean, default=False)

    loan: Mapped[Loan] = relationship(back_populates="installments")


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
    name: Mapped[str] = mapped_column(String(160))
    language: Mapped[str] = mapped_column(String(5), default="en")
    description: Mapped[str] = mapped_column(Text)
    eligibility: Mapped[str] = mapped_column(Text, default="")
    url: Mapped[str] = mapped_column(String(300), default="")


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    message: Mapped[str] = mapped_column(String(300))
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
