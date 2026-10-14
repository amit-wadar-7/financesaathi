"""Unified Saathi Financial Health Score (0-100) Engine.

Single source of truth for financial health assessment.
Explicitly rule-based and educational; does NOT imply or pull an official credit bureau score.
"""

def compute_financial_health_score(
    income: float,
    expenses: float,
    existing_emi: float,
    savings: float,
    overdue_count: int = 0
) -> dict:
    """Computes transparent, educational Saathi Financial Health Score (0-100)."""
    income = max(0.0, float(income))
    expenses = max(0.0, float(expenses))
    existing_emi = max(0.0, float(existing_emi))
    savings = max(0.0, float(savings))

    disposable = max(0.0, income - expenses - existing_emi)
    foir = (existing_emi / income) if income > 0 else 1.0
    savings_cover = (savings / expenses) if expenses > 0 else 0.0
    expense_ratio = (expenses / income) if income > 0 else 1.0

    # Start from base 60 points
    score = 60.0

    # 1. Debt Burden (FOIR) component (+20 to -30)
    if income > 0:
        if foir <= 0.25:
            score += 20.0
        elif foir <= 0.40:
            score += 10.0
        elif foir <= 0.50:
            score -= 10.0
        else:
            score -= 25.0
    else:
        score -= 20.0

    # 2. Emergency Savings Cushion (+15 to -15)
    if savings_cover >= 3.0:
        score += 15.0
    elif savings_cover >= 1.0:
        score += 5.0
    else:
        score -= 10.0

    # 3. Monthly Expense Management (+10 to -10)
    if income > 0 and expense_ratio <= 0.60:
        score += 10.0
    elif income > 0 and expense_ratio > 0.85:
        score -= 10.0

    # 4. Overdue Delinquencies penalty (-15 per overdue installment)
    score -= (overdue_count * 15.0)

    # Clamp 0 to 100
    final_score = int(round(max(0.0, min(100.0, score))))

    if final_score >= 80:
        band = "excellent"
    elif final_score >= 65:
        band = "good"
    elif final_score >= 45:
        band = "fair"
    else:
        band = "needs_attention"

    factors = [
        {
            "feature": "Debt Burden (FOIR)",
            "impact": "positive" if foir <= 0.40 else "negative",
            "message": f"EMIs are {foir*100:.1f}% of income (healthy < 40%)." if foir <= 0.40 else f"High debt burden: EMIs consume {foir*100:.1f}% of income.",
        },
        {
            "feature": "Emergency Fund Cushion",
            "impact": "positive" if savings_cover >= 2.0 else "caution",
            "message": f"Savings cover {savings_cover:.1f} months of expenses." if savings_cover >= 1.0 else "Emergency buffer is below 1 month of living expenses.",
        },
        {
            "feature": "Payment Track Record",
            "impact": "positive" if overdue_count == 0 else "negative",
            "message": "Zero overdue installments on record." if overdue_count == 0 else f"{overdue_count} overdue installment(s) recorded.",
        },
    ]

    if overdue_count > 0 or foir > 0.40:
        recommended_course = "emi-and-loans"
    elif savings_cover < 2.0:
        recommended_course = "saving-habits"
    else:
        recommended_course = "avoid-fraud"

    return {
        "score": final_score,
        "band": band,
        "disposable_income": round(disposable, 2),
        "overdue_installments": overdue_count,
        "foir_pct": round(foir * 100, 1),
        "savings_cover_months": round(savings_cover, 1),
        "recommended_course": recommended_course,
        "factors": factors,
        "disclaimer": "The Saathi Financial Health Score is an educational diagnostic based on cashflow and platform performance. It is NOT an official credit score from external commercial credit bureaus.",
    }
