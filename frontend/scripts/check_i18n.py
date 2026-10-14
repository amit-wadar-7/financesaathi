"""Checks completeness of translation keys across en.json, hi.json, mr.json and JSX calls, and audits JSX text literals."""
import json
import os
import re
import sys

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
locales_dir = os.path.join(base_dir, 'src', 'locales')

with open(os.path.join(locales_dir, 'en.json'), 'r', encoding='utf-8') as f:
    en_keys = json.load(f)

with open(os.path.join(locales_dir, 'hi.json'), 'r', encoding='utf-8') as f:
    hi_keys = json.load(f)

with open(os.path.join(locales_dir, 'mr.json'), 'r', encoding='utf-8') as f:
    mr_keys = json.load(f)

errors = []

# 1. Check completeness across languages
for k in en_keys:
    if k not in hi_keys:
        errors.append(f"Key '{k}' missing from hi.json")
    if k not in mr_keys:
        errors.append(f"Key '{k}' missing from mr.json")

for k in hi_keys:
    if k not in en_keys:
        errors.append(f"Key '{k}' in hi.json but not in en.json")

for k in mr_keys:
    if k not in en_keys:
        errors.append(f"Key '{k}' in mr.json but not in en.json")

# 2. Check for empty translation values
for k, v in en_keys.items():
    if not str(v).strip():
        errors.append(f"Empty value for '{k}' in en.json")
for k, v in hi_keys.items():
    if not str(v).strip():
        errors.append(f"Empty value for '{k}' in hi.json")
for k, v in mr_keys.items():
    if not str(v).strip():
        errors.append(f"Empty value for '{k}' in mr.json")

# 3. Check JSX usages
all_keys = set(en_keys.keys())
src_dir = os.path.join(base_dir, 'src')
jsx_files = []
for root, _, files in os.walk(src_dir):
    for f in files:
        if f.endswith('.jsx') or f.endswith('.js'):
            jsx_files.append(os.path.join(root, f))

t_call_pattern = re.compile(r'\bt\(\s*[\'"]([a-zA-Z0-9_\-]+)[\'"]')

missing_in_locales = set()
for jf in jsx_files:
    with open(jf, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    for match in t_call_pattern.finditer(content):
        called_key = match.group(1)
        # Check against en_keys and legacy dictionary keys in i18n.jsx
        if called_key not in all_keys and not any(k.lower() == called_key.lower() for k in all_keys):
            legacy_keys = {
                'dashboard', 'loans', 'calculators', 'learn', 'schemes', 'savings', 'profile',
                'shg', 'atRisk', 'admin', 'notifications', 'logout', 'login', 'register',
                'email', 'password', 'name', 'phone', 'language', 'newLoan', 'amount', 'rate',
                'months', 'purpose', 'apply', 'status', 'emi', 'outstanding', 'nextInstallment',
                'totalSaved', 'coursesDone', 'activeLoans', 'pendingLoans', 'healthScore', 'save',
                'income', 'expenses', 'existingEmi', 'savingsBalance', 'welcome', 'pay', 'approve',
                'reject', 'submit', 'start', 'back', 'ready', 'caution', 'not_ready', 'fillProfile',
                'noAccount', 'haveAccount', 'saathiAi', 'quickActions', 'depositShg', 'payEmi',
                'askSaathi', 'emergencyCalc', 'totalSavingsAssets', 'monthlySpend', 'targetGoal',
                'viewLedger', 'payUpi', 'allGoals', 'startLesson', 'kisanAgri', 'pmMudra',
                'mahilaShakti', 'pmSvanidhi', 'emergencyHealth', 'solarGreen', 'reducingBalance',
                'gestation', 'harvestBullet', 'subvention', 'foreclosure', 'tenure', 'principal',
                'interest', 'simulatedDemoMode', 'noRealMoney', 'soa', 'taxCert', 'creditHealth',
                'shgAudit', 'rbiAudit', 'grievances', 'lodgeGrievance', 'ombudsman'
            }
            if called_key not in legacy_keys:
                missing_in_locales.add(f"{os.path.basename(jf)}: t('{called_key}') not found in locales")

if missing_in_locales:
    for m in missing_in_locales:
        errors.append(m)

# 4. Check for unlocalized JSX text literals in src/pages
pages_dir = os.path.join(base_dir, 'src', 'pages')
jsx_literal_pattern = re.compile(r'>\s*([A-Za-z]{4,}(?:\s+[A-Za-z]+)*)\s*<')
ignored_terms = {
    'FinanceSaathi', 'Hindi', 'Marathi', 'English', 'ADMIN', 'USER', 'OFFICER', 'SHG_LEADER',
    'JSON', 'HTML', 'True', 'False', 'POST', 'GET', 'PATCH', 'DELETE', 'NRLM', 'NABARD', 'RBI',
    'INR', 'DPDP', 'DPDP-2023', 'HTTPS', 'HTTP', 'UUID', 'VITE', 'Legal', 'Panchasutra'
}

for root, _, files in os.walk(pages_dir):
    for f in files:
        if not f.endswith('.jsx') or f in ('Legal.jsx',):
            continue
        filepath = os.path.join(root, f)
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as jf:
            lines = jf.readlines()
        for lno, line in enumerate(lines, 1):
            sline = line.strip()
            if sline.startswith('//') or sline.startswith('{/*'):
                continue
            for match in jsx_literal_pattern.finditer(sline):
                txt = match.group(1).strip()
                if txt not in ignored_terms and not any(k.lower() == txt.lower() for k in ignored_terms):
                    # Flag unlocalized text literals
                    errors.append(f"{f}:{lno}: Unlocalized JSX text literal '{txt}'")

print(f"Total verified locale keys: {len(en_keys)}")
if errors:
    print(f"FAILED: Found {len(errors)} i18n issue(s):")
    for err in errors[:25]:
        print("  -", err)
    sys.exit(1)
else:
    print("SUCCESS: All i18n translation keys and JSX literals are complete and validated across EN, HI, MR!")
    sys.exit(0)
