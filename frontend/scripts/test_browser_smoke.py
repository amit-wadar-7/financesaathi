import json
import sys
import urllib.request
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:5173"
API_URL = "http://127.0.0.1:8000"

ROLES_CONFIG = [
    {
        "role": "borrower",
        "email": "borrower@financesaathi.in",
        "password": "Borrower#2025!",
        "routes": [
            "/",
            "/transactions",
            "/savings",
            "/loans",
            "/community",
            "/schemes",
            "/saathi",
            "/reports",
            "/tools",
            "/learn",
            "/grievances",
            "/profile",
        ]
    },
    {
        "role": "shg_leader",
        "email": "leader@financesaathi.in",
        "password": "Leader#2025!",
        "routes": [
            "/",
            "/reports",
            "/loans",
            "/transactions",
            "/schemes",
            "/saathi",
            "/community",
            "/savings",
            "/grievances",
            "/tools",
            "/learn",
            "/profile",
        ]
    },
    {
        "role": "officer",
        "email": "officer@financesaathi.in",
        "password": "Officer#2025!",
        "routes": [
            "/",
            "/reports",
            "/loans",
            "/at-risk",
            "/schemes",
            "/transactions",
            "/learn",
            "/tools",
            "/grievances",
            "/notifications",
        ]
    },
    {
        "role": "admin",
        "email": "admin@financesaathi.in",
        "password": "Admin#2025!",
        "routes": [
            "/",
            "/admin",
            "/reports",
            "/loans",
            "/at-risk",
            "/schemes",
            "/transactions",
            "/learn",
            "/tools",
            "/grievances",
            "/notifications",
        ]
    },
]

def get_auth_token(email, password):
    req = urllib.request.Request(
        f"{API_URL}/auth/login",
        data=json.dumps({"email": email, "password": password}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["access_token"]

def run_smoke_test():
    failures = []
    total_checks = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            headless=True
        )

        for cfg in ROLES_CONFIG:
            role = cfg["role"]
            token = get_auth_token(cfg["email"], cfg["password"])
            print(f"\n==================================================")
            print(f"Testing Role: {role.upper()} ({cfg['email']})")
            print(f"==================================================")

            # Test in Desktop Light, Desktop Dark, and Mobile Light
            viewports = [
                ("desktop_light", {"width": 1280, "height": 800}, "light"),
                ("desktop_dark", {"width": 1280, "height": 800}, "dark"),
                ("mobile_light", {"width": 360, "height": 780}, "light"),
            ]

            for vp_name, vp_dims, theme in viewports:
                ctx = browser.new_context(viewport=vp_dims)
                page = ctx.new_page()

                page_errors = []
                console_errors = []

                page.on("pageerror", lambda err: page_errors.append(str(err)))
                def handle_console(msg):
                    if msg.type == "error":
                        t = msg.text
                        if "favicon.ico" not in t and "DevTools" not in t:
                            console_errors.append(t)
                page.on("console", handle_console)

                # Initialize token and theme in localStorage
                page.goto(f"{BASE_URL}/")
                page.evaluate(f"""() => {{
                    localStorage.setItem('token', '{token}');
                    localStorage.setItem('theme', '{theme}');
                    document.documentElement.setAttribute('data-theme', '{theme}');
                }}""")

                for route in cfg["routes"]:
                    total_checks += 1
                    page_errors.clear()
                    console_errors.clear()

                    url = f"{BASE_URL}{route}"
                    page.goto(url)
                    page.wait_for_timeout(600)

                    # Check for ErrorBoundary or crash headings
                    has_error_boundary = page.evaluate("""() => {
                        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
                        for (const h of headings) {
                            const text = h.innerText.toLowerCase();
                            if (text.includes('dashboard error') || 
                                text.includes('something went wrong') || 
                                text.includes('error occurred') || 
                                text.includes('unexpected error')) {
                                return h.innerText;
                            }
                        }
                        return null;
                    }""")

                    # Horizontal scroll check
                    scroll_overflow = page.evaluate("""() => {
                        return document.documentElement.scrollWidth > window.innerWidth;
                    }""")

                    status = "PASS"
                    err_details = []
                    if has_error_boundary:
                        status = "FAIL"
                        err_details.append(f"ErrorBoundary caught: '{has_error_boundary}'")
                    if page_errors:
                        status = "FAIL"
                        err_details.append(f"Page errors: {page_errors}")
                    if console_errors:
                        status = "FAIL"
                        err_details.append(f"Console errors: {console_errors}")
                    if scroll_overflow and vp_name == "mobile_light":
                        status = "FAIL"
                        err_details.append(f"Horizontal scroll overflow detected at 360px!")

                    if status == "FAIL":
                        print(f"  [X] {role:10} | {vp_name:13} | {route:16} -> FAIL: {'; '.join(err_details)}")
                        failures.append((role, vp_name, route, err_details))
                    else:
                        print(f"  [✓] {role:10} | {vp_name:13} | {route:16} -> OK")

                ctx.close()

        browser.close()

    print(f"\n==================================================")
    print(f"SMOKE TEST SUMMARY: {total_checks - len(failures)}/{total_checks} PASSED")
    if failures:
        print(f"FAILURES DETECTED ({len(failures)}):")
        for f in failures:
            print(f"  - Role: {f[0]}, Mode: {f[1]}, Route: {f[2]} -> {f[3]}")
        sys.exit(1)
    else:
        print("ALL ROUTES, ROLES, VIEWPORTS, AND THEMES PASSED WITH ZERO ERRORS!")
        sys.exit(0)

if __name__ == "__main__":
    run_smoke_test()
