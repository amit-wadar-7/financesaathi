"""Refactors inline background styles and dark mode rules across frontend components."""
import re
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 1. Update Reports.jsx
reports_path = os.path.join(base_dir, 'src', 'pages', 'Reports.jsx')
with open(reports_path, 'r', encoding='utf-8') as f:
    reports_content = f.read()

# Replace hardcoded #ffffff and #f8fafc backgrounds in Reports.jsx
reports_content = re.sub(r"background:\s*'#ffffff'", "background: 'var(--card-bg)'", reports_content)
reports_content = re.sub(r'background:\s*"#ffffff"', "background: 'var(--card-bg)'", reports_content)
reports_content = re.sub(r"background:\s*'#f8fafc'", "background: 'var(--card-bg-subtle)'", reports_content)
reports_content = re.sub(r'background:\s*"#f8fafc"', "background: 'var(--card-bg-subtle)'", reports_content)
reports_content = re.sub(
    r"selectedCategory === c\.id \? 'var\(--slate-900\)' : 'var\(--slate-100\)'",
    "selectedCategory === c.id ? 'var(--tab-active-bg)' : 'var(--card-bg-subtle)'",
    reports_content
)
reports_content = re.sub(
    r"selectedCategory === c\.id \? '#ffffff' : 'var\(--slate-700\)'",
    "selectedCategory === c.id ? 'var(--tab-active-text)' : 'var(--slate-700)'",
    reports_content
)
# Category filter button background in modal
reports_content = re.sub(
    r"background:\s*'var\(--slate-900\)',\s*color:\s*'#ffffff'",
    "background: 'var(--tab-active-bg)', color: 'var(--tab-active-text)'",
    reports_content
)

with open(reports_path, 'w', encoding='utf-8') as f:
    f.write(reports_content)
print("Updated Reports.jsx")

# 2. Update Loans.jsx
loans_path = os.path.join(base_dir, 'src', 'pages', 'Loans.jsx')
with open(loans_path, 'r', encoding='utf-8') as f:
    loans_content = f.read()

loans_content = loans_content.replace(
    "style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' }}",
    'className="card calc-summary-card"'
)
loans_content = loans_content.replace(
    "style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', margin: '1rem 0' }}",
    "style={{ background: 'var(--card-bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', margin: '1rem 0' }}"
)
loans_content = loans_content.replace("borderBottom: '1px solid #f1f5f9'", "borderBottom: '1px solid var(--border-color)'")
loans_content = loans_content.replace("background: isAttached ? 'var(--emerald-50, #ecfdf5)' : '#ffffff'", "background: isAttached ? 'var(--emerald-50)' : 'var(--card-bg)'")
loans_content = loans_content.replace("background: '#f8fafc'", "background: 'var(--card-bg-subtle)'")
loans_content = loans_content.replace("✓ DIGITALLY SEALED & SANCTIONED", "✓ Institutional Sanction Confirmed")

with open(loans_path, 'w', encoding='utf-8') as f:
    f.write(loans_content)
print("Updated Loans.jsx")

# 3. Update Dashboard.jsx
dash_path = os.path.join(base_dir, 'src', 'pages', 'Dashboard.jsx')
with open(dash_path, 'r', encoding='utf-8') as f:
    dash_content = f.read()

# Replace hardcoded Savings Rate: 48.3%
dash_content = dash_content.replace(
    '<span style={{ color: \'#059669\', fontWeight: 600 }}>Savings Rate: 48.3%</span>',
    '''{incomeNum > 0 ? (
              <span style={{ color: 'var(--emerald-600)', fontWeight: 600 }}>
                Savings Rate: {Math.max(0, Math.round(((incomeNum - expensesNum) / incomeNum) * 100))}%
              </span>
            ) : (
              <span className="muted" style={{ fontWeight: 500 }}>
                Savings Rate: —
              </span>
            )}'''
)

# Ledger Reconciled only when check passes
dash_content = dash_content.replace(
    ": 'Ledger Reconciled'",
    ": (transactions && transactions.length > 0 ? 'Ledger Reconciled' : 'No transactions yet')"
)

# Replace Immutable
dash_content = dash_content.replace('Immutable Statutory Audit Log', 'Statutory Audit Log')

with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(dash_content)
print("Updated Dashboard.jsx")

# 4. Update Account.jsx
acc_path = os.path.join(base_dir, 'src', 'pages', 'Account.jsx')
with open(acc_path, 'r', encoding='utf-8') as f:
    acc_content = f.read()

acc_content = acc_content.replace('Immutable ledger items', 'Cryptographic audit log')
acc_content = acc_content.replace('Statutory Immutable Audit Trail', 'Statutory Audit Trail')

with open(acc_path, 'w', encoding='utf-8') as f:
    f.write(acc_content)
print("Updated Account.jsx")

# 5. Update ui.jsx
ui_path = os.path.join(base_dir, 'src', 'ui.jsx')
with open(ui_path, 'r', encoding='utf-8') as f:
    ui_content = f.read()

# Rename CIBIL to Saathi Financial Health Score
ui_content = ui_content.replace('CIBIL Bureau Speedometer Dial', 'Saathi Financial Health Score Dial')
ui_content = ui_content.replace('export function CibilSpeedometer', 'export function FinancialHealthScoreDial')
ui_content = ui_content.replace('id="cibilArcGrad"', 'id="healthScoreArcGrad"')
ui_content = ui_content.replace('stroke="url(#cibilArcGrad)"', 'stroke="url(#healthScoreArcGrad)"')
# Export CibilSpeedometer alias for backward compatibility
if 'export const CibilSpeedometer = FinancialHealthScoreDial' not in ui_content:
    ui_content += '\nexport const CibilSpeedometer = FinancialHealthScoreDial;\n'

with open(ui_path, 'w', encoding='utf-8') as f:
    f.write(ui_content)
print("Updated ui.jsx")
