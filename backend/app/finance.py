"""Pure financial maths used by calculators, loans and the AI module."""
import calendar
from datetime import date


def monthly_rate(annual_rate: float) -> float:
    return annual_rate / 12 / 100


def emi(principal: float, annual_rate: float, months: int) -> float:
    r = monthly_rate(annual_rate)
    if months <= 0:
        raise ValueError("months must be positive")
    if r == 0:
        return round(principal / months, 2)
    f = (1 + r) ** months
    return round(principal * r * f / (f - 1), 2)


def max_loan_for_emi(emi_amount: float, annual_rate: float, months: int) -> float:
    r = monthly_rate(annual_rate)
    if emi_amount <= 0:
        return 0.0
    if r == 0:
        return round(emi_amount * months, 2)
    return round(emi_amount * (1 - (1 + r) ** -months) / r, 2)


def add_months(d: date, m: int) -> date:
    y = d.year + (d.month - 1 + m) // 12
    mo = (d.month - 1 + m) % 12 + 1
    return date(y, mo, min(d.day, calendar.monthrange(y, mo)[1]))


def amortization(principal: float, annual_rate: float, months: int, start: date) -> list[dict]:
    """Rows of {number, due_date, amount, principal_part, interest_part, balance}."""
    r = monthly_rate(annual_rate)
    pay = emi(principal, annual_rate, months)
    balance = round(principal, 2)
    rows = []
    for n in range(1, months + 1):
        interest = round(balance * r, 2)
        if n == months:  # last instalment clears rounding drift
            princ = balance
            amt = round(princ + interest, 2)
        else:
            princ = round(pay - interest, 2)
            amt = pay
        balance = round(balance - princ, 2)
        rows.append({
            "number": n,
            "due_date": add_months(start, n),
            "amount": amt,
            "principal_part": princ,
            "interest_part": interest,
            "balance": max(balance, 0.0),
        })
    return rows


def simple_interest(principal: float, annual_rate: float, years: float) -> dict:
    interest = principal * annual_rate * years / 100
    return {"interest": round(interest, 2), "total": round(principal + interest, 2)}


def compound_interest(principal: float, annual_rate: float, years: float, times_per_year: int = 1) -> dict:
    total = principal * (1 + annual_rate / 100 / times_per_year) ** (times_per_year * years)
    return {"interest": round(total - principal, 2), "total": round(total, 2)}


def savings_projection(monthly_deposit: float, annual_rate: float, months: int) -> dict:
    r = monthly_rate(annual_rate)
    if r == 0:
        fv = monthly_deposit * months
    else:
        fv = monthly_deposit * (((1 + r) ** months - 1) / r)
    deposited = monthly_deposit * months
    return {"deposited": round(deposited, 2), "interest_earned": round(fv - deposited, 2), "final_value": round(fv, 2)}


def sahukar_comparison(principal: float, rate_per_hundred_per_month: float, months: int,
                       upfront_cut_pct: float = 0.0, institutional_rate: float = 12.0) -> dict:
    """Compares informal moneylender (sahukar) debt vs institutional SHG/bank credit.
    rate_per_hundred_per_month: e.g. 3.0 means 'Rs 3 per Rs 100 per month' = 36% flat per year.
    upfront_cut_pct: moneylender cutback deducted upfront (e.g. 5% or 10%).
    """
    monthly_rate_pct = rate_per_hundred_per_month
    annual_nominal_rate = monthly_rate_pct * 12

    # Amount borrower actually takes home after upfront cutback
    in_hand_amount = round(principal * (1.0 - upfront_cut_pct / 100.0), 2)

    # Moneylenders charge flat interest on the full nominal principal
    sahukar_monthly_interest = round(principal * (monthly_rate_pct / 100.0), 2)
    sahukar_total_interest = round(sahukar_monthly_interest * months, 2)
    sahukar_total_paid = round(principal + sahukar_total_interest, 2)

    # Effective APR based on cash in hand
    effective_apr = round((sahukar_total_interest / in_hand_amount) * (12.0 / months) * 100.0, 1) if in_hand_amount > 0 else annual_nominal_rate

    # Institutional comparison (reducing balance EMI at institutional_rate)
    inst_emi = emi(principal, institutional_rate, months)
    inst_total_paid = round(inst_emi * months, 2)
    inst_total_interest = round(inst_total_paid - principal, 2)

    total_savings = round(max(0.0, sahukar_total_paid - inst_total_paid), 2)
    interest_multiple = round(sahukar_total_interest / inst_total_interest, 1) if inst_total_interest > 0 else 1.0

    return {
        "principal": principal,
        "months": months,
        "in_hand_amount": in_hand_amount,
        "upfront_deduction": round(principal - in_hand_amount, 2),
        "sahukar": {
            "rate_per_hundred_per_month": rate_per_hundred_per_month,
            "nominal_annual_rate": annual_nominal_rate,
            "effective_apr": effective_apr,
            "monthly_interest": sahukar_monthly_interest,
            "total_interest": sahukar_total_interest,
            "total_repayment": sahukar_total_paid,
        },
        "institutional": {
            "annual_rate": institutional_rate,
            "emi": inst_emi,
            "total_interest": inst_total_interest,
            "total_repayment": inst_total_paid,
        },
        "wealth_loss": {
            "total_savings": total_savings,
            "interest_multiple": interest_multiple,
            "monthly_savings_avg": round(total_savings / months, 2) if months > 0 else 0.0,
        },
    }


def kisan_harvest_amortization(principal: float, annual_rate: float, months: int, start: date,
                               harvest_months: list[int] | None = None) -> list[dict]:
    """Generates a seasonal agricultural repayment schedule.
    In gestation/growth months: borrower pays interest-only maintenance to avoid default.
    In harvest months (e.g. month 6 and month 12): borrower pays bulk principal lumpsum after mandi crop sale.
    """
    if harvest_months is None:
        # Default harvest milestones based on loan tenure
        if months <= 6:
            harvest_months = [months]
        elif months <= 12:
            harvest_months = [6, months]
        else:
            harvest_months = [6, 12, months]

    harvest_set = set(harvest_months)
    num_harvests = len(harvest_set)
    if num_harvests == 0:
        return amortization(principal, annual_rate, months, start)

    principal_per_harvest = round(principal / num_harvests, 2)
    r = monthly_rate(annual_rate)
    balance = round(principal, 2)
    rows = []

    harvests_done = 0
    for n in range(1, months + 1):
        interest = round(balance * r, 2)
        is_harvest = n in harvest_set

        if is_harvest:
            harvests_done += 1
            if harvests_done == num_harvests:
                princ = balance  # clear remainder
            else:
                princ = min(balance, principal_per_harvest)
            amt = round(princ + interest, 2)
            phase = "Harvest / Mandi Sale"
        else:
            princ = 0.0
            amt = interest  # maintenance interest only
            phase = "Crop Growth / Gestation"

        balance = round(max(0.0, balance - princ), 2)
        rows.append({
            "number": n,
            "due_date": add_months(start, n),
            "phase": phase,
            "is_harvest": is_harvest,
            "amount": amt,
            "principal_part": princ,
            "interest_part": interest,
            "balance": balance,
        })
    return rows
