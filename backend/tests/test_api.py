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


def test_password_byte_boundaries_and_rate_limiting(client):
    # Rejects password exceeding 72 bytes
    long_pw = "a" * 75
    r = client.post("/auth/register", json={"name": "Long PW", "email": "long@x.com", "password": long_pw})
    assert r.status_code == 422

    # Rejects password less than 6 bytes
    short_pw = "123"
    r = client.post("/auth/register", json={"name": "Short PW", "email": "short@x.com", "password": short_pw})
    assert r.status_code == 422

    # Valid registration
    r = client.post("/auth/register", json={"name": "Valid User", "email": "valid_rate@x.com", "password": "validpassword123"})
    assert r.status_code == 201

    # Rate limiting: 5 consecutive failed logins should trigger HTTP 429
    for _ in range(5):
        client.post("/auth/login", json={"email": "valid_rate@x.com", "password": "wrongpassword"})
    lockout_res = client.post("/auth/login", json={"email": "valid_rate@x.com", "password": "wrongpassword"})
    assert lockout_res.status_code == 429


def test_authoritative_reports_and_borrower_isolation(client, staff):
    user_a = make_user(client, "user_a@x.com", income=30000, expenses=15000)
    user_b = make_user(client, "user_b@x.com", income=20000, expenses=10000)

    # 1. Tax certificate for user with 0 loan payments returns zero without fabricated 18,450
    tax_cert = client.get("/reports/data/tax-certificate", headers=user_a).json()
    assert tax_cert["principal_repaid"] == 0.0
    assert tax_cert["interest_paid"] == 0.0
    assert tax_cert["has_repayments"] is False

    # 2. Credit health returns explicit educational disclaimer
    health = client.get("/reports/data/credit-health", headers=user_a).json()
    assert "bureau_disclaimer" in health
    assert "NOT an official credit score pull" in health["bureau_disclaimer"]

    # 3. Borrower isolation: user_a cannot view user_b's statement even if passing user_id
    b_profile = client.get("/auth/me", headers=user_b).json()
    soa = client.get(f"/reports/data/loan-statement?user_id={b_profile['id']}", headers=user_a).json()
    # It must return user_a's data, ignoring the unauthorized user_id query parameter
    assert soa["borrower_email"] == "user_a@x.com"


def test_financial_ledger_invariants_and_deposit_audit(client):
    user = make_user(client, "ledger_user@x.com", income=25000, expenses=10000)
    
    # Create a savings goal
    goal = client.post("/savings/goals", headers=user, json={"title": "Tractor Tyre", "target_amount": 10000}).json()
    gid = goal["id"]

    # External goal deposit should record audit and transaction
    dep = client.post(f"/savings/goals/{gid}/deposit", headers=user, json={"amount": 2500}).json()
    assert dep["saved_amount"] == 2500

    # User deposits income into savings balance
    inc = client.post("/money/income", headers=user, json={"title": "Dairy Milk Payment", "amount": 5000, "category": "milk_sales"}).json()
    assert inc["balance"] >= 5000

    # Internal transfer from balance to goal
    tx = client.post("/money/transfer", headers=user, json={"target_goal_id": gid, "amount": 1500, "note": "Weekly allocation"}).json()
    assert tx["ok"] is True
    assert tx["goal_saved"] == 4000
    assert tx["balance"] == inc["balance"] - 1500


def test_savings_balance_mass_assignment_prevented(client):
    user = make_user(client, "mass_assign@x.com", income=20000, expenses=10000)
    me_before = client.get("/auth/me", headers=user).json()
    initial_savings = me_before["savings_balance"]

    # Attempt to overwrite savings_balance via PATCH /auth/me
    r = client.patch("/auth/me", headers=user, json={
        "name": "Tampered Name",
        "savings_balance": 999999.0
    })
    assert r.status_code == 200
    res = r.json()
    assert res["name"] == "Tampered Name"
    # savings_balance must NOT have changed
    assert res["savings_balance"] == initial_savings

    # Verify persistence in database
    me_after = client.get("/auth/me", headers=user).json()
    assert me_after["savings_balance"] == initial_savings


def test_expense_overdraft_prevention(client):
    user = make_user(client, "overdraft@x.com", income=20000, expenses=10000)
    # Deposit 1000
    inc = client.post("/money/income", headers=user, json={
        "title": "Stipend", "amount": 1000, "category": "stipend"
    }).json()
    balance = inc["balance"]
    assert balance >= 1000

    # Attempt expense exceeding balance
    excessive_amount = balance + 500
    r_bad = client.post("/money/expense", headers=user, json={
        "title": "Too Costly Item", "amount": excessive_amount, "category": "shopping"
    })
    assert r_bad.status_code == 400
    assert "Insufficient funds" in r_bad.json()["detail"]

    # Verify balance was not decremented
    me = client.get("/auth/me", headers=user).json()
    assert me["savings_balance"] == balance

    # Valid expense that drains exactly to 0 (or by exact balance)
    r_ok = client.post("/money/expense", headers=user, json={
        "title": "Exact Drain", "amount": balance, "category": "bills"
    })
    assert r_ok.status_code == 200
    assert r_ok.json()["balance"] == 0.0

    # Subsequent expense should now fail with 0 balance
    r_empty = client.post("/money/expense", headers=user, json={
        "title": "Fails at Zero", "amount": 10, "category": "misc"
    })
    assert r_empty.status_code == 400
    assert "Insufficient funds" in r_empty.json()["detail"]


def test_loan_schedule_type_and_product_whitelist(client):
    user = make_user(client, "types_test@x.com", income=25000, expenses=10000)

    # Invalid schedule_type
    r1 = client.post("/loans", headers=user, json={
        "amount": 20000, "annual_rate": 12, "tenure_months": 6,
        "purpose": "Test", "schedule_type": "invalid_frequency"
    })
    assert r1.status_code == 422

    # Invalid product_type
    r2 = client.post("/loans", headers=user, json={
        "amount": 20000, "annual_rate": 12, "tenure_months": 6,
        "purpose": "Test", "product_type": "unregistered_loan_product"
    })
    assert r2.status_code == 422

    # Valid product and schedule types
    r3 = client.post("/loans", headers=user, json={
        "amount": 20000, "annual_rate": 12, "tenure_months": 6,
        "purpose": "Test", "product_type": "pm_mudra", "schedule_type": "monthly"
    })
    assert r3.status_code == 201
    assert r3.json()["product_type"] == "pm_mudra"
    assert r3.json()["schedule_type"] == "monthly"


def test_shg_single_membership_invariant(client, staff):
    shg1 = client.post("/shgs", headers=staff["leader"], json={"name": "First SHG", "village": "Gram A"}).json()
    shg2 = client.post("/shgs", headers=staff["leader"], json={"name": "Second SHG", "village": "Gram B"}).json()

    member = make_user(client, "single_shg_member@x.com")

    # Enroll into shg1
    r1 = client.post(f"/shgs/{shg1['id']}/members", headers=staff["leader"], json={"email": "single_shg_member@x.com"})
    assert r1.status_code == 200

    # Attempt to enroll into shg2 -> HTTP 409
    r2 = client.post(f"/shgs/{shg2['id']}/members", headers=staff["leader"], json={"email": "single_shg_member@x.com"})
    assert r2.status_code == 409
    assert "already enrolled in another SHG" in r2.json()["detail"]

    # Verify user remains in shg1
    me = client.get("/auth/me", headers=member).json()
    assert me["shg_id"] == shg1["id"]


def test_document_verification_status_guard(client, staff):
    user = make_user(client, "doc_guard@x.com", income=30000, expenses=10000)
    loan = client.post("/loans", headers=user, json={
        "amount": 15000, "annual_rate": 12, "tenure_months": 6,
        "purpose": "Shop renovation", "documents": ["aadhaar", "pan"]
    }).json()
    lid = loan["id"]

    # Fetch loan details with documents
    loan_detail = client.get(f"/loans/{lid}", headers=user).json()
    doc_id = loan_detail["documents"][0]["id"]

    # While pending: verification is permitted
    v1 = client.post(f"/loans/{lid}/documents/{doc_id}/verify", headers=staff["officer"])
    assert v1.status_code == 200
    assert v1.json()["verified"] is True

    # Now reject the loan
    d = client.post(f"/loans/{lid}/decision", headers=staff["officer"], json={"approve": False, "note": "Income unverifiable"})
    assert d.status_code == 200
    assert d.json()["status"] == "rejected"

    # Try verifying another document on the rejected loan -> HTTP 409
    doc2_id = loan_detail["documents"][1]["id"]
    v2 = client.post(f"/loans/{lid}/documents/{doc2_id}/verify", headers=staff["officer"])
    assert v2.status_code == 409
    assert "Cannot verify documents on a rejected loan" in v2.json()["detail"]


def test_loan_products_catalog(client):
    r = client.get("/loan-products")
    assert r.status_code == 200
    products = r.json()
    assert len(products) >= 5
    codes = [p["code"] for p in products]
    assert "kisan_agri" in codes
    assert "pm_mudra" in codes
    assert "mahila_shakti" in codes


def test_maker_checker_officer_cannot_approve_own_loan(client, staff):
    # 1. Credit officer applies for a loan
    r = client.post("/loans", headers=staff["officer"], json={
        "amount": 25000, "tenure_months": 12, "purpose": "Personal Emergency",
        "product_type": "standard", "documents": ["aadhaar"]
    })
    assert r.status_code == 201
    lid = r.json()["id"]

    # 2. Same officer attempts to approve their own loan -> 403 Forbidden
    dec = client.post(f"/loans/{lid}/decision", headers=staff["officer"], json={"approve": True, "note": "Self-approval attempt"})
    assert dec.status_code == 403
    assert "Maker-checker violation" in dec.json()["detail"]

    # 3. Super Admin approves it -> 200 OK
    dec_admin = client.post(f"/loans/{lid}/decision", headers=staff["admin"], json={"approve": True, "note": "Admin approved"})
    assert dec_admin.status_code == 200
    assert dec_admin.json()["status"] == "approved"


def test_reports_role_based_access_control(client, staff):
    user = make_user(client, "report_rbac@x.com", income=25000, expenses=10000)

    # Borrower accessing standard borrower report (Loan Statement) -> 200 OK
    r_allowed = client.get("/reports/data/loan-statement", headers=user)
    assert r_allowed.status_code == 200

    # Borrower attempting to access administrative RBI compliance report -> 403 Forbidden
    r_denied = client.get("/reports/data/rbi-compliance", headers=user)
    assert r_denied.status_code == 403
    assert "Access forbidden" in r_denied.json()["detail"]

    # Admin accessing RBI compliance report -> 200 OK
    r_admin = client.get("/reports/data/rbi-compliance", headers=staff["admin"])
    assert r_admin.status_code == 200


def test_refresh_token_rotation_and_revocation(client):
    r_reg = client.post("/auth/register", json={
        "name": "Refresh Tester",
        "email": "refresh_test@x.com",
        "password": "SecurePassword123",
        "consent": True
    })
    assert r_reg.status_code == 201

    r_login = client.post("/auth/login", json={"email": "refresh_test@x.com", "password": "SecurePassword123"})
    assert r_login.status_code == 200
    toks = r_login.json()
    assert "access_token" in toks
    assert "refresh_token" in toks
    old_rt = toks["refresh_token"]

    # Rotate refresh token
    r_refresh = client.post("/auth/refresh", json={"refresh_token": old_rt})
    assert r_refresh.status_code == 200
    new_toks = r_refresh.json()
    new_rt = new_toks["refresh_token"]
    assert new_rt != old_rt

    # Old refresh token is revoked -> 401
    r_replay = client.post("/auth/refresh", json={"refresh_token": old_rt})
    assert r_replay.status_code == 401


def test_password_management_and_dpdp_rights(client):
    r_reg = client.post("/auth/register", json={
        "name": "DPDP Tester",
        "email": "dpdp_test@x.com",
        "password": "InitialPassword123",
        "consent": True
    })
    assert r_reg.status_code == 201

    auth_h = login(client, "dpdp_test@x.com", "InitialPassword123")

    # Change password
    r_cp = client.post("/auth/change-password", headers=auth_h, json={
        "old_password": "InitialPassword123",
        "new_password": "NewSecurePassword456"
    })
    assert r_cp.status_code == 200

    # Old password fails
    assert client.post("/auth/login", json={"email": "dpdp_test@x.com", "password": "InitialPassword123"}).status_code == 401
    # New password succeeds
    new_auth_h = login(client, "dpdp_test@x.com", "NewSecurePassword456")

    # DPDP Portability Export
    r_export = client.get("/me/export", headers=new_auth_h)
    assert r_export.status_code == 200
    export_data = r_export.json()
    assert export_data["profile"]["email"] == "dpdp_test@x.com"
    assert "loans" in export_data

    # DPDP Erasure Request
    r_del = client.post("/me/delete-request", headers=new_auth_h, json={"reason": "Closing accounts"})
    assert r_del.status_code == 200
    assert r_del.json()["ok"] is True


def test_loan_withdrawal_and_foreclosure(client, staff):
    user = make_user(client, "lifecycle_user@x.com", income=35000, expenses=12000)

    # 1. Apply for loan
    r_apply = client.post("/loans", headers=user, json={
        "amount": 30000, "tenure_months": 6, "purpose": "Livestock shed", "product_type": "standard"
    })
    assert r_apply.status_code == 201
    lid1 = r_apply.json()["id"]

    # 2. Cancel/withdraw pending loan
    r_cancel = client.post(f"/loans/{lid1}/cancel", headers=user)
    assert r_cancel.status_code == 200
    assert r_cancel.json()["status"] == "withdrawn"

    # Cannot cancel an already withdrawn loan
    assert client.post(f"/loans/{lid1}/cancel", headers=user).status_code == 400

    # 3. Apply again for a loan that will be approved, disbursed, and foreclosed
    r_apply2 = client.post("/loans", headers=user, json={
        "amount": 20000, "tenure_months": 6, "purpose": "Milch Cow Purchase", "product_type": "standard"
    })
    assert r_apply2.status_code == 201
    lid2 = r_apply2.json()["id"]

    # Underwriter approves loan
    r_appr = client.post(f"/loans/{lid2}/decision", headers=staff["officer"], json={"approve": True, "note": "Sanctioned"})
    assert r_appr.status_code == 200

    # Officer disburses loan
    r_disb = client.post(f"/loans/{lid2}/disburse", headers=staff["officer"])
    assert r_disb.status_code == 200
    assert r_disb.json()["status"] == "disbursed"

    # Wallet was credited with 20000
    me = client.get("/auth/me", headers=user).json()
    assert me["savings_balance"] >= 20000

    # 4. Fetch zero-penalty foreclosure quote
    r_quote = client.get(f"/loans/{lid2}/foreclosure-quote", headers=user)
    assert r_quote.status_code == 200
    quote = r_quote.json()
    assert quote["foreclosure_penalty"] == 0.0
    # 5. Top up wallet to cover principal + accrued interest, then execute foreclosure
    client.post("/money/deposit", headers=user, json={"amount": 2000})
    r_fc = client.post(f"/loans/{lid2}/foreclose", headers=user)
    assert r_fc.status_code == 200
    assert r_fc.json()["status"] == "closed"

    # All installments should be paid
    sched = client.get(f"/loans/{lid2}/schedule", headers=user).json()
    assert all(i["status"] == "paid" for i in sched)


def test_ledger_wallet_deposit_and_expense(client):
    user = make_user(client, "ledger_svc_user@x.com", income=28000, expenses=14000)
    me_before = client.get("/auth/me", headers=user).json()
    bal_before = me_before["savings_balance"]

    # Deposit money via UPI
    r_dep = client.post("/money/deposit", headers=user, json={
        "amount": 5000, "mode": "UPI", "reference_id": "UTR123456789012"
    })
    assert r_dep.status_code == 200
    assert r_dep.json()["balance"] == bal_before + 5000

    # Add expense
    r_exp = client.post("/money/expense", headers=user, json={
        "amount": 2000, "category": "farm_inputs", "title": "Urea & DAP Fertilizer", "mode": "UPI"
    })
    assert r_exp.status_code == 200
    assert r_exp.json()["balance"] == bal_before + 3000

    # Expense exceeding balance fails with 400
    r_excess = client.post("/money/expense", headers=user, json={
        "amount": 9999999, "category": "luxury", "title": "Impossible purchase", "mode": "UPI"
    })
    assert r_excess.status_code == 400


def test_document_upload_and_kyc_flow(client, staff):
    user = make_user(client, "kyc_user@x.com")
    other = make_user(client, "kyc_other@x.com")

    # 1. Apply for loan with 2 documents
    r_loan = client.post("/loans", headers=user, json={
        "amount": 15000, "annual_rate": 10, "tenure_months": 6,
        "purpose": "Dairy cow purchase", "product_type": "kisan_agri",
        "documents": ["aadhaar", "income_proof"],
    })
    assert r_loan.status_code == 201
    loan = r_loan.json()
    lid = loan["id"]
    docs = loan["documents"]
    assert len(docs) == 2
    doc1_id = docs[0]["id"]
    doc2_id = docs[1]["id"]

    # 2. Test invalid magic bytes (plain text file)
    bad_file = ("bad.txt", b"Hello, this is just plain text", "text/plain")
    r_bad = client.post(f"/loans/{lid}/documents/{doc1_id}/upload", headers=user, files={"file": bad_file})
    assert r_bad.status_code == 400
    assert "Invalid file format" in r_bad.text

    # 3. Test file > 2MB
    huge_pdf = ("huge.pdf", b"%PDF" + b"A" * (2 * 1024 * 1024 + 10), "application/pdf")
    r_huge = client.post(f"/loans/{lid}/documents/{doc1_id}/upload", headers=user, files={"file": huge_pdf})
    assert r_huge.status_code == 400
    assert "File size exceeds" in r_huge.text

    # 4. Upload valid PDF for doc1
    valid_pdf = ("aadhaar_doc.pdf", b"%PDF-1.4 mock content bytes for testing", "application/pdf")
    r_up1 = client.post(f"/loans/{lid}/documents/{doc1_id}/upload", headers=user, files={"file": valid_pdf})
    assert r_up1.status_code == 200
    assert r_up1.json()["status"] == "uploaded"
    assert r_up1.json()["original_name"] == "aadhaar_doc.pdf"

    # 5. Isolation: other user cannot download doc1
    r_dn_other = client.get(f"/loans/{lid}/documents/{doc1_id}/download", headers=other)
    assert r_dn_other.status_code in (403, 404)

    # 6. Borrower can download doc1
    r_dn_self = client.get(f"/loans/{lid}/documents/{doc1_id}/download", headers=user)
    assert r_dn_self.status_code == 200
    assert r_dn_self.content == b"%PDF-1.4 mock content bytes for testing"

    # 7. Officer verifies doc1
    r_vf1 = client.post(f"/loans/{lid}/documents/{doc1_id}/verify", headers=staff["officer"])
    assert r_vf1.status_code == 200
    assert r_vf1.json()["verified"] is True
    assert r_vf1.json()["status"] == "verified"

    # 8. Upload valid PNG for doc2, then officer rejects it
    valid_png = ("income.png", b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR", "image/png")
    r_up2 = client.post(f"/loans/{lid}/documents/{doc2_id}/upload", headers=user, files={"file": valid_png})
    assert r_up2.status_code == 200

    r_rej2 = client.post(f"/loans/{lid}/documents/{doc2_id}/reject", headers=staff["officer"], json={
        "approve": False, "note": "Blurry seal, please provide clearer copy"
    })
    assert r_rej2.status_code == 200
    assert r_rej2.json()["status"] == "rejected"
    assert "Blurry seal" in r_rej2.json()["reject_reason"]

    # KYC of user should still not be verified
    me = client.get("/auth/me", headers=user).json()
    assert me["kyc_status"] != "verified"

    # 9. Borrower re-uploads valid JPEG for doc2
    valid_jpg = ("income_clear.jpg", b"\xff\xd8\xff\xe0\x00\x10JFIF", "image/jpeg")
    r_up2_retry = client.post(f"/loans/{lid}/documents/{doc2_id}/upload", headers=user, files={"file": valid_jpg})
    assert r_up2_retry.status_code == 200
    assert r_up2_retry.json()["status"] == "uploaded"

    # 10. Officer verifies doc2 -> Borrower KYC status flips to "verified"
    r_vf2 = client.post(f"/loans/{lid}/documents/{doc2_id}/verify", headers=staff["officer"])
    assert r_vf2.status_code == 200

    me_after = client.get("/auth/me", headers=user).json()
    assert me_after["kyc_status"] == "verified"


def test_shg_meetings_quorum_thrift_and_internal_loans(client, staff):
    leader = staff["leader"]
    member_b = make_user(client, "shg_member_b@x.com", income=22000, expenses=10000)

    # 1. Leader creates an SHG
    r_shg = client.post("/shgs", headers=leader, json={
        "name": "Kisan Pragati Bachat Gat",
        "village": "Wai, Satara",
        "monthly_thrift_amount": 500,
    })
    assert r_shg.status_code == 201
    shg_id = r_shg.json()["id"]

    # 2. Leader invites member B and member B accepts
    r_inv = client.post(f"/shgs/{shg_id}/invites", headers=leader, json={"email": "shg_member_b@x.com"})
    assert r_inv.status_code == 201
    inv_id = r_inv.json()["id"]

    # Member B sees pending invite
    my_invites = client.get("/shgs/invites/my", headers=member_b).json()
    assert any(i["id"] == inv_id for i in my_invites)

    # Member B accepts
    r_acc = client.post(f"/shgs/invites/{inv_id}/respond", headers=member_b, json={"accept": True})
    assert r_acc.status_code == 200

    # 3. Member B deposits funds into wallet
    client.post("/money/deposit", headers=member_b, json={"amount": 3000, "mode": "UPI"})
    bal_before = client.get("/auth/me", headers=member_b).json()["savings_balance"]

    # 4. Member B pays monthly thrift
    r_thrift = client.post(f"/shgs/{shg_id}/thrift", headers=member_b, json={
        "month_year": "2026-10",
        "amount": 500,
        "source": "wallet",
    })
    assert r_thrift.status_code == 201
    assert r_thrift.json()["corpus_balance"] == 500.0

    # Verify Member B's wallet was debited by 500
    bal_after = client.get("/auth/me", headers=member_b).json()["savings_balance"]
    assert bal_after == bal_before - 500

    # 5. Leader records meeting with attendance
    # Get members
    summ = client.get(f"/shgs/{shg_id}/summary", headers=leader).json()
    members = summ["members"]
    assert len(members) == 2
    b_id = next(m["id"] for m in members if m["name"] != "shg_member_b")  # leader or member_b

    # Meeting with 1 attendee (50% quorum)
    r_meet = client.post(f"/shgs/{shg_id}/meetings", headers=leader, json={
        "meeting_date": "2026-10-15",
        "agenda": "Quarterly Harvest Planning & Thrift Reconciliation",
        "minutes": "Passed resolution to grant inter-loans for seed procurement.",
        "attendee_ids": [members[0]["id"]],
    })
    assert r_meet.status_code == 201
    meet_data = r_meet.json()
    assert meet_data["quorum_pct"] == 50.0
    assert meet_data["quorum_met"] is True

    # Check meetings list
    meets = client.get(f"/shgs/{shg_id}/meetings", headers=member_b).json()
    assert len(meets) >= 1
    assert meets[0]["agenda"] == "Quarterly Harvest Planning & Thrift Reconciliation"

    # 6. Member B requests internal loan from corpus
    # Requesting > corpus should fail with 400
    r_excess = client.post(f"/shgs/{shg_id}/internal-loans", headers=member_b, json={
        "amount": 10000, "tenure_months": 6, "purpose": "Too much money"
    })
    assert r_excess.status_code == 400

    # Request valid loan of 300 (corpus has 500)
    r_loan = client.post(f"/shgs/{shg_id}/internal-loans", headers=member_b, json={
        "amount": 300, "tenure_months": 6, "purpose": "Emergency seed purchase"
    })
    assert r_loan.status_code == 201
    loan_id = r_loan.json()["id"]

    # 7. Leader sanctions internal loan
    r_appr = client.post(f"/shgs/{shg_id}/internal-loans/{loan_id}/decide", headers=leader, json={
        "approve": True, "note": "Approved by unanimous voice vote"
    })
    assert r_appr.status_code == 200
    assert r_appr.json()["status"] == "active"
    assert r_appr.json()["corpus_balance"] == 200.0  # 500 - 300 = 200

    # Borrower wallet was credited with 300
    bal_disb = client.get("/auth/me", headers=member_b).json()["savings_balance"]
    assert bal_disb == bal_after + 300

    # 8. Borrower repays internal loan
    r_repay = client.post(f"/shgs/{shg_id}/internal-loans/{loan_id}/repay", headers=member_b, json={
        "amount": 300
    })
    assert r_repay.status_code == 200
    assert r_repay.json()["status"] == "closed"
    assert r_repay.json()["corpus_balance"] == 500.0  # 200 + 300 = 500


def test_saathi_rag_and_history_persistence(client):
    user = make_user(client, "saathi_test_user@x.com", income=25000, expenses=12000)

    # 1. Ask a question about SHG rules in English
    res_en = client.post("/saathi/chat", headers=user, json={
        "message": "What is the minimum number of women required to form an SHG?",
        "language": "en"
    })
    assert res_en.status_code == 200
    data_en = res_en.json()
    assert "content" in data_en
    assert len(data_en["content"]) > 10

    # 2. Ask in Hindi
    res_hi = client.post("/saathi/chat", headers=user, json={
        "message": "स्वयं सहायता समूह के नियम क्या हैं?",
        "language": "hi"
    })
    assert res_hi.status_code == 200
    data_hi = res_hi.json()
    assert "content" in data_hi
    assert len(data_hi["content"]) > 10

    # 3. Retrieve history
    hist = client.get("/saathi/history", headers=user)
    assert hist.status_code == 200
    history_items = hist.json()
    assert len(history_items) == 4
    roles = [m["role"] for m in history_items]
    assert roles == ["user", "assistant", "user", "assistant"]
    assert history_items[0]["content"] == "What is the minimum number of women required to form an SHG?"

    # 4. Clear chat history
    clr = client.delete("/saathi/history", headers=user)
    assert clr.status_code == 200
    assert clr.json()["ok"] is True

    # 5. Verify history is empty
    hist_after = client.get("/saathi/history", headers=user).json()
    assert len(hist_after) == 0


def test_grievance_redressal_lifecycle(client, staff):
    borrower_a = make_user(client, "grievance_a@x.com", income=22000, expenses=11000)
    borrower_b = make_user(client, "grievance_b@x.com", income=25000, expenses=12000)

    # 1. Borrower A lodges a grievance
    g_res = client.post("/grievances", headers=borrower_a, json={
        "category": "loan_disbursement",
        "subject": "Disbursement Delay for Kisan Loan",
        "description": "My sanctioned loan has not reflected in my passbook after 48 hours."
    })
    assert g_res.status_code == 201
    g_data = g_res.json()
    gid = g_data["id"]
    assert g_data["status"] == "open"
    assert g_data["subject"] == "Disbursement Delay for Kisan Loan"

    # Borrower A receives a registration notification
    notifs = client.get("/notifications", headers=borrower_a).json()
    assert any("Grievance" in n["message"] for n in notifs)

    # 2. Borrower A sees ticket in list
    a_list = client.get("/grievances", headers=borrower_a).json()
    assert len(a_list) == 1
    assert a_list[0]["id"] == gid

    # 3. Borrower B cannot view Borrower A's grievance (403 Forbidden)
    b_peek = client.get(f"/grievances/{gid}", headers=borrower_b)
    assert b_peek.status_code == 403

    # 4. Staff views institutional grievances register
    staff_list = client.get("/grievances", headers=staff["officer"]).json()
    assert any(g["id"] == gid for g in staff_list)

    # 5. Staff resolves grievance
    res_sol = client.post(f"/grievances/{gid}/resolve", headers=staff["officer"], json={
        "status": "resolved",
        "response": "Disbursement ref #UTR991823 verified and credited to your wallet balance."
    })
    assert res_sol.status_code == 200
    assert res_sol.json()["status"] == "resolved"
    assert res_sol.json()["resolved_at"] is not None

    # 6. Borrower A sees resolution and notification
    updated_g = client.get(f"/grievances/{gid}", headers=borrower_a).json()
    assert updated_g["status"] == "resolved"
    assert "credited to your wallet" in updated_g["response"]









