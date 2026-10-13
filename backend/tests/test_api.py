from datetime import date

from .conftest import login, make_user


def test_calculators(client):
    r = client.get("/calc/emi", params={"amount": 100000, "rate": 12, "months": 12}).json()
    assert r["emi"] == 8884.88
    assert client.get("/calc/simple-interest", params={"principal": 1000, "rate": 10, "years": 2}).json()["interest"] == 200
    assert client.get("/calc/compound-interest", params={"principal": 1000, "rate": 10, "years": 2}).json()["total"] == 1210
    cmp = client.get("/calc/compare-lenders", params={"amount": 50000, "months": 12, "rate_a": 12, "rate_b": 36}).json()
    assert cmp["extra_cost_of_b"] > 0

    # Emergency fund
    ef = client.get("/calc/emergency-fund", params={"monthly_expense": 15000, "months": 3, "current_savings": 20000}).json()
    assert ef["target_fund"] == 45000 and ef["gap"] == 25000

    # Sahukar predatory trap
    st = client.get("/calc/sahukar-trap", params={"amount": 30000, "rate_per_hundred_per_month": 3, "months": 12}).json()
    assert st["sahukar"]["effective_apr"] >= 36.0 and st["wealth_loss"]["total_savings"] > 0

    # Kisan harvest-aligned schedule
    ks = client.get("/calc/kisan-schedule", params={"amount": 50000, "rate": 7, "months": 12}).json()
    assert ks["harvest_count"] >= 1 and len(ks["schedule"]) == 12

    # Scheme matcher
    sm = client.get("/calc/scheme-match", params={"land_acres": 2.0, "is_shg_member": True, "gender": "female", "annual_income": 80000, "occupation": "farmer"}).json()
    assert sm["matched_count"] >= 3 and sm["total_eligible_value"] > 0


def test_auth_and_rbac(client, staff):
    assert client.get("/auth/me").status_code == 401
    r = client.post("/auth/register", json={"name": "A B", "email": "a@x.com", "password": "secret123"})
    assert r.status_code == 201 and r.json()["role"] == "user"
    assert client.post("/auth/register", json={"name": "A B", "email": "A@x.com", "password": "secret123"}).status_code == 409
    assert client.post("/auth/login", json={"email": "a@x.com", "password": "wrong"}).status_code == 401
    h = login(client, "a@x.com", "secret123")
    assert client.get("/admin/users", headers=h).status_code == 403
    assert client.get("/admin/users", headers=staff["admin"]).status_code == 200


def test_full_loan_lifecycle(client, staff):
    borrower = make_user(client, "borrower@x.com")
    other = make_user(client, "other@x.com")

    r = client.post("/loans", headers=borrower, json={"amount": 12000, "annual_rate": 12, "tenure_months": 3,
                                                       "purpose": "buy goat", "documents": ["aadhaar"]})
    assert r.status_code == 201, r.text
    loan = r.json()
    assert loan["status"] == "pending" and loan["ai_band"] in ("ready", "caution", "not_ready")
    lid = loan["id"]

    # privacy + permissions
    assert client.get(f"/loans/{lid}", headers=other).status_code == 404
    assert client.post(f"/loans/{lid}/decision", headers=borrower, json={"approve": True}).status_code == 403

    d = client.post(f"/loans/{lid}/decision", headers=staff["officer"], json={"approve": True, "note": "ok"})
    assert d.status_code == 200 and d.json()["status"] == "approved"
    assert client.post(f"/loans/{lid}/decision", headers=staff["officer"], json={"approve": False}).status_code == 409

    sched = client.get(f"/loans/{lid}/schedule", headers=borrower).json()
    assert len(sched) == 3
    assert abs(sum(i["principal_part"] for i in sched) - 12000) < 0.05

    assert client.post(f"/loans/{lid}/installments/1/pay", headers=other, json={}).status_code == 404
    assert client.post(f"/loans/{lid}/installments/1/pay", headers=borrower, json={"amount": 999999}).status_code == 400
    assert client.post(f"/loans/{lid}/installments/1/pay", headers=borrower, json={}).json()["status"] == "paid"
    for n in (2, 3):
        client.post(f"/loans/{lid}/installments/{n}/pay", headers=borrower, json={})
    assert client.get(f"/loans/{lid}", headers=borrower).json()["status"] == "closed"

    notes = client.get("/notifications", headers=borrower).json()
    assert any("approved" in n["message"] for n in notes)
    audit = client.get("/admin/audit", headers=staff["admin"]).json()
    assert {"apply", "approve", "payment"} <= {a["action"] for a in audit}


def test_requires_profile_before_applying(client):
    client.post("/auth/register", json={"name": "No Profile", "email": "np@x.com", "password": "secret123"})
    h = login(client, "np@x.com", "secret123")
    r = client.post("/loans", headers=h, json={"amount": 5000, "annual_rate": 12, "tenure_months": 6})
    assert r.status_code == 400


def test_affordability_and_health_score(client):
    h = make_user(client, "ai@x.com", income=12000, expenses=11000)
    body = {"monthly_income": 12000, "monthly_expenses": 11000, "existing_emi": 3000, "savings_balance": 0,
            "amount": 80000, "annual_rate": 24, "tenure_months": 12}
    r = client.post("/ai/affordability", headers=h, json=body).json()
    assert r["band"] == "not_ready" and r["factors"] and r["safe_emi"] == 0
    body.update(monthly_income=40000, monthly_expenses=12000, existing_emi=0, savings_balance=90000, amount=30000)
    assert client.post("/ai/affordability", headers=h, json=body).json()["band"] == "ready"
    hs = client.get("/ai/health-score", headers=h).json()
    assert 0 <= hs["score"] <= 100 and hs["recommended_course"]


def test_courses_quiz_and_schemes(client):
    h = make_user(client, "learn@x.com")
    for lang in ("en", "hi", "mr"):
        courses = client.get("/courses", params={"language": lang}).json()
        assert len(courses) == 3
        assert client.get("/schemes", params={"language": lang}).json()
    cid = client.get("/courses").json()[0]["id"]
    quiz = client.get(f"/courses/{cid}/quiz").json()
    assert "answer_index" not in quiz[0]
    res = client.post(f"/courses/{cid}/quiz/submit", headers=h, json={"answers": [0, 1]}).json()
    assert res["score"] == 100 and res["passed"]
    assert client.get("/progress", headers=h).json()[0]["completed"] is True


def test_shg_group_lending_and_savings(client, staff):
    shg = client.post("/shgs", headers=staff["leader"], json={"name": "Lakshmi SHG", "village": "Test"}).json()
    member = make_user(client, "member@x.com")
    assert client.post(f"/shgs/{shg['id']}/members", headers=staff["leader"], json={"email": "member@x.com"}).status_code == 200
    loan = client.post("/loans", headers=member, json={"amount": 8000, "annual_rate": 12, "tenure_months": 6,
                                                        "group_loan": True}).json()
    assert loan["shg_id"] == shg["id"]
    # leader can view member's group loan; an unrelated user cannot
    assert client.get(f"/loans/{loan['id']}", headers=staff["leader"]).status_code == 200
    assert client.get(f"/loans/{loan['id']}", headers=make_user(client, "stranger@x.com")).status_code == 404
    s = client.get(f"/shgs/{shg['id']}/summary", headers=staff["leader"]).json()
    assert s["group_loans"] == 1

    g = client.post("/savings/goals", headers=member, json={"title": "Goat", "target_amount": 5000}).json()
    g = client.post(f"/savings/goals/{g['id']}/deposit", headers=member, json={"amount": 1000}).json()
    assert g["progress_pct"] == 20.0


def test_staff_views(client, staff):
    assert client.get("/dashboard", headers=staff["officer"]).status_code == 200
    assert client.get("/officer/at-risk", headers=staff["officer"]).status_code == 200
    assert client.get("/officer/at-risk", headers=make_user(client, "plain@x.com")).status_code == 403
    assert "created" in client.post("/admin/run-reminders", headers=staff["admin"]).json()


def test_reports_catalog_and_data(client, staff):
    user = make_user(client, "report_user@x.com")
    cat = client.get("/reports/catalog", headers=user).json()
    assert len(cat["catalog"]) >= 8
    
    # Test specific report types
    r1 = client.get("/reports/data/par-aging", headers=staff["officer"]).json()
    assert "buckets" in r1 and "par_percentage" in r1

    r2 = client.get("/reports/data/tax-certificate", headers=user).json()
    assert "certificate_number" in r2 and "principal_repaid" in r2

    r3 = client.get("/reports/data/credit-health", headers=user).json()
    assert "bureau_score" in r3 and "factors" in r3

    r4 = client.get("/reports/data/rbi-compliance", headers=staff["admin"]).json()
    assert r4["psl_achieved_pct"] >= 75.0


def test_harvest_bullet_loan_lifecycle(client, staff):
    farmer = make_user(client, "farmer@x.com", income=25000, expenses=12000)
    r = client.post("/loans", headers=farmer, json={
        "amount": 40000,
        "annual_rate": 7.0,
        "tenure_months": 12,
        "purpose": "Kharif Seeds and Fertilizer",
        "product_type": "kisan_agri",
        "schedule_type": "harvest_bullet",
        "documents": ["aadhaar", "land_record"]
    })
    assert r.status_code == 201
    loan = r.json()
    assert loan["product_type"] == "kisan_agri"
    assert loan["schedule_type"] == "harvest_bullet"

    # Officer approves loan
    d = client.post(f"/loans/{loan['id']}/decision", headers=staff["officer"], json={"approve": True, "note": "Kisan subvention approved"})
    assert d.status_code == 200
    assert d.json()["status"] == "approved"

    # Verify amortization has gestation interest and harvest bullet principal
    sched = client.get(f"/loans/{loan['id']}/schedule", headers=farmer).json()
    assert len(sched) == 12
    harvest_installments = [i for i in sched if i["is_harvest"]]
    assert len(harvest_installments) >= 1
    # Check that total principal repaid equals loan amount
    total_principal = sum(i["principal_part"] for i in sched)
    assert abs(total_principal - 40000) < 0.1


