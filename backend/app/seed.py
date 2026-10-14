from datetime import date, timedelta
import os
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import finance, models
from .config import ADMIN_EMAIL, ADMIN_PASSWORD, SEED_DEMO, APP_ENV
from .security import hash_password
from .seed_data import COURSES, SCHEMES

LOAN_PRODUCTS_DATA = [
    {
        "code": "kisan_agri",
        "name": "Kisan Agri & Harvest Facility",
        "name_hi": "किसान कृषि एवं फसल ऋण सुविधा",
        "name_mr": "किसान कृषी आणि पीक कर्ज सुविधा",
        "annual_rate": 7.0,
        "min_amount": 5000.0,
        "max_amount": 150000.0,
        "min_tenure": 6,
        "max_tenure": 24,
        "allowed_schedule_types": ["monthly", "harvest_bullet"],
        "required_documents": ["aadhaar", "land_record", "income_proof"],
        "eligibility_notes": "Smallholder farmers, tenant cultivators, and Kisan Credit Card holders.",
    },
    {
        "code": "pm_mudra",
        "name": "PM MUDRA MSME Business Credit",
        "name_hi": "पीएम मुद्रा एमएसएमई व्यापार ऋण",
        "name_mr": "पीएम मुद्रा एमएसएमई व्यवसाय कर्ज",
        "annual_rate": 8.5,
        "min_amount": 10000.0,
        "max_amount": 200000.0,
        "min_tenure": 6,
        "max_tenure": 36,
        "allowed_schedule_types": ["monthly"],
        "required_documents": ["aadhaar", "pan", "business_proof"],
        "eligibility_notes": "Micro-enterprises, rural retail shops, and non-farm service units.",
    },
    {
        "code": "mahila_shakti",
        "name": "Mahila Shakti SHG Livelihood Advance",
        "name_hi": "महिला शक्ति एसएचजी आजीविका अग्रिम",
        "name_mr": "महिला शक्ती बचत गट उपजीविका कर्ज",
        "annual_rate": 8.5,
        "min_amount": 5000.0,
        "max_amount": 150000.0,
        "min_tenure": 6,
        "max_tenure": 24,
        "allowed_schedule_types": ["monthly"],
        "required_documents": ["aadhaar", "shg_resolution"],
        "eligibility_notes": "Active women Self-Help Group members with at least 6 months regular thrift savings.",
    },
    {
        "code": "pm_svanidhi",
        "name": "PM SVANidhi Street Vendor Credit",
        "name_hi": "पीएम स्वनिधि स्ट्रीट वेंडर ऋण",
        "name_mr": "पीएम स्वनिधी पथविक्रेता कर्ज",
        "annual_rate": 7.0,
        "min_amount": 2000.0,
        "max_amount": 50000.0,
        "min_tenure": 6,
        "max_tenure": 12,
        "allowed_schedule_types": ["monthly"],
        "required_documents": ["aadhaar", "vendor_certificate"],
        "eligibility_notes": "Urban and rural street vendors and small weekly haat traders.",
    },
    {
        "code": "emergency_health",
        "name": "Emergency Livelihood & Medical Care Advance",
        "name_hi": "आपातकालीन आजीविका एवं स्वास्थ्य अग्रिम",
        "name_mr": "आणीबाणी उपजीविका आणि आरोग्य कर्ज",
        "annual_rate": 6.0,
        "min_amount": 2000.0,
        "max_amount": 40000.0,
        "min_tenure": 3,
        "max_tenure": 12,
        "allowed_schedule_types": ["monthly"],
        "required_documents": ["aadhaar"],
        "eligibility_notes": "Urgent medical relief or sudden livelihood disruption.",
    },
    {
        "code": "solar_green",
        "name": "Clean Energy Solar Pump Financing",
        "name_hi": "स्वच्छ ऊर्जा सौर कृषि पंप वित्तपोषण",
        "name_mr": "स्वच्छ ऊर्जा सौर कृषी पंप वित्तपुरवठा",
        "annual_rate": 6.5,
        "min_amount": 15000.0,
        "max_amount": 300000.0,
        "min_tenure": 12,
        "max_tenure": 60,
        "allowed_schedule_types": ["monthly", "harvest_bullet"],
        "required_documents": ["aadhaar", "quotation_invoice", "land_record"],
        "eligibility_notes": "Farmers installing PM-KUSUM approved solar agri water pumps.",
    },
    {
        "code": "artisan_micro",
        "name": "Rural Artisan & Handloom Microcredit",
        "name_hi": "ग्रामीण कारीगर एवं हथकरघा सूक्ष्म ऋण",
        "name_mr": "ग्रामीण कारागीर आणि हातमाग सूक्ष्म कर्ज",
        "annual_rate": 8.0,
        "min_amount": 5000.0,
        "max_amount": 80000.0,
        "min_tenure": 6,
        "max_tenure": 24,
        "allowed_schedule_types": ["monthly"],
        "required_documents": ["aadhaar", "artisan_card"],
        "eligibility_notes": "Registered traditional craftspersons, weavers, and rural artisans.",
    },
    {
        "code": "standard",
        "name": "Standard Microfinance Term Loan",
        "name_hi": "मानक सूक्ष्म वित्त मियादी ऋण",
        "name_mr": "प्रमाणित सूक्ष्म वित्त मुदत कर्ज",
        "annual_rate": 12.0,
        "min_amount": 2000.0,
        "max_amount": 100000.0,
        "min_tenure": 3,
        "max_tenure": 24,
        "allowed_schedule_types": ["monthly"],
        "required_documents": ["aadhaar", "income_proof"],
        "eligibility_notes": "General purpose microcredit for verified borrowers.",
    },
]


def seed_content(db: Session):
    """Safe, idempotent initialization of product catalog, courses, and schemes."""
    # 1. Seed Loan Products
    for lp in LOAN_PRODUCTS_DATA:
        existing = db.scalar(select(models.LoanProduct).where(models.LoanProduct.code == lp["code"]))
        if not existing:
            db.add(models.LoanProduct(
                code=lp["code"],
                name=lp["name"],
                name_hi=lp["name_hi"],
                name_mr=lp["name_mr"],
                annual_rate=lp["annual_rate"],
                min_amount=lp["min_amount"],
                max_amount=lp["max_amount"],
                min_tenure=lp["min_tenure"],
                max_tenure=lp["max_tenure"],
                allowed_schedule_types=lp["allowed_schedule_types"],
                required_documents=lp["required_documents"],
                eligibility_notes=lp["eligibility_notes"],
                active=True,
            ))

    # 2. Seed Courses & Quiz Questions (Idempotent update & expansion to 8+ questions)
    for slug, lang_dict in COURSES.items():
        for lang, (title, summary, content, q_list) in lang_dict.items():
            c = db.scalar(select(models.Course).where(models.Course.slug == slug, models.Course.language == lang))
            if not c:
                c = models.Course(slug=slug, language=lang, title=title, summary=summary, content=content)
                db.add(c)
                db.flush()
                for q_text, opts, ans, expl in q_list:
                    db.add(models.QuizQuestion(
                        course_id=c.id,
                        question=q_text,
                        options=opts,
                        answer_index=ans,
                        explanation=expl,
                    ))
            else:
                c.title = title
                c.summary = summary
                c.content = content
                if len(c.questions) < len(q_list):
                    for old_q in list(c.questions):
                        db.delete(old_q)
                    db.flush()
                    for q_text, opts, ans, expl in q_list:
                        db.add(models.QuizQuestion(
                            course_id=c.id,
                            question=q_text,
                            options=opts,
                            answer_index=ans,
                            explanation=expl,
                        ))

    # 3. Seed Schemes (All 8 national schemes localized in EN, HI, MR)
    scheme_definitions = [
        ("pm_kisan", "agriculture", 6000.0),
        ("pm_mudra", "business", 1000000.0),
        ("pm_svanidhi", "business", 50000.0),
        ("day_nrlm", "livelihood", 150000.0),
        ("pmjdy", "banking", 0.0),
        ("pm_kusum", "solar", 150000.0),
        ("pm_awas", "housing", 120000.0),
        ("sukanya", "savings", 150000.0),
    ]

    scheme_rules = {
        "pm_kisan": {"occupations": ["farmer"], "requiresLand": True, "maxIncome": 800000},
        "pm_mudra": {"occupations": ["vendor", "artisan", "dairy", "general"], "requiresLand": False, "maxIncome": 1200000},
        "pm_svanidhi": {"occupations": ["vendor", "artisan", "general"], "requiresLand": False, "maxIncome": 500000},
        "day_nrlm": {"occupations": ["farmer", "artisan", "dairy", "general"], "isShgOnly": True, "isWomanOnly": True, "maxIncome": 400000},
        "pmjdy": {"occupations": ["farmer", "vendor", "artisan", "dairy", "general"], "maxIncome": 10000000},
        "pm_kusum": {"occupations": ["farmer"], "requiresLand": True, "maxIncome": 1500000},
        "pm_awas": {"occupations": ["farmer", "vendor", "artisan", "dairy", "general"], "maxIncome": 300000},
        "sukanya": {"occupations": ["farmer", "vendor", "artisan", "dairy", "general"], "isWomanOnly": True, "maxIncome": 1500000},
    }

    for lang in ("en", "hi", "mr"):
        lang_schemes = SCHEMES.get(lang, [])
        for idx, (code, category, val) in enumerate(scheme_definitions):
            if idx < len(lang_schemes):
                s_name, s_desc, s_elig, s_url = lang_schemes[idx]
                rules = scheme_rules.get(code, {})
                existing = db.scalar(select(models.Scheme).where(models.Scheme.code == code, models.Scheme.language == lang))
                ben_sum = f"Direct financial assistance up to Rs {val:,.0f}" if val > 0 else "Banking & Insurance"
                if not existing:
                    db.add(models.Scheme(
                        code=code,
                        name=s_name,
                        language=lang,
                        category=category,
                        benefit_summary=ben_sum,
                        benefit_value=val,
                        description=s_desc,
                        eligibility=s_elig,
                        eligibility_rules=rules,
                        url=s_url,
                        last_verified="2026-10-01",
                    ))
                else:
                    existing.name = s_name
                    existing.category = category
                    existing.benefit_summary = ben_sum
                    existing.benefit_value = val
                    existing.description = s_desc
                    existing.eligibility = s_elig
                    existing.eligibility_rules = rules
                    existing.url = s_url
                    existing.last_verified = "2026-10-01"

    # 4. Bootstrap Production Admin if configured
    if ADMIN_EMAIL and ADMIN_PASSWORD:
        admin_user = db.scalar(select(models.User).where(models.User.email == ADMIN_EMAIL.lower()))
        if not admin_user:
            db.add(models.User(
                name="System Administrator",
                email=ADMIN_EMAIL.lower(),
                password_hash=hash_password(ADMIN_PASSWORD),
                role="admin",
                is_active=True,
            ))

    db.commit()


def seed_demo(db: Session):
    """Creates mathematically correct, verified demo personas across all 4 platform roles."""
    # Ensure neutral SHG exists
    shg = db.scalar(select(models.SHG).where(models.SHG.name == "Kalyani Mahila Bachat Gat"))
    if not shg:
        shg = models.SHG(name="Kalyani Mahila Bachat Gat", village="Sangli, Maharashtra", monthly_thrift_amount=500.0, corpus_balance=45000.0)
        db.add(shg)
        db.flush()

    # Verified demo personas across both .in (primary) and .org (legacy) domains
    demo_users = [
        # Primary .in platform roles
        ("Rajesh Sharma", "admin@financesaathi.in", "Admin#2025!", "admin", "+91 98200 11001", 45000.0, 22000.0, 52000.0),
        ("Ramesh Deshmukh", "officer@financesaathi.in", "Officer#2025!", "officer", "+91 98200 22002", 38000.0, 19000.0, 41000.0),
        ("Kavita Rao", "leader@financesaathi.in", "Leader#2025!", "shg_leader", "+91 97654 32100", 22000.0, 11000.0, 34800.0),
        ("Asha Verma", "borrower@financesaathi.in", "Borrower#2025!", "user", "+91 94231 88201", 18000.0, 8500.0, 14500.0),
        ("Vikas Sharma", "farmer@financesaathi.in", "Farmer#2025!", "user", "+91 98220 14829", 20000.0, 9300.0, 24500.0),
        # Legacy .org aliases
        ("Rajesh Sharma", "admin@financesaathi.org", "AdminSecure#2026", "admin", "+91 98200 11001", 45000.0, 22000.0, 52000.0),
        ("Ramesh Deshmukh", "officer@financesaathi.org", "OfficerSecure#2026", "officer", "+91 98200 22002", 38000.0, 19000.0, 41000.0),
        ("Kavita Rao", "leader@financesaathi.org", "LeaderSecure#2026", "shg_leader", "+91 97654 32100", 22000.0, 11000.0, 34800.0),
        ("Vikas Sharma", "farmer@financesaathi.org", "FarmerSecure#2026", "user", "+91 98220 14829", 18000.0, 9300.0, 24500.0),
        ("Asha Verma", "borrower@financesaathi.org", "BorrowerSecure#2026", "user", "+91 94231 88201", 15000.0, 8200.0, 12400.0),
    ]

    user_objs = {}
    for name, email, pw, role, phone, inc, exp, sav in demo_users:
        u = db.scalar(select(models.User).where(models.User.email == email))
        if not u:
            u = models.User(
                name=name,
                email=email,
                phone=phone,
                password_hash=hash_password(pw),
                role=role,
                monthly_income=inc,
                monthly_expenses=exp,
                declared_savings=sav,
                savings_balance=0.0,
                shg_id=shg.id if role in ("user", "shg_leader") else None,
                kyc_status="verified",
                kyc_aadhaar_last4="5432",
            )
            db.add(u)
            db.flush()
        else:
            u.password_hash = hash_password(pw)
            u.role = role
            if u.monthly_income <= 0:
                u.monthly_income = inc
                u.monthly_expenses = exp
                u.declared_savings = sav
            if not u.shg_id and role in ("user", "shg_leader"):
                u.shg_id = shg.id

        if sav > 0:
            existing_open = db.scalar(
                select(models.Transaction).where(
                    models.Transaction.user_id == u.id,
                    models.Transaction.category == "opening_balance"
                )
            )
            if not existing_open:
                db.add(models.Transaction(
                    user_id=u.id,
                    category="opening_balance",
                    title="Opening Ledger Balance",
                    amount=sav,
                    is_credit=True,
                    mode="Opening Deposit",
                    reference_id=f"OPEN-{u.id}",
                ))
                db.flush()

        txs = db.scalars(select(models.Transaction).where(models.Transaction.user_id == u.id)).all()
        u.savings_balance = round(sum(t.amount for t in txs if t.is_credit) - sum(t.amount for t in txs if not t.is_credit), 2)
        user_objs[email] = u

    # Link Leader to SHG
    leader = user_objs.get("leader@financesaathi.in") or user_objs.get("leader@financesaathi.org")
    if leader:
        shg.leader_id = leader.id

    # Seed interactive data for primary borrower
    borrower = user_objs.get("borrower@financesaathi.in") or user_objs.get("borrower@financesaathi.org")
    if borrower:
        existing_loan = db.scalar(select(models.Loan).where(models.Loan.user_id == borrower.id))
        if not existing_loan:
            prod = db.scalar(select(models.LoanProduct).where(models.LoanProduct.code == "kisan_agri")) or db.scalars(select(models.LoanProduct)).first()
            rate = prod.annual_rate if prod else 7.0
            loan = models.Loan(
                user_id=borrower.id,
                shg_id=shg.id,
                product_id=prod.id if prod else None,
                amount=30000.0,
                annual_rate=rate,
                tenure_months=6,
                purpose="Kharif Hybrid Seeds & Organic Fertilizers",
                product_type="kisan_agri",
                schedule_type="monthly",
                status="approved",
                emi=5102.50,
                ai_score=84.0,
                ai_band="ready",
                ai_factors=[
                    {"name": "Net Disposable Surplus", "score": 90, "weight": 0.35, "impact": "positive", "message": "Strong monthly cashflow buffer"},
                    {"name": "SHG Thrift Track Record", "score": 85, "weight": 0.25, "impact": "positive", "message": "Punctual group meeting attendance and savings"}
                ],
                disbursed_on=date.today() - timedelta(days=45),
            )
            db.add(loan)
            db.flush()

            sched = finance.amortization(30000.0, rate, 6, date.today() - timedelta(days=45))
            for i_data in sched:
                inst = models.Installment(
                    loan_id=loan.id,
                    number=i_data["number"],
                    due_date=i_data["due_date"],
                    amount=i_data["amount"],
                    principal_part=i_data["principal_part"],
                    interest_part=i_data["interest_part"],
                    status="paid" if i_data["number"] == 1 else "pending",
                    paid_amount=i_data["amount"] if i_data["number"] == 1 else 0.0,
                    paid_on=i_data["due_date"] if i_data["number"] == 1 else None,
                    is_harvest=i_data.get("is_harvest", False)
                )
                db.add(inst)

            db.add(models.LoanDocument(
                loan_id=loan.id,
                doc_type="aadhaar",
                original_name="aadhaar_asha_verma.pdf",
                status="verified",
                verified=True
            ))

        # Pending loan for officer sanction queue
        farmer = user_objs.get("farmer@financesaathi.in") or user_objs.get("farmer@financesaathi.org")
        if farmer:
            existing_f_loan = db.scalar(select(models.Loan).where(models.Loan.user_id == farmer.id))
            if not existing_f_loan:
                f_loan = models.Loan(
                    user_id=farmer.id,
                    shg_id=shg.id,
                    amount=25000.0,
                    annual_rate=8.5,
                    tenure_months=12,
                    purpose="Drip Irrigation Tube Setup",
                    product_type="pm_mudra",
                    schedule_type="monthly",
                    status="pending",
                    emi=2180.50,
                    ai_score=78.0,
                    ai_band="ready",
                    ai_factors=[{"name": "Cashflow Sufficiency", "score": 80, "weight": 0.35, "impact": "positive", "message": "Adequate surplus for EMI"}]
                )
                db.add(f_loan)
                db.flush()
                db.add(models.LoanDocument(
                    loan_id=f_loan.id,
                    doc_type="aadhaar",
                    original_name="aadhaar_vikas_sharma.pdf",
                    status="uploaded",
                    verified=False
                ))

        # Savings Goal for borrower
        existing_goal = db.scalar(select(models.SavingsGoal).where(models.SavingsGoal.user_id == borrower.id))
        if not existing_goal:
            db.add(models.SavingsGoal(
                user_id=borrower.id,
                title="Gir Cow Purchase",
                target_amount=40000.0,
                saved_amount=12000.0,
                deadline=date.today() + timedelta(days=120)
            ))

        # Passbook Transactions
        existing_tx = db.scalar(select(models.Transaction).where(models.Transaction.user_id == borrower.id))
        if not existing_tx:
            db.add(models.Transaction(
                user_id=borrower.id,
                category="loan_disbursement",
                title="Loan Disbursement #1 (Kisan Agri)",
                amount=30000.0,
                is_credit=True,
                mode="Bank Transfer",
                reference_id="DISB20261014001",
            ))
            db.add(models.Transaction(
                user_id=borrower.id,
                category="loan_repayment",
                title="EMI #1 Settlement (Kisan Agri)",
                amount=5102.50,
                is_credit=False,
                mode="UPI",
                reference_id="UPI20261014002",
            ))
            db.add(models.Transaction(
                user_id=borrower.id,
                category="savings_deposit",
                title="Thrift Deposit - Gir Cow Purchase",
                amount=2000.0,
                is_credit=False,
                mode="UPI",
                reference_id="UPI20261014003",
            ))
            borrower.savings_balance = 37397.50

    db.commit()


def seed(db: Session):
    """Main seed entry point called during startup."""
    seed_content(db)
    if APP_ENV != "production" or SEED_DEMO:
        seed_demo(db)
