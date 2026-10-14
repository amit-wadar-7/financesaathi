from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

Lang = Literal["en", "hi", "mr"]

COMMON_PASSWORDS = {
    "password", "12345678", "123456789", "qwerty123", "password123",
    "letmein123", "administrator1", "welcome123"
}


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8)
    phone: str = ""
    language: Lang = "en"
    consent: bool = Field(default=True, description="Consent for digital data processing under DPDP Act 2023")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("password")
    @classmethod
    def validate_password_bytes(cls, v: str) -> str:
        encoded = v.encode("utf-8")
        if len(encoded) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(encoded) > 72:
            raise ValueError("Password must not exceed 72 bytes (Bcrypt limit)")
        if v.lower() in COMMON_PASSWORDS:
            raise ValueError("Password is too common. Choose a stronger password.")
        return v

    @field_validator("consent")
    @classmethod
    def validate_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Consent under DPDP Act 2023 is required to register.")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str


class RefreshTokenIn(BaseModel):
    refresh_token: str


class ChangePasswordIn(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_new_pw(cls, v: str) -> str:
        encoded = v.encode("utf-8")
        if len(encoded) < 8:
            raise ValueError("New password must be at least 8 characters long")
        if len(encoded) > 72:
            raise ValueError("New password must not exceed 72 bytes (Bcrypt limit)")
        if v.lower() in COMMON_PASSWORDS:
            raise ValueError("Password is too common. Choose a stronger password.")
        return v


class ForgotPasswordIn(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_reset_pw(cls, v: str) -> str:
        encoded = v.encode("utf-8")
        if len(encoded) < 8:
            raise ValueError("New password must be at least 8 characters long")
        if len(encoded) > 72:
            raise ValueError("New password must not exceed 72 bytes (Bcrypt limit)")
        if v.lower() in COMMON_PASSWORDS:
            raise ValueError("Password is too common. Choose a stronger password.")
        return v


class ProfileIn(BaseModel):
    name: str | None = None
    phone: str | None = None
    language: Lang | None = None
    monthly_income: float | None = Field(default=None, ge=0)
    monthly_expenses: float | None = Field(default=None, ge=0)
    existing_emi: float | None = Field(default=None, ge=0)
    declared_savings: float | None = Field(default=None, ge=0)


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
    declared_savings: float = 0.0
    savings_balance: float
    shg_id: int | None
    kyc_status: str = "pending"
    kyc_aadhaar_last4: str | None = None
    consent_version: str = "1.0"
    created_at: datetime


class RoleIn(BaseModel):
    role: Literal["user", "shg_leader", "officer", "admin"]


class LoanProductOut(ORM):
    id: int
    code: str
    name: str
    name_hi: str
    name_mr: str
    annual_rate: float
    min_amount: float
    max_amount: float
    min_tenure: int
    max_tenure: int
    allowed_schedule_types: list[str]
    required_documents: list[str]
    eligibility_notes: str
    active: bool


class LoanIn(BaseModel):
    product_id: int | None = None
    product_code: str | None = None
    product_type: Literal[
        "standard", "kisan_agri", "pm_mudra", "mahila_shakti",
        "pm_svanidhi", "emergency_health", "solar_green", "artisan_micro"
    ] | None = None
    amount: float = Field(gt=0, le=1_000_000)
    tenure_months: int = Field(ge=1, le=120)
    annual_rate: float | None = None  # Ignored by server; server sets authoritative rate from LoanProduct
    schedule_type: Literal["monthly", "weekly", "harvest_bullet"] = "monthly"
    purpose: str = Field(default="", max_length=200)
    group_loan: bool = False
    documents: list[str] = Field(default_factory=list, description="e.g. ['aadhaar', 'income_proof']")


class DecisionIn(BaseModel):
    approve: bool
    note: str = Field(default="", max_length=500)


class EndorsementIn(BaseModel):
    note: str = Field(default="SHG Group Resolution & Peer Guarantee Endorsed", max_length=300)


class DocumentOut(ORM):
    id: int
    loan_id: int
    doc_type: str
    file_path: str = ""
    original_name: str = ""
    file_size: int = 0
    content_type: str = ""
    status: str = "required"
    reject_reason: str = ""
    verified: bool = False
    verified_by: int | None = None
    verified_at: datetime | None = None


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


class AiFactor(BaseModel):
    feature: str
    impact: str  # positive | caution | negative
    message: str


class LoanOut(ORM):
    id: int
    user_id: int
    borrower_name: str = ""
    shg_id: int | None
    group_loan: bool = False
    product_id: int | None = None
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
    ai_factors: list[dict] = []
    officer_note: str
    shg_endorsed: bool = False
    endorsed_by_id: int | None = None
    endorsed_by_name: str = ""
    endorsed_at: datetime | None = None
    endorsement_note: str = ""
    created_at: datetime
    decided_at: datetime | None
    disbursed_on: date | None = None
    documents: list[DocumentOut] = []


class PayIn(BaseModel):
    amount: float | None = Field(default=None, gt=0)
    source: Literal["wallet", "external_upi", "cash"] = "wallet"
    reference_id: str | None = None


class ForeclosureQuoteOut(BaseModel):
    loan_id: int
    outstanding_principal: float
    accrued_interest: float
    foreclosure_penalty: float = 0.0  # Zero penalty policy
    total_settlement_amount: float
    message: str = "Zero foreclosure penalty as per RBI Fair Practices Code"


class AffordabilityIn(BaseModel):
    monthly_income: float = Field(ge=0)
    monthly_expenses: float = Field(ge=0)
    existing_emi: float = Field(default=0, ge=0)
    declared_savings: float = Field(default=0, ge=0)
    savings_balance: float = Field(default=0, ge=0)
    amount: float = Field(gt=0)
    annual_rate: float = Field(ge=0, le=60)
    tenure_months: int = Field(ge=1, le=120)
    schedule_type: str = "monthly"


class SHGIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    village: str = ""
    monthly_thrift_amount: float = Field(default=0.0, ge=0)


class MemberIn(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class SHGInviteIn(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class SHGInviteOut(ORM):
    id: int
    shg_id: int
    shg_name: str = ""
    village: str = ""
    invited_email: str
    status: str
    created_at: datetime


class InviteResponseIn(BaseModel):
    accept: bool


class SHGMeetingIn(BaseModel):
    meeting_date: date
    agenda: str = Field(min_length=2, max_length=255)
    minutes: str = ""
    attendee_ids: list[int] = Field(default_factory=list)


class ThriftDepositIn(BaseModel):
    month_year: str = Field(min_length=7, max_length=10, description="e.g. 2026-10")
    amount: float = Field(gt=0)
    source: str = Field(default="wallet", description="'wallet' or 'external_upi'")
    reference_id: str | None = None


class InternalLoanIn(BaseModel):
    amount: float = Field(gt=0)
    tenure_months: int = Field(default=6, ge=1, le=24)
    purpose: str = Field(default="Emergency Medical / Agriculture", max_length=200)


class InternalLoanRepayIn(BaseModel):
    amount: float = Field(gt=0)


class InternalLoanDecisionIn(BaseModel):
    approve: bool
    note: str = ""


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
    language: Lang = "en"


class WalletDepositIn(BaseModel):
    amount: float = Field(gt=0)
    mode: str = Field(default="UPI", description="UPI, Bank Transfer, or Cash")
    reference_id: str | None = Field(default=None, description="UTR / Bank reference ID")


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


class GrievanceIn(BaseModel):
    category: str = Field(min_length=2, max_length=50)
    subject: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)


class GrievanceResponseIn(BaseModel):
    response: str = Field(min_length=5)
    status: Literal["in_progress", "resolved"] = "resolved"


class GrievanceOut(ORM):
    id: int
    user_id: int
    category: str
    subject: str
    description: str
    status: str
    response: str
    created_at: datetime
    resolved_at: datetime | None = None


class AdminCourseIn(BaseModel):
    slug: str = Field(min_length=2, max_length=60)
    language: str = Field(default="en", max_length=5)
    title: str = Field(min_length=2, max_length=200)
    summary: str = Field(default="", max_length=400)
    content: str = Field(min_length=10)


class AdminSchemeIn(BaseModel):
    code: str = Field(min_length=2, max_length=50)
    name: str = Field(min_length=2, max_length=200)
    language: str = Field(default="en", max_length=5)
    category: str = Field(default="general", max_length=50)
    benefit_summary: str = Field(default="", max_length=255)
    benefit_value: float = Field(default=0.0, ge=0)
    description: str = Field(min_length=10)
    eligibility: str = Field(min_length=5)
    url: str = Field(default="", max_length=255)


class AdminLoanProductIn(BaseModel):
    code: str = Field(min_length=2, max_length=50)
    name: str = Field(min_length=2, max_length=200)
    name_hi: str = Field(default="", max_length=200)
    name_mr: str = Field(default="", max_length=200)
    annual_rate: float = Field(gt=0, le=100)
    min_amount: float = Field(gt=0)
    max_amount: float = Field(gt=0)
    min_tenure: int = Field(ge=1, le=120)
    max_tenure: int = Field(ge=1, le=120)
    allowed_schedule_types: list[str] = ["monthly"]
    required_documents: list[str] = ["aadhaar"]
    eligibility_notes: str = ""
    active: bool = True

