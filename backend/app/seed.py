from datetime import date, timedelta
import os
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import finance, models
from .config import ADMIN_EMAIL, ADMIN_PASSWORD, SEED_DEMO
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
    """Only executed when SEED_DEMO=true. Creates mathematically correct, neutral demo personas."""
    # Ensure neutral SHG exists
    shg = db.scalar(select(models.SHG).where(models.SHG.name == "Kalyani Mahila Bachat Gat"))
    if not shg:
        shg = models.SHG(name="Kalyani Mahila Bachat Gat", village="Sangli, Maharashtra", monthly_thrift_amount=500.0, corpus_balance=45000.0)
        db.add(shg)
        db.flush()

    # Neutral fictional personas
    demo_users = [
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
                savings_balance=sav,
                shg_id=shg.id if role in ("user", "shg_leader") else None,
                kyc_status="verified",
                kyc_aadhaar_last4="5432",
            )
            db.add(u)
            db.flush()
        user_objs[email] = u

    # Link Leader
    if "leader@financesaathi.org" in user_objs:
        shg.leader_id = user_objs["leader@financesaathi.org"].id

    db.commit()


def seed(db: Session):
    """Main seed entry point called during startup."""
    seed_content(db)
    if SEED_DEMO:
        seed_demo(db)
