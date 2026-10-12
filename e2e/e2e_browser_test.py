import sys
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:5173"
errors = []

def run():
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 1100, "height": 900})
        page = ctx.new_page()
        page.on("console", lambda m: errors.append(("console", m.text)) if m.type == "error" and "400" not in m.text else None)
        page.on("pageerror", lambda e: errors.append(("pageerror", str(e))))
        page.on("response", lambda r: errors.append(("http", f"{r.status} {r.url}")) if r.status >= 500 else None)

        def login(email, pw):
            page.goto(BASE + "/")
            page.get_by_label("Email").fill(email)
            page.get_by_label("Password").fill(pw)
            page.get_by_role("button", name="Login").click()
            expect(page.get_by_text("Logout")).to_be_visible()

        def logout():
            page.get_by_text("Logout").click()
            expect(page.get_by_role("button", name="Login")).to_be_visible()

        # 1. register
        page.goto(BASE + "/register")
        page.get_by_label("Full name").fill("Sita Patil")
        page.get_by_label("Email").fill("sita@example.com")
        page.get_by_label("Password").fill("secret123")
        page.get_by_role("button", name="Register").click()
        expect(page.get_by_text("Welcome, Sita Patil")).to_be_visible()
        print("1 register+login ok")

        # health score before profile -> prompt
        expect(page.get_by_text("Please fill in your income")).to_be_visible()

        # 2. profile
        page.get_by_role("navigation").get_by_role("link", name="Profile", exact=True).click()
        page.get_by_label("Monthly income (Rs)").fill("25000")
        page.get_by_label("Monthly expenses (Rs)").fill("12000")
        page.get_by_label("Existing EMIs per month (Rs)").fill("0")
        page.get_by_label("Current savings (Rs)").fill("30000")
        page.get_by_role("button", name="Save").click()
        expect(page.get_by_text("Profile saved")).to_be_visible()
        page.get_by_role("navigation").get_by_role("link", name="Dashboard", exact=True).click()
        expect(page.get_by_text("/100")).to_be_visible()
        page.screenshot(path="/tmp/shots/dashboard.png")
        print("2 profile + health score ok")

        # 3. apply with live preview
        page.get_by_role("link", name="New loan").click()
        expect(page.get_by_text("Safe EMI for you")).to_be_visible()
        page.get_by_label("Amount (Rs)").fill("12000")
        page.get_by_label("Tenure (months)").fill("3")
        page.wait_for_timeout(900)
        page.get_by_label("Purpose").fill("buy goat")
        page.get_by_label("Aadhaar / ID proof").check()
        page.screenshot(path="/tmp/shots/apply.png")
        page.get_by_role("button", name="Apply").click()
        expect(page.get_by_role("heading", name="Loan #1")).to_be_visible()
        print("3 apply ok")
        logout()

        # 4. officer approves
        login("officer@syra-demo.com", "officer123")
        page.get_by_role("navigation").get_by_role("link", name="Loans", exact=True).click()
        page.get_by_role("link", name="#1").click()
        page.get_by_role("button", name="Verify").click()
        expect(page.get_by_text("Document verified")).to_be_visible()
        page.get_by_role("button", name="Approve").click()
        expect(page.get_by_text("Loan approved")).to_be_visible()
        expect(page.get_by_text("Repayment schedule")).to_be_visible()
        page.get_by_role("navigation").get_by_role("link", name="At-risk loans", exact=True).click()
        expect(page.get_by_role("heading", name="At-risk loans")).to_be_visible()
        print("4 officer verify+approve+at-risk ok")
        logout()

        # 5. borrower pays
        login("sita@example.com", "secret123")
        page.get_by_role("navigation").get_by_role("link", name="Loans", exact=True).click()
        page.get_by_role("link", name="#1").click()
        page.get_by_role("button", name="Pay").first.click()
        expect(page.get_by_text("Payment recorded")).to_be_visible()
        page.screenshot(path="/tmp/shots/loan.png", full_page=True)
        page.get_by_role("navigation").get_by_role("link", name="Dashboard", exact=True).click()
        expect(page.get_by_text("Outstanding")).to_be_visible()
        print("5 pay ok")

        # 6. notifications
        page.get_by_role("link", name="🔔").click()
        expect(page.get_by_text("approved")).to_be_visible()
        print("6 notifications ok")

        # 7. calculators
        page.get_by_role("navigation").get_by_role("link", name="Calculators", exact=True).click()
        page.get_by_role("button", name="Calculate").click()
        expect(page.get_by_text("Total interest")).to_be_visible()
        page.get_by_role("button", name="Compare lenders").click()
        page.get_by_role("button", name="Compare", exact=True).click()
        expect(page.get_by_text("costs")).to_be_visible()
        print("7 calculators ok")

        # 8. learn + quiz
        page.get_by_role("navigation").get_by_role("link", name="Learn", exact=True).click()
        page.get_by_role("link", name="Start").first.click()
        expect(page.get_by_text("What is an EMI?")).to_be_visible()
        page.get_by_label("Equated Monthly Instalment").check()
        page.get_by_label("40%").check()
        page.get_by_role("button", name="Submit").click()
        expect(page.get_by_text("Score: 100%")).to_be_visible()
        print("8 quiz ok")

        # 9. Hindi switch
        page.locator("header select").select_option("hi")
        page.get_by_role("navigation").get_by_role("link", name="योजनाएँ", exact=True).click()
        expect(page.get_by_text("पीएमजेडीवाई")).to_be_visible()
        page.screenshot(path="/tmp/shots/hindi_schemes.png")
        page.locator("header select").select_option("en")
        print("9 hindi ok")

        # 10. savings
        page.get_by_role("navigation").get_by_role("link", name="Savings", exact=True).click()
        page.get_by_placeholder("Goal (e.g. buy a goat)").fill("Goat")
        page.get_by_placeholder("Target (Rs)").fill("5000")
        page.get_by_role("button", name="Add").click()
        expect(page.get_by_text("Goat")).to_be_visible()
        page.get_by_placeholder("Add amount").fill("1000")
        page.get_by_role("button", name="Deposit").click()
        expect(page.get_by_text("(20%)")).to_be_visible()
        print("10 savings ok")
        logout()

        # 11. leader SHG
        login("leader@syra-demo.com", "leader123")
        page.get_by_role("navigation").get_by_role("link", name="My SHG", exact=True).click()
        page.get_by_label("SHG name").fill("Lakshmi SHG")
        page.get_by_role("button", name="Create").click()
        expect(page.get_by_text("Members").first).to_be_visible()
        page.get_by_placeholder("Member's registered email").fill("sita@example.com")
        page.get_by_role("button", name="Add member").click()
        expect(page.get_by_text("Member added")).to_be_visible()
        print("11 SHG ok")
        logout()

        # 12. admin
        login("admin@syra-demo.com", "admin123")
        page.get_by_role("navigation").get_by_role("link", name="Admin", exact=True).click()
        expect(page.get_by_text("Audit log")).to_be_visible()
        page.get_by_role("button", name="Send instalment reminders now").click()
        expect(page.get_by_text("reminder(s) created")).to_be_visible()
        print("12 admin ok")
        b.close()

try:
    run()
except Exception as e:
    print("FAILED:", str(e)[:1500])
print("browser errors:", errors or "none")
