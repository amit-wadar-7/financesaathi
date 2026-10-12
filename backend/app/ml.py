"""Loan affordability model (decision support only, never automated approval).

Trained at first use on SYNTHETIC data generated from common financial rules of thumb
(total EMI-to-income below ~40-50%, adequate savings buffer, controlled expenses).
Replace `make_training_data` with a real dataset when one is available.
Explanations come from the logistic-regression contributions (coefficient x standardised value).
"""
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from . import finance

FEATURES = ["foir", "emi_to_disposable", "savings_cover", "expense_ratio"]
_model = None


def make_features(income, expenses, existing_emi, savings, new_emi) -> dict:
    income_ = max(income, 1.0)
    disposable = income - expenses - existing_emi
    return {
        "foir": (existing_emi + new_emi) / income_,
        "emi_to_disposable": min(new_emi / max(disposable, 1.0), 5.0),
        "savings_cover": min(savings / max(expenses, 1.0), 12.0),
        "expense_ratio": expenses / income_,
    }


def make_training_data(n=6000, seed=42):
    rng = np.random.default_rng(seed)
    income = rng.uniform(5000, 60000, n)
    expense_ratio = rng.uniform(0.3, 0.95, n)
    expenses = income * expense_ratio
    existing = np.where(rng.random(n) < 0.5, 0, income * rng.uniform(0.02, 0.4, n))
    savings = expenses * rng.uniform(0, 10, n)
    new_emi = income * rng.uniform(0.03, 0.6, n)
    X, y = [], []
    for i in range(n):
        f = make_features(income[i], expenses[i], existing[i], savings[i], new_emi[i])
        logit = (4.5 - 8.0 * f["foir"] - 1.0 * min(f["emi_to_disposable"], 3)
                 - 2.0 * f["expense_ratio"] + 0.25 * f["savings_cover"] + rng.normal(0, 0.5))
        p = 1 / (1 + np.exp(-logit))
        X.append([f[k] for k in FEATURES])
        y.append(int(rng.random() < p))
    return np.array(X), np.array(y)


def get_model():
    global _model
    if _model is None:
        X, y = make_training_data()
        scaler = StandardScaler().fit(X)
        clf = LogisticRegression(max_iter=1000).fit(scaler.transform(X), y)
        _model = (scaler, clf)
    return _model


def model_metrics():
    from sklearn.metrics import accuracy_score, roc_auc_score
    from sklearn.model_selection import train_test_split
    X, y = make_training_data(seed=7)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=1)
    sc = StandardScaler().fit(Xtr)
    clf = LogisticRegression(max_iter=1000).fit(sc.transform(Xtr), ytr)
    prob = clf.predict_proba(sc.transform(Xte))[:, 1]
    return {"accuracy": round(accuracy_score(yte, prob > 0.5), 3), "auc": round(roc_auc_score(yte, prob), 3),
            "note": "Evaluated on synthetic data; not a real-world performance claim."}


def _message(name, raw, helps):
    if name == "foir":
        return f"Your total EMIs would be {raw*100:.0f}% of your income (aim for 40% or less)."
    if name == "emi_to_disposable":
        return f"This EMI would use {raw*100:.0f}% of the money left after expenses and existing EMIs."
    if name == "savings_cover":
        return f"Your savings cover about {raw:.1f} months of expenses."
    return f"Your expenses are {raw*100:.0f}% of your income."


def assess(income, expenses, existing_emi, savings, amount, annual_rate, months) -> dict:
    new_emi = finance.emi(amount, annual_rate, months)
    f = make_features(income, expenses, existing_emi, savings, new_emi)
    scaler, clf = get_model()
    x = scaler.transform([[f[k] for k in FEATURES]])
    prob = float(clf.predict_proba(x)[0, 1])
    # Contribution relative to a healthy reference profile (so "helps" = at least as good as healthy)
    ref = make_features(20000, 12000, 0, 60000, 0.25 * 20000)
    ref_x = scaler.transform([[ref[k] for k in FEATURES]])
    contrib = clf.coef_[0] * (x[0] - ref_x[0])

    disposable = income - expenses - existing_emi
    band = "ready" if prob >= 0.7 else "caution" if prob >= 0.4 else "not_ready"
    if disposable <= 0 or new_emi > disposable:  # hard safety guard on top of the model
        band = "not_ready"
        prob = min(prob, 0.39)

    raw_display = dict(f)
    raw_display["emi_to_disposable"] = new_emi / max(disposable, 1.0)
    factors = []
    for name, c in sorted(zip(FEATURES, contrib), key=lambda t: -abs(t[1])):
        factors.append({
            "feature": name,
            "impact": "helps" if c >= 0 else "hurts",
            "message": _message(name, raw_display[name], c > 0),
        })

    safe_emi = max(0.0, min(0.4 * income - existing_emi, 0.6 * disposable))
    return {
        "score": round(prob, 3),
        "band": band,
        "emi": new_emi,
        "safe_emi": round(safe_emi, 2),
        "safe_loan_amount": finance.max_loan_for_emi(safe_emi, annual_rate, months),
        "factors": factors,
        "disclaimer": "Decision support only. A human officer makes the final decision.",
    }
