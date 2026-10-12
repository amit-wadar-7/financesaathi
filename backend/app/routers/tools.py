"""Public calculators plus the AI affordability endpoints."""
from datetime import date
import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import finance, ml, models, schemas
from ..database import get_db
from ..deps import get_current_user, get_current_user_optional


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
    disposable = user.monthly_income - user.monthly_expenses - user.existing_emi
    f = ml.make_features(user.monthly_income, user.monthly_expenses, user.existing_emi, user.savings_balance, 0)
    score = 100.0
    score -= max(0, f["foir"] - 0.2) * 100          # debt burden
    score -= max(0, f["expense_ratio"] - 0.6) * 80  # spending
    score += min(f["savings_cover"], 6) * 3          # buffer
    overdue = 0
    loans = db.query(models.Loan).filter_by(user_id=user.id, status="approved").all()
    for ln in loans:
        overdue += sum(1 for i in ln.installments if i.status != "paid" and i.due_date < date.today())
    score -= overdue * 8
    score = int(max(0, min(100, score)))

    if overdue or f["foir"] > 0.4:
        course = "emi-and-loans"
    elif f["savings_cover"] < 3:
        course = "saving-habits"
    else:
        course = "avoid-fraud"
    return {"score": score, "disposable_income": round(disposable, 2), "overdue_installments": overdue,
            "recommended_course": course}


def _extract_amount(text: str, default: float = 20000.0) -> float:
    devanagari = "०१२३४५६७८९"
    t = text
    for i, d in enumerate(devanagari):
        t = t.replace(d, str(i))
    m = re.search(r"(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,7})", t, re.IGNORECASE)
    if m:
        try:
            return float(m.group(1).replace(",", ""))
        except ValueError:
            pass
    return default


@router.post("/ai/saathi-chat")
def saathi_chat(body: schemas.SaathiChatIn, user: models.User | None = Depends(get_current_user_optional),
                db: Session = Depends(get_db)):
    msg = body.message.lower().strip()
    lang = body.language
    user_name = user.name if user else ("सुनीता ताई" if lang == "mr" else "सुनीता जी" if lang == "hi" else "Sunita")

    is_loan_q = any(w in msg for w in ["कर्ज", "हप्ता", "loan", "emi", "व्याज", "interest", "व्याजा", "हप्ते", "किस्त"])
    is_cyber_q = any(w in msg for w in ["सायबर", "फसवणूक", "सुरक्षित", "cyber", "fraud", "scam", "otp", "pin", "सुरक्षा", "हैक", "धोका"])
    is_emergency_q = any(w in msg for w in ["emergency", "आपत्कालीन", "आपातकालीन", "फंड", "बफर", "buffer", "संकट"])
    is_scheme_q = any(w in msg for w in ["योजना", "scheme", "awas", "आवास", "svanidhi", "स्वनिधी", "lakhpati", "लाखपती", "mudra", "मुद्रा"])

    if is_loan_q or any(w in msg for w in ["२०,०००", "20,000", "20000", "५०,०००"]):
        amt = _extract_amount(body.message, default=20000.0)
        rate = 12.0
        tenure = 12
        emi_val = finance.emi(amt, rate, tenure)
        total_repay = round(emi_val * tenure, 2)
        total_interest = round(total_repay - amt, 2)

        if lang == "mr":
            greeting = f"नमस्ते {user_name}! तुमच्या बचत गटाच्या नेहमीच्या नियमांनुसार ({int(rate)}% वार्षिक व्याजदर, {tenure} महिने):"
            tip = "टीप: हे केवळ शैक्षणिक अंदाज आहे. प्रत्यक्ष हप्ता तुमच्या गटाच्या ठरावानुसार व कमी होणाऱ्या व्याजावर (reducing balance) निश्चित होईल."
            lbl_emi = "अंदाजे मासिक हप्ता (EMI)"
            lbl_int = "एकूण व्याज (Total Interest)"
            lbl_tot = "एकूण परतफेड (Repayment)"
            btn1 = "Open EMI Calculator"
            btn2 = "Read SHG Loan Rules"
            suggestions = ["Emergency Fund Calculator", "PM Awas Scheme eligibility", "बचत गट नियम", "सायबर सुरक्षा"]
        elif lang == "hi":
            greeting = f"नमस्ते {user_name}! आपके स्वयं सहायता समूह (SHG) के सामान्य नियमों के अनुसार ({int(rate)}% वार्षिक ब्याज, {tenure} महीने):"
            tip = "सुझाव: यह केवल शैक्षणिक अनुमान है। वास्तविक किस्त समूह के निर्णय व घटते ब्याज (reducing balance) पर तय होगी।"
            lbl_emi = "अनुमानित मासिक किस्त (EMI)"
            lbl_int = "कुल ब्याज (Total Interest)"
            lbl_tot = "कुल पुनर्भुगतान (Repayment)"
            btn1 = "Open EMI Calculator"
            btn2 = "Read SHG Loan Rules"
            suggestions = ["Emergency Fund Calculator", "PM Awas Scheme eligibility", "SHG ऋण नियम", "साइबर सुरक्षा"]
        else:
            greeting = f"Namaste {user_name}! Based on standard Self-Help Group terms ({int(rate)}% annual interest, {tenure} months):"
            tip = "Note: This is an educational estimate. Your actual EMI depends on SHG group resolution and reducing balance calculation."
            lbl_emi = "Estimated Monthly EMI"
            lbl_int = "Total Interest"
            lbl_tot = "Total Repayment"
            btn1 = "Open EMI Calculator"
            btn2 = "Read SHG Loan Rules"
            suggestions = ["Emergency Fund Calculator", "PM Awas Scheme eligibility", "SHG Loan Rules", "Cyber Safety Quiz"]

        return {
            "card_type": "emi_breakdown",
            "greeting": greeting,
            "tip": tip,
            "data": {
                "amount": amt,
                "annual_rate": rate,
                "tenure_months": tenure,
                "emi": emi_val,
                "total_interest": total_interest,
                "total_repayment": total_repay,
                "labels": {"emi": lbl_emi, "interest": lbl_int, "repayment": lbl_tot},
            },
            "actions": [
                {"id": "open_emi_calc", "label": btn1, "type": "route", "target": "/tools?calc=emi"},
                {"id": "open_shg_rules", "label": btn2, "type": "route", "target": "/learn/1"},
            ],
            "suggestions": suggestions,
        }

    if is_cyber_q:
        if lang == "mr":
            title = "सायबर सुरक्षेचे ३ सोपे सुवर्णनियम"
            steps = [
                {"num": 1, "title": "कधीही PIN किंवा OTP कोणालाही सांगू नका", "desc": "बँक कर्मचारी, गटप्रमुख किंवा पोलिस कधीही फोनवर तुमचा UPI PIN किंवा SMS OTP मागत नाहीत.", "tone": "danger"},
                {"num": 2, "title": "QR कोड स्कॅन करताना सावध राहा", "desc": "पैसे मिळवण्यासाठी कधीही QR स्कॅन किंवा PIN टाकावा लागत नाही. PIN फक्त पैसे पाठवताना लागतो.", "tone": "warn"},
                {"num": 3, "title": "तात्काळ तक्रार: राष्ट्रीय हेल्पलाइन १९३०", "desc": "कोणतीही संशयास्पद देवाणघेवाण झाल्यास त्वरित 1930 वर कॉल करा किंवा cybercrime.gov.in वर तक्रार नोंदवा.", "tone": "success"},
            ]
            btn1 = "Call 1930 Helpline"
            btn2 = "Take Cyber Quiz"
            suggestions = ["Emergency Fund Calculator", "PM Awas Scheme eligibility", "UPI सुरक्षा नियम"]
        elif lang == "hi":
            title = "साइबर सुरक्षा के 3 आसान स्वर्णिम नियम"
            steps = [
                {"num": 1, "title": "कभी भी PIN या OTP किसी को न बताएं", "desc": "बैंक अधिकारी, समूह प्रमुख या पुलिस कभी भी फोन पर आपका UPI PIN या SMS OTP नहीं मांगते।", "tone": "danger"},
                {"num": 2, "title": "QR कोड स्कैन करते समय सावधान रहें", "desc": "पैसे प्राप्त करने के लिए कभी भी QR कोड स्कैन या PIN डालने की आवश्यकता नहीं होती। PIN केवल पैसे भेजने पर लगता है।", "tone": "warn"},
                {"num": 3, "title": "तुरंत शिकायत: राष्ट्रीय हेल्पलाइन 1930", "desc": "किसी भी संदिग्ध धोखाधड़ी पर तुरंत 1930 डायल करें या cybercrime.gov.in पर शिकायत दर्ज करें।", "tone": "success"},
            ]
            btn1 = "Call 1930 Helpline"
            btn2 = "Take Cyber Quiz"
            suggestions = ["Emergency Fund Calculator", "PM Awas Scheme eligibility", "UPI सुरक्षा नियम"]
        else:
            title = "3 Golden Rules of Cyber & UPI Safety"
            steps = [
                {"num": 1, "title": "Never share your UPI PIN or SMS OTP", "desc": "Bank staff, SHG leaders, or police will NEVER ask for your UPI PIN or OTP over the phone.", "tone": "danger"},
                {"num": 2, "title": "Beware when scanning QR codes", "desc": "You NEVER scan a QR code or enter your PIN to RECEIVE money. A PIN is only needed to SEND money.", "tone": "warn"},
                {"num": 3, "title": "Report immediately: National Helpline 1930", "desc": "If fraud happens, immediately dial 1930 or file a report on cybercrime.gov.in.", "tone": "success"},
            ]
            btn1 = "Call 1930 Helpline"
            btn2 = "Take Cyber Quiz"
            suggestions = ["Emergency Fund Calculator", "PM Awas Scheme eligibility", "Cyber Safety Quiz"]

        return {
            "card_type": "cyber_security",
            "title": title,
            "steps": steps,
            "actions": [
                {"id": "call_1930", "label": btn1, "type": "tel", "target": "1930"},
                {"id": "open_cyber_quiz", "label": btn2, "type": "route", "target": "/learn/3"},
            ],
            "suggestions": suggestions,
        }

    if is_emergency_q:
        exp = user.monthly_expenses if user and user.monthly_expenses > 0 else 12000.0
        rec_buf = exp * 3
        if lang == "mr":
            greeting = f"नमस्ते {user_name}! अचानक उद्भवणाऱ्या वैद्यकीय किंवा कौटुंबिक संकटांसाठी आपत्कालीन निधी (Emergency Fund) अत्यंत महत्त्वाचा आहे."
            desc = f"तुमच्या मासिक खर्चानुसार (₹{exp:,.0f}/महिना) किमान ३ महिन्यांचा खर्च (₹{rec_buf:,.0f}) वेगळा ठेवण्याचा सल्ला दिला जातो."
            btn1 = "Open Emergency Calculator"
            btn2 = "Set Savings Goal"
            suggestions = ["माझ्या बचत गटातून कर्ज", "PM Awas Scheme eligibility", "बचत कशी वाढवावी?"]
        elif lang == "hi":
            greeting = f"नमस्ते {user_name}! अप्रत्याशित चिकित्सीय या पारिवारिक आपातकाल के लिए इमरजेंसी फंड बेहद ज़रूरी है।"
            desc = f"आपके मासिक खर्च (₹{exp:,.0f}/माह) के अनुसार कम से कम 3 महीने का खर्च (₹{rec_buf:,.0f}) अलग रखना चाहिए।"
            btn1 = "Open Emergency Calculator"
            btn2 = "Set Savings Goal"
            suggestions = ["SHG से ₹20,000 ऋण", "PM Awas Scheme eligibility", "बचत कैसे बढ़ाएं?"]
        else:
            greeting = f"Hello {user_name}! An emergency buffer is essential for sudden family or medical emergencies."
            desc = f"Based on monthly expenses (₹{exp:,.0f}/mo), maintaining at least a 3-month buffer of ₹{rec_buf:,.0f} in an SHG or bank is recommended."
            btn1 = "Open Emergency Calculator"
            btn2 = "Set Savings Goal"
            suggestions = ["SHG ₹20,000 Loan EMI", "PM Awas Scheme eligibility", "How to save more?"]

        return {
            "card_type": "emergency_fund",
            "greeting": greeting,
            "description": desc,
            "data": {"monthly_expense": exp, "recommended_fund": rec_buf, "months": 3},
            "actions": [
                {"id": "open_emergency_calc", "label": btn1, "type": "route", "target": "/tools?calc=emergency"},
                {"id": "open_savings_goal", "label": btn2, "type": "route", "target": "/savings"},
            ],
            "suggestions": suggestions,
        }

    if is_scheme_q:
        schemes = db.scalars(select(models.Scheme).where(models.Scheme.language == lang)).all()
        if not schemes:
            schemes = db.scalars(select(models.Scheme).where(models.Scheme.language == "en")).all()
        top_schemes = [{"name": s.name, "description": s.description, "url": s.url} for s in schemes[:2]]
        if lang == "mr":
            greeting = "तुमच्यासाठी केंद्र व राज्य शासनाच्या प्रमुख कल्याणकारी व सूक्ष्मवित्त योजना:"
            btn1 = "View All Schemes"
        elif lang == "hi":
            greeting = "आपके लिए केंद्र व राज्य सरकार की प्रमुख सूक्ष्मवित्त एवं कल्याणकारी योजनाएँ:"
            btn1 = "View All Schemes"
        else:
            greeting = "Key government microfinance and welfare schemes available for you:"
            btn1 = "View All Schemes"

        return {
            "card_type": "scheme_info",
            "greeting": greeting,
            "schemes": top_schemes,
            "actions": [{"id": "open_schemes", "label": btn1, "type": "route", "target": "/schemes"}],
            "suggestions": ["Emergency Fund Calculator", "माझ्या बचत गटातून कर्ज", "सायबर फसवणूक सुरक्षा"],
        }

    # General fallback response
    if lang == "mr":
        greeting = f"नमस्ते {user_name}! मी तुमची **साथी AI (Saathi AI)** वित्तीय सहकारी आहे. मी तुम्हाला बचत गट (SHG) कर्ज, हप्ता गणित, शासकीय योजना, कौटुंबिक बजेट आणि सायबर सुरक्षेबाबत संपूर्ण मार्गदर्शन करू शकते."
        suggestions = ["माझ्या बचत गटातून ₹२०,००० कर्ज", "मला सायबर फसवणुकीपासून कसे सुरक्षित ठेवायचे?", "Emergency Fund Calculator", "PM Awas Scheme eligibility"]
    elif lang == "hi":
        greeting = f"नमस्ते {user_name}! मैं आपकी **साथी AI (Saathi AI)** वित्तीय मार्गदर्शक हूँ। मैं आपको SHG ऋण, EMI गणना, सरकारी योजनाओं, पारिवारिक बजट और साइबर सुरक्षा के बारे में पूरी सहायता दे सकती हूँ।"
        suggestions = ["SHG से ₹20,000 ऋण का हफ्ता", "साइबर फ्रॉड से खुद को कैसे सुरक्षित रखें?", "Emergency Fund Calculator", "PM Awas Scheme eligibility"]
    else:
        greeting = f"Hello {user_name}! I am your **Saathi AI** financial companion. I can help calculate SHG loan EMIs, plan family budgets, check government schemes, and protect against cyber scams."
        suggestions = ["SHG ₹20,000 Loan EMI calculation", "How to stay safe from cyber fraud?", "Emergency Fund Calculator", "PM Awas Scheme eligibility"]

    return {
        "card_type": "general",
        "greeting": greeting,
        "actions": [
            {"id": "open_calc", "label": "Open Financial Calculators 🧮", "type": "route", "target": "/tools"},
            {"id": "open_learn", "label": "Explore Academy 🎓", "type": "route", "target": "/learn"},
        ],
        "suggestions": suggestions,
    }

