"""Public calculators plus the AI affordability endpoints."""
from datetime import date
import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import finance, ml, models, schemas
from ..database import get_db
from ..deps import get_current_user, get_current_user_optional
from ..finance_health import compute_financial_health_score
from ..saathi import get_saathi_answer


router = APIRouter(tags=["tools"])


@router.get("/calc/emi")
def calc_emi(amount: float = Query(gt=0), rate: float = Query(ge=0, le=60), months: int = Query(ge=1, le=360),
             schedule: bool = False):
    pay = finance.emi(amount, rate, months)
    out = {"emi": pay, "total_payment": round(pay * months, 2), "total_interest": round(pay * months - amount, 2)}
    if schedule:
        out["schedule"] = finance.amortization(amount, rate, months, date.today())
    return out


@router.get("/calc/simple-interest")
def calc_si(principal: float = Query(gt=0), rate: float = Query(ge=0), years: float = Query(gt=0)):
    return finance.simple_interest(principal, rate, years)


@router.get("/calc/compound-interest")
def calc_ci(principal: float = Query(gt=0), rate: float = Query(ge=0), years: float = Query(gt=0),
            times_per_year: int = Query(default=1, ge=1, le=365)):
    return finance.compound_interest(principal, rate, years, times_per_year)


@router.get("/calc/savings")
def calc_savings(monthly_deposit: float = Query(gt=0), rate: float = Query(ge=0), months: int = Query(ge=1, le=600)):
    return finance.savings_projection(monthly_deposit, rate, months)


@router.get("/calc/compare-lenders")
def compare_lenders(amount: float = Query(gt=0), months: int = Query(ge=1, le=120),
                    rate_a: float = Query(ge=0, le=100), rate_b: float = Query(ge=0, le=100)):
    """e.g. SHG at 12% vs moneylender at 36%: shows the real cost difference."""
    a, b = finance.emi(amount, rate_a, months), finance.emi(amount, rate_b, months)
    ia, ib = round(a * months - amount, 2), round(b * months - amount, 2)
    return {"lender_a": {"rate": rate_a, "emi": a, "total_interest": ia},
            "lender_b": {"rate": rate_b, "emi": b, "total_interest": ib},
            "extra_cost_of_b": round(ib - ia, 2)}


@router.get("/calc/emergency-fund")
def calc_emergency_fund(monthly_expense: float = Query(gt=0), months: int = Query(default=3, ge=1, le=24),
                        current_savings: float = Query(default=0.0, ge=0)):
    """Calculates institutional emergency buffer, coverage gap, and monthly target contributions."""
    target = round(monthly_expense * months, 2)
    gap = round(max(0.0, target - current_savings), 2)
    funded_pct = round(min(100.0, (current_savings / target) * 100), 1) if target > 0 else 100.0
    return {
        "monthly_expense": monthly_expense,
        "months": months,
        "target_fund": target,
        "current_savings": current_savings,
        "gap": gap,
        "funded_pct": funded_pct,
        "monthly_savings_needed_6mo": round(gap / 6, 2) if gap > 0 else 0.0,
        "monthly_savings_needed_12mo": round(gap / 12, 2) if gap > 0 else 0.0,
    }


@router.get("/calc/sahukar-trap")
def calc_sahukar_trap(amount: float = Query(gt=0),
                      rate_per_hundred_per_month: float = Query(default=3.0, gt=0, le=20),
                      months: int = Query(default=12, ge=1, le=60),
                      upfront_cut_pct: float = Query(default=0.0, ge=0, le=50),
                      institutional_rate: float = Query(default=12.0, ge=0, le=36)):
    """Exposes predatory moneylender rates (e.g. Rs 3/mo per Rs 100 = 36% APR) vs SHG/bank 12%."""
    return finance.sahukar_comparison(amount, rate_per_hundred_per_month, months, upfront_cut_pct, institutional_rate)


@router.get("/calc/kisan-schedule")
def calc_kisan_schedule(amount: float = Query(gt=0), rate: float = Query(default=7.0, ge=0, le=36),
                        months: int = Query(default=12, ge=3, le=36)):
    """Agricultural harvest-aligned repayment schedule where Gestation months are interest-only
    and Harvest months settle lumpsum principal from APMC mandi proceeds."""
    schedule = finance.kisan_harvest_amortization(amount, rate, months, date.today())
    harvest_payments = [r for r in schedule if r["is_harvest"]]
    gestation_payments = [r for r in schedule if not r["is_harvest"]]
    return {
        "amount": amount,
        "annual_rate": rate,
        "tenure_months": months,
        "schedule": schedule,
        "total_repayment": round(sum(r["amount"] for r in schedule), 2),
        "total_interest": round(sum(r["interest_part"] for r in schedule), 2),
        "harvest_count": len(harvest_payments),
        "gestation_count": len(gestation_payments),
        "avg_gestation_payment": round(sum(r["amount"] for r in gestation_payments) / len(gestation_payments), 2) if gestation_payments else 0.0,
        "avg_harvest_payment": round(sum(r["amount"] for r in harvest_payments) / len(harvest_payments), 2) if harvest_payments else 0.0,
    }


@router.get("/calc/scheme-match")
def match_schemes(land_acres: float = Query(default=1.5, ge=0),
                  is_shg_member: bool = Query(default=True),
                  gender: str = Query(default="female"),
                  annual_income: float = Query(default=75000.0, ge=0),
                  occupation: str = Query(default="farmer")):
    """Evaluates eligibility for flagship rural welfare schemes and subsidies."""
    matched = []
    total_benefits = 0.0

    # 1. Lakhpati Didi
    if is_shg_member and annual_income <= 150000 and gender.lower() == "female":
        matched.append({
            "code": "lakhpati_didi",
            "name": "Lakhpati Didi Rural Empowerment Mission",
            "benefit_type": "Direct Revolving Grant & Subsidized Capital",
            "max_value": 150000.0,
            "description": "Ministry of Rural Development scheme enabling SHG women to achieve annual household income of Rs 1,00,000+ through enterprise training and credit linkage.",
            "action_steps": "Apply via your SHG Village Organization (VO) and Gram Panchayat CLF.",
            "badge": "Highest Priority For SHG",
        })
        total_benefits += 150000.0

    # 2. PM-KISAN
    if occupation.lower() == "farmer" and land_acres > 0:
        matched.append({
            "code": "pm_kisan",
            "name": "PM Kisan Samman Nidhi (PM-KISAN)",
            "benefit_type": "Direct Benefit Transfer (DBT)",
            "max_value": 6000.0,
            "description": "Rs 6,000 direct annual income support in 3 equal four-monthly installments of Rs 2,000 directly transferred to Aadhaar-seeded bank account.",
            "action_steps": "Link Aadhaar with land record (7/12 extract) on PM-KISAN portal or CSC center.",
            "badge": "100% Guaranteed DBT",
        })
        total_benefits += 6000.0

    # 3. PMFBY Crop Insurance
    if occupation.lower() == "farmer":
        matched.append({
            "code": "pmfby",
            "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
            "benefit_type": "Comprehensive Crop Loss Coverage",
            "max_value": 50000.0,
            "description": "Subsidized crop insurance at nominal 1.5% (Rabi) and 2% (Kharif) premium with direct insurance claim settlement for drought, flood or pest damage.",
            "action_steps": "Enroll via primary agricultural credit society (PACS) or bank before sowing deadline.",
            "badge": "Calamity Shield",
        })
        total_benefits += 50000.0

    # 4. PM SVANidhi
    if occupation.lower() == "micro_vendor":
        matched.append({
            "code": "pm_svanidhi",
            "name": "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
            "benefit_type": "Working Capital Microcredit with 7% Interest Subsidy",
            "max_value": 50000.0,
            "description": "Collateral-free working capital loan starting at Rs 10,000, advancing to Rs 20,000 and Rs 50,000 upon timely repayment, plus digital transaction cashback.",
            "action_steps": "Submit Urban Local Body (ULB) vending certificate or recommendation letter.",
            "badge": "Working Capital",
        })
        total_benefits += 50000.0

    # 5. Mudra Shishu
    matched.append({
        "code": "mudra_shishu",
        "name": "Pradhan Mantri Mudra Yojana (PMMY - Shishu)",
        "benefit_type": "Collateral-Free Micro Enterprise Loan",
        "max_value": 50000.0,
        "description": "Sub-10% collateral-free credit up to Rs 50,000 for purchasing farm equipment, dairy cattle, or rural retail inventory.",
        "action_steps": "Submit simple business plan and KYC documents at nearest commercial or cooperative bank branch.",
        "badge": "Zero Collateral",
    })
    total_benefits += 50000.0

    return {
        "land_acres": land_acres,
        "is_shg_member": is_shg_member,
        "gender": gender,
        "annual_income": annual_income,
        "occupation": occupation,
        "matched_count": len(matched),
        "total_eligible_value": total_benefits,
        "schemes": matched,
    }


@router.post("/ai/affordability")
def affordability(body: schemas.AffordabilityIn, _=Depends(get_current_user)):
    """Also works as the what-if simulator: call again with a different amount or tenure."""
    return ml.assess(body.monthly_income, body.monthly_expenses, body.existing_emi, body.savings_balance,
                     body.amount, body.annual_rate, body.tenure_months)


@router.get("/ai/model-info")
def model_info():
    return ml.model_metrics()


@router.get("/ai/health-score")
def health_score(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Financial Health Score (0-100) + suggested next course. Feeds the learning loop."""
    if user.monthly_income <= 0:
        raise HTTPException(400, "Fill in your income and expenses in your profile first")

    loans = db.scalars(select(models.Loan).where(models.Loan.user_id == user.id, models.Loan.status.in_(["approved", "disbursed"]))).all()
    today = date.today()
    overdue = sum(1 for ln in loans for i in ln.installments if i.status != "paid" and i.due_date < today)

    declared_sav = user.declared_savings if user.declared_savings > 0 else user.savings_balance
    res = compute_financial_health_score(
        income=user.monthly_income,
        expenses=user.monthly_expenses,
        existing_emi=user.existing_emi,
        savings=declared_sav,
        overdue_count=overdue,
    )
    return {
        "score": res["score"],
        "band": res["band"],
        "disposable_income": res["disposable_income"],
        "overdue_installments": res["overdue_installments"],
        "recommended_course": res["recommended_course"],
        "factors": res["factors"],
        "disclaimer": res["disclaimer"],
    }


def _extract_amount(text: str, default: float = 20000.0) -> float:
    devanagari = "०१२३४५६७८९"
    t = text
    for i, d in enumerate(devanagari):
        t = t.replace(d, str(i))

    # Match lakh / लाख
    m_lakh = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|लाख)", t, re.IGNORECASE)
    if m_lakh:
        try:
            return float(m_lakh.group(1)) * 100000.0
        except ValueError:
            pass

    # Match hazar / हजार / हज़ार
    m_hazar = re.search(r"(\d+(?:\.\d+)?)\s*(?:hazar|हजार|हज़ार)", t, re.IGNORECASE)
    if m_hazar:
        try:
            return float(m_hazar.group(1)) * 1000.0
        except ValueError:
            pass

    # Hindi / Marathi word numbers
    words_map = {
        "एक": 1, "दोन": 2, "दो": 2, "तीन": 3, "चार": 4, "पाच": 5, "पांच": 5,
        "दहा": 10, "दस": 10, "वीस": 20, "बीस": 20, "तीस": 30, "चाळीस": 40, "चालीस": 40,
        "पन्नास": 50, "पचास": 50, "शंभर": 100, "सौ": 100,
    }
    for w, val in words_map.items():
        if re.search(rf"{w}\s*(?:हजार|हज़ार|hazar)", t, re.IGNORECASE):
            return float(val * 1000)

    # General digit numbers (e.g. 5000, 20,000, 100000)
    m = re.search(r"(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{2,8})", t, re.IGNORECASE)
    if m:
        try:
            return float(m.group(1).replace(",", ""))
        except ValueError:
            pass
    return default


@router.post("/ai/saathi-chat")
@router.post("/saathi/chat")
def saathi_chat(
    body: schemas.SaathiChatIn,
    user: models.User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Offline RAG-Lite Saathi AI Assistant."""
    answer = get_saathi_answer(body.message, language=body.language, user=user, db=db)

    # Persist message history if user is logged in
    if user:
        u_msg = models.ChatMessage(
            user_id=user.id,
            role="user",
            content=body.message,
            language=body.language,
        )
        a_msg = models.ChatMessage(
            user_id=user.id,
            role="assistant",
            content=answer.get("content", ""),
            card_data=answer.get("card_data"),
            language=body.language,
        )
        db.add(u_msg)
        db.add(a_msg)
        db.commit()

    return answer


@router.get("/saathi/history")
def get_chat_history(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetches persistent Saathi AI conversation history."""
    msgs = db.scalars(
        select(models.ChatMessage)
        .where(models.ChatMessage.user_id == user.id)
        .order_by(models.ChatMessage.created_at.asc())
        .limit(50)
    ).all()
    return [{
        "id": m.id,
        "role": m.role,
        "content": m.content,
        "card_data": m.card_data,
        "language": m.language,
        "created_at": m.created_at.isoformat(),
    } for m in msgs]


@router.delete("/saathi/history")
def clear_chat_history(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Deletes conversation history for user privacy."""
    db.query(models.ChatMessage).filter(models.ChatMessage.user_id == user.id).delete()
    db.commit()
    return {"ok": True, "message": "Conversation history cleared."}


