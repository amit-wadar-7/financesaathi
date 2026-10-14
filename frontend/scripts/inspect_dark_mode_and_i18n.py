import json
import math
import re
import sys
import urllib.request
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:5173"
API_URL = "http://127.0.0.1:8000"

def get_auth_token():
    req = urllib.request.Request(
        f"{API_URL}/auth/login",
        data=json.dumps({"email": "borrower@financesaathi.in", "password": "Borrower#2025!"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["access_token"]

def parse_rgb(rgb_str):
    m = re.match(r"rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)", rgb_str)
    if not m:
        return (0, 0, 0, 1.0)
    r, g, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
    a = float(m.group(4)) if m.group(4) is not None else 1.0
    return (r, g, b, a)

def luminance(r, g, b):
    def channel(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.03928 else math.pow((c + 0.055) / 1.055, 2.4)
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)

def contrast_ratio(lum1, lum2):
    l1 = max(lum1, lum2)
    l2 = min(lum1, lum2)
    return (l1 + 0.05) / (l2 + 0.05)

def check_headings_contrast(page, route_name):
    headings_data = page.evaluate("""() => {
        function getEffectiveBg(el) {
            let curr = el;
            while (curr && curr !== document) {
                const bg = window.getComputedStyle(curr).backgroundColor;
                const m = bg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
                if (m) {
                    const a = m[4] !== undefined ? parseFloat(m[4]) : 1.0;
                    if (a > 0.05) {
                        return bg;
                    }
                }
                curr = curr.parentElement;
            }
            return 'rgb(11, 17, 32)'; // default canvas dark bg
        }

        const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"], .title, .card h3, .page-header-row h2'));
        return elements.filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
        }).map(el => {
            const cs = window.getComputedStyle(el);
            return {
                tag: el.tagName.toLowerCase(),
                className: el.className,
                text: el.innerText.trim().slice(0, 60),
                color: cs.color,
                fontSize: cs.fontSize,
                fontWeight: cs.fontWeight,
                bg: getEffectiveBg(el)
            };
        });
    }""")

    print(f"\n--- Headings Contrast for {route_name} in DARK MODE ---")
    low_contrast = []
    for h in headings_data:
        fg_r, fg_g, fg_b, fg_a = parse_rgb(h['color'])
        bg_r, bg_g, bg_b, bg_a = parse_rgb(h['bg'])
        lum_fg = luminance(fg_r, fg_g, fg_b)
        lum_bg = luminance(bg_r, bg_g, bg_b)
        ratio = contrast_ratio(lum_fg, lum_bg)
        status = "OK" if ratio >= 4.5 else ("WARN" if ratio >= 3.0 else "FAIL")
        print(f"[{status:4}] {h['tag']:3} (ratio {ratio:4.1f}:1): '{h['text']}' (class: {h['className']}) | color: {h['color']} on bg: {h['bg']}")
        if ratio < 4.5:
            low_contrast.append((h, ratio))
    return low_contrast

def check_devanagari(page, route_name, lang="hi"):
    text_content = page.evaluate("""() => {
        const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, p, span, th, td, label, button, a, .badge, .title, .subtitle'));
        return elements
            .filter(el => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
            })
            .map(el => el.innerText ? el.innerText.trim() : '')
            .filter(t => t.length > 2);
    }""")
    lines = [line.strip() for block in text_content for line in block.splitlines() if len(line.strip()) > 2]
    alpha_lines = [l for l in lines if re.search(r"[A-Za-z\u0900-\u097F]", l) and not l.startswith("http")]
    dev_lines = [l for l in alpha_lines if re.search(r"[\u0900-\u097F]", l)]
    eng_lines = [l for l in alpha_lines if not re.search(r"[\u0900-\u097F]", l)]
    ratio = len(dev_lines) / len(alpha_lines) if alpha_lines else 1.0
    print(f"\n[{lang.upper()}] {route_name} -> {len(dev_lines)}/{len(alpha_lines)} Devanagari lines ({ratio:.1%})")
    if ratio < 0.90:
        print(f"Sample remaining English lines on {route_name} ({len(eng_lines)} total):")
        for el in eng_lines[:25]:
            print(f"   - {el}")
    return ratio, eng_lines

def run():
    token = get_auth_token()
    print("Obtained auth token successfully.")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            headless=True
        )
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        page = ctx.new_page()

        # Set localStorage before navigation
        page.goto(f"{BASE_URL}/")
        page.evaluate(f"""() => {{
            localStorage.setItem('token', '{token}');
            localStorage.setItem('theme', 'dark');
            document.documentElement.setAttribute('data-theme', 'dark');
        }}""")

        # 1. Check Passbook in Dark Mode
        page.goto(f"{BASE_URL}/transactions")
        page.wait_for_timeout(800)
        check_headings_contrast(page, "Passbook (/transactions)")

        # 2. Check Loans in Dark Mode
        page.goto(f"{BASE_URL}/loans")
        page.wait_for_timeout(800)
        check_headings_contrast(page, "Loans (/loans)")

        # 3. Check Dashboard in Dark Mode
        page.goto(f"{BASE_URL}/")
        page.wait_for_timeout(800)
        check_headings_contrast(page, "Dashboard (/)")

        # 4. Check Schemes in Dark Mode
        page.goto(f"{BASE_URL}/schemes")
        page.wait_for_timeout(800)
        check_headings_contrast(page, "Schemes (/schemes)")

        # Switch to Hindi
        page.evaluate("() => { localStorage.setItem('lang', 'hi'); }")
        page.goto(f"{BASE_URL}/")
        page.wait_for_timeout(800)
        check_devanagari(page, "Dashboard (/)", "hi")

        page.goto(f"{BASE_URL}/schemes")
        page.wait_for_timeout(800)
        check_devanagari(page, "Schemes (/schemes)", "hi")

        browser.close()

if __name__ == "__main__":
    run()
