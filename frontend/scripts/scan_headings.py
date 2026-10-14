import json
import math
import re
import sys
import urllib.request
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

req = urllib.request.Request(
    'http://127.0.0.1:8000/auth/login',
    data=json.dumps({'email': 'borrower@financesaathi.in', 'password': 'Borrower#2025!'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req) as r:
    tok = json.loads(r.read())['access_token']

def parse_rgb(rgb_str):
    m = re.match(r'rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)', rgb_str)
    if not m:
        return (0, 0, 0, 1.0)
    return int(m.group(1)), int(m.group(2)), int(m.group(3)), float(m.group(4)) if m.group(4) is not None else 1.0

def lum(r, g, b):
    def ch(c):
        c /= 255.0
        return c / 12.92 if c <= 0.03928 else math.pow((c + 0.055) / 1.055, 2.4)
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)

def contrast(c1, c2):
    l1, l2 = lum(*c1[:3]), lum(*c2[:3])
    return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)

routes = ['/', '/transactions', '/loans', '/schemes', '/reports', '/learn', '/tools', '/community', '/savings', '/grievances', '/profile']

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe', headless=True)
    page = b.new_page()
    page.goto('http://127.0.0.1:5173/')
    page.evaluate(f"""() => {{
        localStorage.setItem('token', '{tok}');
        localStorage.setItem('theme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
    }}""")

    for route in routes:
        page.goto(f'http://127.0.0.1:5173{route}')
        page.wait_for_timeout(800)
        items = page.evaluate("""() => {
            function getBg(el) {
                let curr = el;
                while (curr && curr !== document) {
                    const bg = window.getComputedStyle(curr).backgroundColor;
                    const m = bg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
                    if (m && (m[4] === undefined || parseFloat(m[4]) > 0.05)) return bg;
                    curr = curr.parentElement;
                }
                return 'rgb(11, 17, 32)';
            }
            const res = [];
            const els = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, .page-header-row h2, .page-subtitle, .subtitle, p.subtitle, .section-title, .title'));
            for (const el of els) {
                const r = el.getBoundingClientRect();
                if (r.width > 0 && r.height > 0 && window.getComputedStyle(el).visibility !== 'hidden') {
                    const cs = window.getComputedStyle(el);
                    res.push({
                        tag: el.tagName.toLowerCase(),
                        text: el.innerText.trim().slice(0, 50).replace(/\\n/g, ' '),
                        color: cs.color,
                        bg: getBg(el),
                        cls: el.className
                    });
                }
            }
            return res;
        }""")
        for item in items:
            fg = parse_rgb(item['color'])
            bg = parse_rgb(item['bg'])
            cr = contrast(fg, bg)
            if cr < 4.5:
                print(f"LOW CONTRAST ({cr:.2f}:1) on {route}: <{item['tag']}> \"{item['text']}\" color={item['color']} bg={item['bg']} class=\"{item['cls']}\"")
    b.close()
