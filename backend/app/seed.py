from datetime import date, timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models
from .security import hash_password
from .seed_data import COURSES, SCHEMES


def seed(db: Session):
    # 1. Ensure SHG exists
    shg = db.scalar(select(models.SHG).where(models.SHG.name == "Pragati Mahila & Kisan Bachat Gat"))
    if not shg:
        shg = models.SHG(name="Pragati Mahila & Kisan Bachat Gat", village="Sangli, Maharashtra")
        db.add(shg)
        db.flush()

    # 2. Seed / enrich users
    users_meta = [
        ("Rajesh Sharma", "admin@syra-demo.com", "admin123", "admin", "+91 98200 11001", 45000.0, 22000.0, 52000.0),
        ("Ramesh Deshmukh", "officer@syra-demo.com", "officer123", "officer", "+91 98200 22002", 38000.0, 19000.0, 41000.0),
        ("Sunita Kamble", "leader@syra-demo.com", "leader123", "shg_leader", "+91 97654 32100", 22000.0, 11000.0, 34800.0),
        ("Amit Wadar", "amit@syra-demo.com", "amit123", "user", "+91 98220 14829", 18000.0, 9300.0, 24500.0),
        ("Pooja Patil", "borrower@syra-demo.com", "borrower123", "user", "+91 94231 88201", 15000.0, 8200.0, 12400.0),
    ]

    user_objs = {}
    for name, email, pw, role, phone, inc, exp, sav in users_meta:
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
                savings_balance=sav,
                shg_id=shg.id if role in ("user", "shg_leader") else None,
            )
            db.add(u)
            db.flush()
        else:
            # Sync user metadata
            u.name = name
            u.role = role
            u.monthly_income = inc
            u.monthly_expenses = exp
            if u.savings_balance == 0:
                u.savings_balance = sav
            if not u.shg_id and role in ("user", "shg_leader"):
                u.shg_id = shg.id
        user_objs[email] = u

    # Link SHG Leader
    if "leader@syra-demo.com" in user_objs:
        shg.leader_id = user_objs["leader@syra-demo.com"].id

    # Also update any local existing users (e.g. amit123@gmail.com, amit1@gmail.com)
    for alt_email in ("amit123@gmail.com", "amit1@gmail.com"):
        alt_u = db.scalar(select(models.User).where(models.User.email == alt_email))
        if alt_u:
            alt_u.name = "Amit Wadar"
            if alt_u.monthly_income == 0:
                alt_u.monthly_income = 18000.0
            if alt_u.monthly_expenses == 0:
                alt_u.monthly_expenses = 9300.0
            if alt_u.savings_balance == 0:
                alt_u.savings_balance = 24500.0
            alt_u.shg_id = shg.id

    # 3. Seed Amit Wadar's specific data
    amit = user_objs.get("amit@syra-demo.com")
    if amit:
        # Check Amit's loans
        amit_loan = db.scalar(select(models.Loan).where(models.Loan.user_id == amit.id))
        if not amit_loan:
            today = date.today()
            amit_loan = models.Loan(
                user_id=amit.id,
                shg_id=shg.id,
                amount=20000.0,
                annual_rate=8.5,
                tenure_months=12,
                purpose="Agricultural Inputs & Irrigation Drip",
                product_type="kisan_agri",
                schedule_type="monthly",
                status="approved",
                emi=1850.0,
                ai_score=0.88,
                ai_band="ready",
                ai_factors=[
                    {"name": "Agricultural Cashflow", "impact": "High positive seasonal income"},
                    {"name": "SHG Thrift Track", "impact": "100% on-time weekly savings"},
                ],
                officer_note="Verified land records and SHG group guarantee. Approved at 8.5% interest subvention.",
            )
            db.add(amit_loan)
            db.flush()

            for n in range(1, 13):
                due_d = today - timedelta(days=(4 - n) * 30) if n < 4 else today + timedelta(days=(n - 4) * 30 + 5)
                is_paid = n < 4
                inst = models.Installment(
                    loan_id=amit_loan.id,
                    number=n,
                    due_date=due_d,
                    principal_part=1600.0,
                    interest_part=250.0,
                    amount=1850.0,
                    paid_amount=1850.0 if is_paid else 0.0,
                    paid_on=due_d if is_paid else None,
                    status="paid" if is_paid else "pending",
                )
                db.add(inst)

        # Amit's savings goal
        amit_goal = db.scalar(select(models.SavingsGoal).where(models.SavingsGoal.user_id == amit.id))
        if not amit_goal:
            amit_goal = models.SavingsGoal(
                user_id=amit.id,
                title="Emergency fund",
                target_amount=10000.0,
                saved_amount=6800.0,
                deadline=date.today() + timedelta(days=90),
            )
            db.add(amit_goal)
            db.flush()

        # Amit's real transactions matching the mockup
        amit_tx_count = db.scalar(select(models.Transaction).where(models.Transaction.user_id == amit.id).limit(1))
        if not amit_tx_count:
            tx_data = [
                ("Milk Sales", "milk_sales", 1200.0, True, "UPI", 1),
                ("Groceries & Provisions", "groceries", 450.0, False, "UPI", 2),
                ("Fertilizer & Bio-Neem Cake", "fertilizer", 800.0, False, "UPI", 4),
                ("PM-KISAN Direct Benefit Subsidy", "subsidy", 2000.0, True, "Bank Transfer", 8),
                ("Weekly Mandi Vegetable Sales", "crop_sale", 3400.0, True, "Cash", 15),
                ("EMI Payment: Kisan Agri Loan (Instalment #3)", "emi_payment", 1850.0, False, "UPI Settlement", 22),
                ("Cattle Feed & Mineral Mixture", "groceries", 1150.0, False, "UPI", 28),
                ("SHG Kisan Loan Disbursement", "loan_disbursement", 20000.0, True, "Bank Transfer", 45),
            ]
            for title, cat, amt, is_cr, mode, days_ago in tx_data:
                db.add(models.Transaction(
                    user_id=amit.id,
                    title=title,
                    category=cat,
                    amount=amt,
                    is_credit=is_cr,
                    mode=mode,
                    created_at=models.now() - timedelta(days=days_ago),
                ))

    # 4. Seed Pooja Patil's specific data
    pooja = user_objs.get("borrower@syra-demo.com")
    if pooja:
        pooja_loan = db.scalar(select(models.Loan).where(models.Loan.user_id == pooja.id))
        if not pooja_loan:
            today = date.today()
            pooja_loan = models.Loan(
                user_id=pooja.id,
                shg_id=shg.id,
                amount=15000.0,
                annual_rate=9.0,
                tenure_months=12,
                purpose="Tailoring Machine & Cloth Inventory",
                product_type="shg_enterprise",
                schedule_type="monthly",
                status="approved",
                emi=1320.0,
                ai_score=0.82,
                ai_band="ready",
                officer_note="Micro-enterprise garment stitching unit. Joint liability approved.",
            )
            db.add(pooja_loan)
            db.flush()

            for n in range(1, 13):
                due_d = today - timedelta(days=(3 - n) * 30) if n < 3 else today + timedelta(days=(n - 3) * 30 + 9)
                is_paid = n < 3
                inst = models.Installment(
                    loan_id=pooja_loan.id,
                    number=n,
                    due_date=due_d,
                    principal_part=1150.0,
                    interest_part=170.0,
                    amount=1320.0,
                    paid_amount=1320.0 if is_paid else 0.0,
                    paid_on=due_d if is_paid else None,
                    status="paid" if is_paid else "pending",
                )
                db.add(inst)

        pooja_goal = db.scalar(select(models.SavingsGoal).where(models.SavingsGoal.user_id == pooja.id))
        if not pooja_goal:
            pooja_goal = models.SavingsGoal(
                user_id=pooja.id,
                title="Sewing Machine & Inventory",
                target_amount=18000.0,
                saved_amount=9500.0,
                deadline=date.today() + timedelta(days=120),
            )
            db.add(pooja_goal)

        pooja_tx = db.scalar(select(models.Transaction).where(models.Transaction.user_id == pooja.id).limit(1))
        if not pooja_tx:
            pooja_tx_data = [
                ("Bridal Blouse & Stitching Orders", "tailoring", 2400.0, True, "Cash", 1),
                ("Cotton Cloth & Lining Fabric", "materials", 1100.0, False, "UPI", 3),
                ("Sewing Thread, Needles & Zippers", "materials", 250.0, False, "UPI", 6),
                ("SHG Weekly Group Thrift Deposit", "savings_deposit", 500.0, False, "Internal Transfer", 11),
                ("EMI Payment: Loan #2 (Instalment #2)", "emi_payment", 1320.0, False, "UPI Settlement", 21),
                ("Festive School Uniform Order", "tailoring", 4500.0, True, "UPI", 25),
            ]
            for title, cat, amt, is_cr, mode, days_ago in pooja_tx_data:
                db.add(models.Transaction(
                    user_id=pooja.id,
                    title=title,
                    category=cat,
                    amount=amt,
                    is_credit=is_cr,
                    mode=mode,
                    created_at=models.now() - timedelta(days=days_ago),
                ))

    # 5. Seed a pending loan for Loan Officer queue review
    officer = user_objs.get("officer@syra-demo.com")
    pending_loan = db.scalar(select(models.Loan).where(models.Loan.status == "pending").limit(1))
    if not pending_loan and amit:
        # Create a pending loan proposal from a new group member
        rekha = db.scalar(select(models.User).where(models.User.email == "rekha.shinde@syra-demo.com"))
        if not rekha:
            rekha = models.User(
                name="Rekha Shinde",
                email="rekha.shinde@syra-demo.com",
                phone="+91 98450 67123",
                password_hash=hash_password("rekha123"),
                role="user",
                monthly_income=16500.0,
                monthly_expenses=8800.0,
                savings_balance=14200.0,
                shg_id=shg.id,
            )
            db.add(rekha)
            db.flush()

        pending_loan = models.Loan(
            user_id=rekha.id,
            shg_id=shg.id,
            amount=35000.0,
            annual_rate=7.0,
            tenure_months=18,
            purpose="Solar Water Pump & Drip Irrigation",
            product_type="solar_green",
            schedule_type="monthly",
            status="pending",
            emi=2050.0,
            ai_score=0.86,
            ai_band="ready",
            ai_factors=[
                {"name": "PM-KUSUM Subsidy", "impact": "60% government capital subsidy eligible"},
                {"name": "Electricity Cost Elimination", "impact": "Zero monthly diesel/power cost"},
            ],
            officer_note="Underwriting review pending field verification of borehole.",
        )
        db.add(pending_loan)

    # 6. Seed courses and schemes if needed
    if not db.scalar(select(models.Course).limit(1)):
        for slug, langs in COURSES.items():
            for lang, (title, summary, content, quiz) in langs.items():
                course = models.Course(slug=slug, language=lang, title=title, summary=summary, content=content)
                for q, opts, ans, expl in quiz:
                    course.questions.append(models.QuizQuestion(question=q, options=opts, answer_index=ans,
                                                                explanation=expl))
                db.add(course)
    if not db.scalar(select(models.Scheme).limit(1)):
        for lang, items in SCHEMES.items():
            for name, desc, elig, url in items:
                db.add(models.Scheme(name=name, language=lang, description=desc, eligibility=elig, url=url))

    db.commit()

