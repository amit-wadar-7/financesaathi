# Master Project Audit & System Diagnosis: FinanceSaathi / SYRA

**Audit Timestamp:** 2026-10-13T06:25:00+05:30  
**Auditor:** Senior Full-Stack Software Engineer & Financial Systems Specialist  
**Application:** FinanceSaathi / SYRA (Rural Microfinance, SHG, Financial Literacy & Multilingual Platform)  
**Database Evaluated:** `backend/syra.db` (Verified backup created at `backend/backups/syra_backup_verified.db`, 139,264 bytes)

---

## 1. Executive Summary

This comprehensive audit was conducted across the entire codebase—including backend APIs, SQLite database files, SQLAlchemy models, Pydantic schemas, financial calculation engines, machine-learning affordability models, frontend React components, routing, authentication flows, and automated test suites.

The project possesses a robust foundation with a clear financial domain purpose (rural credit, Self-Help Groups, financial literacy, multilingual assistance). However, several critical vulnerabilities, data integrity discrepancies, fabricated report fallbacks, and unlabelled simulated payment operations were uncovered that must be resolved to elevate the platform to institutional banking standards.

---

## 2. Active Technology Stack & Environment

| Component | Technology | Version / Configuration |
| :--- | :--- | :--- |
| **Frontend Framework** | React | 18.3.1 (JSX, Hooks) |
| **Frontend Build Tool** | Vite | 5.4.21 |
| **Routing** | React Router DOM | 6.28.0 |
| **Design System** | Custom CSS Variables | Deep emerald rural fintech theme (`#064e3b`, `#047857`, `#10b981`) |
| **Backend Framework** | FastAPI | 0.115.5 |
| **ORM & Database** | SQLAlchemy & SQLite | SQLite 3 (`syra.db`, 14 tables verified) |
| **Schema Validation** | Pydantic | 2.10.2 |
| **Authentication** | JWT (`PyJWT` 2.10.1) & `bcrypt` (4.2.1) | Access token with role-based claims |
| **ML Engine** | `scikit-learn` (1.5.2) & `numpy` (2.1.3) | LogisticRegression affordability model & feature attribution |
| **Testing** | `pytest` (9.1.1) | 10 passing tests in `backend/tests/test_api.py` |

---

## 3. Database State & Preservation Verification

### Database Inventory
- **Active Database File:** `d:\syra\backend\syra.db` (139,264 bytes)
- **Legacy Zero-Byte File:** `d:\syra\backend\financesaathi.db` (0 bytes)
- **Verified Backup Location:** `d:\syra\backend\backups\syra_backup_verified.db` (139,264 bytes)
- **Verification Script:** `backend/scripts/backup_db.py`

### Verified Record Counts
| Table Name | Record Count | Description |
| :--- | :--- | :--- |
| `users` | 9 | Core accounts across Borrower, SHG Leader, Officer, and Admin roles |
| `shgs` | 1 | Self-Help Groups (e.g. Pragati Mahila Bachat Gat) |
| `loans` | 5 | Microcredit facilities with various product and schedule types |
| `installments` | 36 | Amortization installments with gestation and harvest flags |
| `loan_documents` | 5 | KYC & land record verification entries |
| `savings_goals` | 3 | Livelihood and emergency savings targets |
| `savings_entries` | 0 | Sub-entries for goal deposits |
| `transactions` | 14 | Passbook double-entry journal items |
| `courses` | 9 | Financial literacy academy courses (EN, HI, MR) |
| `quiz_questions` | 18 | Interactive multiple-choice questions |
| `course_progress` | 0 | User completion and quiz scoring |
| `schemes` | 9 | Government subsidies and welfare schemes (EN, HI, MR) |
| `notifications` | 1 | Real-time system and reminder alerts |
| `audit_logs` | 6 | Statutory immutable administrative logs |

*Non-Negotiable Rule:* No records will be deleted or purged during refactoring or schema migrations.

---

## 4. Comprehensive Audit Findings by Priority

```
CRITICAL (4 Findings) ────> HIGH (5 Findings) ────> MEDIUM (4 Findings) ────> LOW (3 Findings)
```

---

### Priority: CRITICAL

#### Finding C-01: Insecure Default Secret Key & Production Hardening Missing
- **File & Location:** `backend/app/config.py` (Lines 4)
- **Exact Problem:** `SECRET_KEY` falls back to hardcoded default `"dev-secret-change-me-at-least-32-chars-long"`. No startup check validates that in production environments (`ENVIRONMENT == "production"`), the key is non-default and has high cryptographic entropy (>= 32 characters).
- **Root Cause:** Permissive development configuration carried over to general execution.
- **User-Visible Impact:** None directly in development, but leaves production deployments open to session hijacking and token forgery.
- **Security Impact:** Critical JWT signing vulnerability.
- **Proposed Correction:** Enhance `config.py` to inspect `ENVIRONMENT`. If set to `production` and `SECRET_KEY` matches default or has length < 32, fail application startup immediately with an informative exception.
- **Verification Test:** Unit test in `test_api.py` verifying startup validation for insecure production configurations.

#### Finding C-02: Password UTF-8 Byte Length Truncation Boundary
- **File & Location:** `backend/app/security.py` (Line 10, 15) & `backend/app/schemas.py` (Line 16)
- **Exact Problem:** `security.py` uses `pw.encode()[:72]`. While bcrypt has a 72-byte limit, truncating silently without schema validation means that multi-byte characters (common in Indian names, passwords, or Devanagari text) can be clipped without user knowledge.
- **Root Cause:** Hard slicing `[:72]` without prior validation error.
- **User-Visible Impact:** Users registering with long passwords or Devanagari characters might have passwords trimmed, creating confusion when attempting to log in.
- **Security Impact:** Cryptographic truncation discrepancy.
- **Proposed Correction:** Add a field validator to `RegisterIn` in `schemas.py` checking `6 <= len(password.encode('utf-8')) <= 72`. Reject passwords exceeding 72 bytes with HTTP 422 explaining the exact byte boundary.
- **Verification Test:** Pytest test submitting a 75-byte password expecting HTTP 422.

#### Finding C-03: Contradictory Financial Ledger Invariants Across Deposit Endpoints
- **File & Location:** `backend/app/routers/community.py` (Lines 91-108) vs `backend/app/routers/staff.py` (Lines 98-135)
- **Exact Problem:** 
  - `POST /savings/goals/{id}/deposit` increases `goal.saved_amount` and adds a credit transaction, but does NOT debit `user.savings_balance`.
  - `POST /money/transfer` debits `user.savings_balance` and credits `goal.saved_amount`.
  - This ambiguity allows goals to be funded from external sources without explicit labeling, creating balance mismatches if users assume goal savings draw from their general savings pool.
- **Root Cause:** Two different endpoints implementing different mental models without unambiguous transaction typing.
- **Financial Impact:** Unbalanced personal balance sheet and confusing passbook entries.
- **Proposed Correction:** Harmonize the models:
  - Clarify `/savings/goals/{id}/deposit` as an external cash/UPI deposit (funded externally, creating an external credit transaction and updating goal saved amount).
  - Clarify `/money/transfer` as an internal balance transfer (moving funds from `user.savings_balance` to goal).
  - Explicitly document and display the source of funds in the passbook transaction title.
- **Verification Test:** Pytest verifying both external deposit and internal transfer behaviors with exact assertion on `user.savings_balance` and goal amount.

#### Finding C-04: Undisclosed Simulated Payment and KYC Operations
- **File & Location:** `frontend/src/pages/Loans.jsx` (Lines 1435-1442) & `frontend/src/pages/Dashboard.jsx` (Lines 1756-1760)
- **Exact Problem:** 
  - The payment modal says "Confirm UPI Payment" and shows "Verifying UPI PSP...", simulating a live payment gateway transaction without disclosing that no banking gateway is connected.
  - Loan KYC checklist items are marked "Verified" without clarifying whether verification was performed via human credit officer inspection or a prototype simulation.
- **Root Cause:** Placeholder UI simulating a production payment flow without ethical fintech disclaimers.
- **User-Visible Impact:** Users or bank auditors could believe real funds are being transferred or real UIDAI Aadhaar e-KYC is active.
- **Compliance Impact:** Violation of RBI / regulatory consumer disclosure guidelines.
- **Proposed Correction:** 
  - Add prominent "Simulated Demo Mode • No Real Money Debited" badges to all payment modals.
  - Add clear "Prototype Simulation" labels to automated KYC checks, distinguishing them from human officer approvals.
- **Verification Test:** Frontend rendering check confirming demo disclosure text.

---

### Priority: HIGH

#### Finding H-01: Fabricated Report Data and Fallback Placeholders in `reports.py`
- **File & Location:** `backend/app/routers/reports.py` (Lines 250-275, 355-358, 434-445, 455-465)
- **Exact Problem:** 
  - `collection-efficiency` falls back to hardcoded numbers `450000.0`, `435600.0`, `14400.0`, and fake channel percentages `[UPI 78.4%, NACH 16.2%...]`.
  - `tax-certificate` sets `principal_paid = 18450.0` and `interest_paid = 2850.0` if borrower has no paid installments.
  - `credit-health` presents simulated scores as authoritative bureau metrics without clear educational labeling.
  - `shg-audit` outputs static member numbers ("12 members", "₹3,50,000") instead of querying `models.SHG` and associated member rows.
- **Root Cause:** Mock demonstration figures inserted to populate charts when database rows were scarce.
- **User-Visible Impact:** Misleading financial reporting where figures do not match actual ledger transactions.
- **Financial Impact:** Erroneous tax certificates and inaccurate statutory reports.
- **Proposed Correction:** 
  - Calculate all aggregations directly from database rows (`models.Installment`, `models.Loan`, `models.User`, `models.Transaction`).
  - Where actual records are zero, report 0.0 with helpful guidance, OR if an educational preview is shown, prominently tag the section as `is_educational_preview: True` with visible banner "Educational Simulation Preview — No Active Repayments in Fiscal Period".
- **Verification Test:** Pytest test for user with zero loans verifying that tax certificate does not display fabricated 18,450.

#### Finding H-02: Missing Case Normalization on User Lookups in `community.py`
- **File & Location:** `backend/app/routers/community.py` (Line 37)
- **Exact Problem:** `models.User.email == body.email.lower()` was applied, but `body.email` in `MemberIn` was not normalized on input, and other email lookups must ensure consistent case-insensitivity across SQLite collations.
- **Root Cause:** Inconsistent lowercase normalization across router handlers.
- **Proposed Correction:** Ensure Pydantic `MemberIn` and all routers enforce `email.lower().strip()`.
- **Verification Test:** Test adding SHG member with mixed-case email (`User.Name@Domain.COM`).

#### Finding H-03: Lack of Rate Limiting or Brute-Force Safeguards on Auth Endpoints
- **File & Location:** `backend/app/routers/auth.py` (Lines 28-34)
- **Exact Problem:** `/auth/login` allows unlimited consecutive attempts without delaying or locking out suspicious clients.
- **Root Cause:** No rate limiter or lockout middleware configured.
- **Security Impact:** Potential credential stuffing or automated password guessing.
- **Proposed Correction:** Implement an in-memory client-IP and email cooldown counter for repeated failed login attempts, responding with HTTP 429 Too Many Requests after threshold.
- **Verification Test:** Pytest attempting 5 consecutive failed logins verifying rate-limiting response.

#### Finding H-04: Borrower Isolation on Report Endpoints
- **File & Location:** `backend/app/routers/reports.py` (Lines 104-118)
- **Exact Problem:** Standard borrowers should only ever view their own account statements, tax certificates, and credit health diagnostics. While officers/admins can pass `user_id`, a regular user must never be permitted to inspect another user's financial record.
- **Root Cause:** Permissive default query parameter handling.
- **Proposed Correction:** Explicitly enforce `if user.role not in ('officer', 'admin'): target_user = user`.
- **Verification Test:** Pytest verifying user attempting to access report with `?user_id=another_id` receives only their own data.

#### Finding H-05: Missing Decimal Rounding Consistency in Amortization Drift
- **File & Location:** `backend/app/finance.py` (Lines 35-58)
- **Exact Problem:** Floating-point subtraction can lead to minor fractional cents/paise errors (e.g. `12000.000000000002`). While `round(..., 2)` is used, bullet payments and last-installment clearing must guarantee that sum of `principal_part` strictly equals loan `amount` down to zero paise.
- **Root Cause:** Standard IEEE 754 floating point arithmetic.
- **Financial Impact:** Sub-penny reconciliation errors in audit reports.
- **Proposed Correction:** Enforce exact penny adjustment on final installment row in both `amortization` and `kisan_harvest_amortization`.
- **Verification Test:** Pytest verifying `sum(row['principal_part']) == principal` across prime-numbered tenures (e.g. 7 months, 11 months).

---

### Priority: MEDIUM

#### Finding M-01: Incomplete Multilingual Translation Coverage
- **File & Location:** `frontend/src/i18n.jsx`
- **Exact Problem:** Currently only defines ~25 navigation keys. Financial terms like "Reducing Balance", "Gestation Period", "Harvest Bullet", "Subvention", and "Foreclosure" appear in raw English across Hindi and Marathi views.
- **User-Visible Impact:** Diminished accessibility for rural non-English speaking borrowers.
- **Proposed Correction:** Expand `i18n.jsx` to encompass all operational and financial terminology in Marathi (`mr`), Hindi (`hi`), and English (`en`).
- **Verification Test:** Frontend build test ensuring all new keys resolve.

#### Finding M-02: Missing Responsive Wrap on Large Financial Tables
- **File & Location:** `frontend/src/styles.css` & `frontend/src/pages/Loans.jsx`
- **Exact Problem:** The 12-to-36 row amortization table and PAR delinquency grid can clip on mobile devices with viewport widths < 480px.
- **User-Visible Impact:** Mobile users must scroll horizontally without a fixed context column.
- **Proposed Correction:** Add `.table-responsive` container with horizontal touch scroll indicators and mobile-card alternative views.
- **Verification Test:** CSS inspection and responsive build verification.

#### Finding M-03: Unclear AI Model Disclaimer Visibility on Application Screen
- **File & Location:** `frontend/src/pages/Loans.jsx` (LoanApply component)
- **Exact Problem:** The AI score band ("Ready", "Caution", "Not Ready") is calculated instantaneously, but the statutory disclaimer ("Decision support only; final sanction by authorized credit officer") is rendered in low-contrast text.
- **Proposed Correction:** Elevate the transparency banner with high-contrast alert box emphasizing that AI never makes automated rejection or sanction decisions.
- **Verification Test:** UI visual audit.

#### Finding M-04: Redundant Empty Database File in Repository
- **File & Location:** `backend/financesaathi.db` (0 bytes)
- **Exact Problem:** Causes confusion regarding which database is active (`syra.db` vs `financesaathi.db`).
- **Proposed Correction:** Keep `financesaathi.db` archived/documented in `docs/DATABASE.md` while clarifying `syra.db` as the active operational database configured in `config.py`.

---

### Priority: LOW

#### Finding L-01: Print Layout CSS for Sanction Letters and Account Statements
- **File & Location:** `frontend/src/styles.css`
- **Exact Problem:** Clicking "Print Sanction Letter" or "Print Statement" prints navigation headers and sidebar controls on paper/PDF.
- **Proposed Correction:** Add `@media print` rules hiding sidebar, top header, buttons, and floating widgets, isolating the printable document canvas.

#### Finding L-02: Missing Quick-Filter for Transaction Categories in Passbook
- **File & Location:** `frontend/src/pages/Transactions.jsx`
- **Exact Problem:** Passbook displays all transactions in chronological order without quick category filtering tabs (e.g. "EMI Payments", "Income", "Transfers", "SHG").
- **Proposed Correction:** Add pill filters on the Passbook page.

#### Finding L-03: Minor Logging of Request URLs in Dev Mode
- **File & Location:** `backend/app/main.py`
- **Proposed Correction:** Clean up exception handlers to ensure no internal stack trace details are exposed in HTTP 500 error responses.

---

## 5. Implementation Roadmap & Verification Plan

1. **Step 1: Security & Auth Hardening (C-01, C-02, H-03)**
   - Update `config.py`, `security.py`, `schemas.py`, and `auth.py`.
2. **Step 2: Financial Integrity & Ledger Reconciliation (C-03, H-05)**
   - Update `finance.py`, `loans.py`, `community.py`, and `staff.py`.
3. **Step 3: Honest Reporting & Educational Disclaimer Engine (H-01, H-04)**
   - Refactor `reports.py` to use authoritative database calculations and explicit educational simulation badges.
4. **Step 4: Honest Payment & KYC Simulation UI (C-04, M-03)**
   - Update `Loans.jsx`, `Dashboard.jsx`, and `ui.jsx`.
5. **Step 5: Full Multilingual Expansion & Responsive Mobile Polish (M-01, M-02, L-01, L-02)**
   - Update `i18n.jsx`, `styles.css`, and `Transactions.jsx`.
6. **Step 6: Comprehensive Pytest Expansion & Verification**
   - Expand `backend/tests/test_api.py` to cover all new edge cases, security checks, and ledger invariants.
7. **Step 7: Production Vite Build & E2E Validation**
   - Execute `npm run build` and verify clean bundling.
8. **Step 8: Final Documentation Package**
   - Create `IMPLEMENTATION_REPORT.md`, `TESTING_REPORT.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/FEATURE_STATUS.md`, and update `README.md`.
