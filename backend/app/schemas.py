from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Lang = Literal["en", "hi", "mr"]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    phone: str = ""
    language: Lang = "en"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class ProfileIn(BaseModel):
    name: str | None = None
    phone: str | None = None
    language: Lang | None = None
    monthly_income: float | None = Field(default=None, ge=0)
    monthly_expenses: float | None = Field(default=None, ge=0)
    existing_emi: float | None = Field(default=None, ge=0)
    savings_balance: float | None = Field(default=None, ge=0)


class UserOut(ORM):
    id: int
    name: str
    email: str
    phone: str
    role: str
    language: str
    monthly_income: float
    monthly_expenses: float
    existing_emi: float
    savings_balance: float
    shg_id: int | None


class RoleIn(BaseModel):
    role: Literal["user", "shg_leader", "officer", "admin"]


class LoanIn(BaseModel):
    amount: float = Field(gt=0, le=1_000_000)
    annual_rate: float = Field(ge=0, le=60)
    tenure_months: int = Field(ge=1, le=120)
    purpose: str = Field(default="", max_length=200)
    product_type: str = Field(default="standard", max_length=50)
    schedule_type: str = Field(default="monthly", max_length=30)
    group_loan: bool = False
    documents: list[str] = Field(default_factory=list, description="e.g. ['aadhaar', 'income_proof']")


class DecisionIn(BaseModel):
    approve: bool
    note: str = Field(default="", max_length=500)


class DocumentOut(ORM):
    id: int
    doc_type: str
    verified: bool


class InstallmentOut(ORM):
    number: int
    due_date: date
    amount: float
    principal_part: float
    interest_part: float
    paid_amount: float
    paid_on: date | None
    status: str
    phase: str = "Regular EMI"
    is_harvest: bool = False
    overdue: bool = False


class LoanOut(ORM):
    id: int
    user_id: int
    borrower_name: str = ""
    shg_id: int | None
    amount: float
    annual_rate: float
    tenure_months: int
    purpose: str
    product_type: str = "standard"
    schedule_type: str = "monthly"
    status: str
    emi: float
    ai_score: float
    ai_band: str
    ai_factors: list
    officer_note: str
    created_at: datetime
    decided_at: datetime | None
    documents: list[DocumentOut] = []


class PayIn(BaseModel):
    amount: float | None = Field(default=None, gt=0)


class AffordabilityIn(BaseModel):
    monthly_income: float = Field(ge=0)
    monthly_expenses: float = Field(ge=0)
    existing_emi: float = Field(default=0, ge=0)
    savings_balance: float = Field(default=0, ge=0)
    amount: float = Field(gt=0)
    annual_rate: float = Field(ge=0, le=60)
    tenure_months: int = Field(ge=1, le=120)


class SHGIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    village: str = ""


class MemberIn(BaseModel):
    email: EmailStr


class GoalIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    target_amount: float = Field(gt=0)
    deadline: date | None = None


class DepositIn(BaseModel):
    amount: float = Field(gt=0)


class QuizSubmitIn(BaseModel):
    answers: list[int]


class SaathiChatIn(BaseModel):
    message: str = Field(min_length=1)
    language: Lang = "mr"


class IncomeIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    category: str = "milk_sales"
    amount: float = Field(gt=0)
    mode: str = "UPI"


class ExpenseIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    category: str = "groceries"
    amount: float = Field(gt=0)
    mode: str = "UPI"


class TransferIn(BaseModel):
    target_goal_id: int
    amount: float = Field(gt=0)
    note: str = ""


class TransactionOut(ORM):
    id: int
    user_id: int
    category: str
    title: str
    amount: float
    is_credit: bool
    mode: str
    reference_id: str | None = None
    created_at: datetime


