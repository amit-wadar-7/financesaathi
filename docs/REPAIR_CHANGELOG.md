# Master Repair & Refactoring Changelog: SYRA / FinanceSaathi

**Document Version:** 1.0.0  
**Audit & Repair Completion:** 2026-10-13  
**Status:** All P0, P1, P2, and P3 defects resolved and verified.

---

## Executive Summary

This changelog records the complete set of structural, architectural, security, accounting, domain-specific, and UI/UX changes implemented to transform **SYRA / FinanceSaathi** into an enterprise-grade, reliable, and secure financial platform.

All changes were executed under strict non-negotiable data-preservation protocols:
1. Zero database resets, truncations, or deletions.
2. Verified binary backup maintained at `backend/backups/syra_backup_verified.db` (139,264 bytes, 14 verified tables).
3. 100% test pass rate across the full test suite (`18 passed in 13.17s`).
4. Zero-error frontend production build (`vite build` in 995ms).

---

## 1. P0 Critical Security & Accounting Repairs

### 1.1 SEC-01: Mass-Assignment Vulnerability on User Savings Balance
- **Affected File:** `backend/app/schemas.py`
- **Root Cause:** `ProfileIn` included `savings_balance: float | None = Field(default=None, ge=0)`. The endpoint `PATCH /auth/me` applied all fields from `ProfileIn` directly to `models.User` via `setattr(user, k, v)`. This allowed any authenticated user to arbitrarily forge their savings account balance to any amount (e.g., `999999.0`) by including the field in their profile update payload.
- **Remediation:** Removed `savings_balance` from `ProfileIn`. Only permissible demographic and profile parameters (`name`, `phone`, `language`, `monthly_income`, `monthly_expenses`, `existing_emi`) are accepted. Account balances can now ONLY be altered through ledger-backed endpoints (`/money/income`, `/money/expense`, `/money/transfer`, `/savings/goals/{id}/deposit`).
- **Verification:** Unit test `test_savings_balance_mass_assignment_prevented` sends `PATCH /auth/me` with `{"savings_balance": 999999.0}` and asserts that the persisted balance is unmodified.

### 1.2 FIN-01: Expense Overdraft Balance Clamping Defect
- **Affected File:** `backend/app/routers/staff.py`
- **Root Cause:** In `POST /money/expense`, the backend performed `user.savings_balance = max(0.0, user.savings_balance - body.amount)`. When a user requested an expense exceeding their available balance (e.g. balance Rs 1,000, expense Rs 5,000), the system recorded a full transaction of Rs 5,000 while clamping the user's balance to 0.0. This created phantom fiat money and decoupled the ledger from reality.
- **Remediation:** Implemented an explicit guard that validates sufficient funds before mutating state:
  ```python
  if user.savings_balance < body.amount:
      raise HTTPException(
          400,
          f"Insufficient funds: Available balance Rs {user.savings_balance:,.2f} is less than requested expense Rs {body.amount:,.2f}"
      )
  user.savings_balance = round(user.savings_balance - body.amount, 2)
  ```
- **Verification:** Unit test `test_expense_overdraft_prevention` verifies that overdraft attempts return HTTP 400 with descriptive error detail, and exact-balance expenses reduce the account precisely to 0.0 without errors.

---

## 2. P1 High-Priority Domain & Architectural Repairs

### 2.1 FIN-03: Strict Whitelisting for Loan Products & Repayment Schedules
- **Affected File:** `backend/app/schemas.py`
- **Root Cause:** `LoanIn` accepted arbitrary string inputs for `product_type` and `schedule_type`, allowing invalid schedule types or unsupported schemes to be stored in the database.
- **Remediation:** Defined strict typing using `typing.Literal`:
  ```python
  ProductType = Literal[
      "standard", "kisan_agri", "pm_mudra", "mahila_shakti",
      "pm_svanidhi", "emergency_health", "solar_green", "artisan_micro"
  ]
  ScheduleType = Literal["monthly", "harvest_bullet"]
  ```
- **Verification:** Unit test `test_loan_schedule_type_and_product_whitelist` asserts that invalid strings yield HTTP 422 Unprocessable Entity, while valid types succeed with HTTP 201.

### 2.2 AUTH-01: Login Sliding-Window Rate Limiting & Bcrypt Limit Enforcement
- **Affected Files:** `backend/app/routers/auth.py`, `backend/app/schemas.py`, `backend/app/config.py`
- **Remediation:**
  1. Enforced maximum password byte length of 72 bytes in `RegisterIn` to eliminate bcrypt truncation silent vulnerabilities.
  2. Implemented in-memory sliding-window rate limiter in `login`: 5 consecutive failed attempts lock the account for 15 minutes, returning HTTP 429.
  3. Added minimum secret key length validation (>=32 characters) in production configuration.
- **Verification:** `test_password_byte_boundaries_and_rate_limiting` verifies HTTP 422 on invalid byte lengths and HTTP 429 on brute-force attempts.

---

## 3. P2 Medium-Priority State Machine & Data Integrity Repairs

### 3.1 DOC-01: Loan Document Verification State Guard
- **Affected File:** `backend/app/routers/loans.py`
- **Root Cause:** `POST /loans/{loan_id}/documents/{doc_id}/verify` allowed officers to verify documents even after a loan had been rejected, cancelled, or closed.
- **Remediation:** Added loan status validation requiring `loan.status in ("pending", "approved")`. Attempts on closed or rejected loans trigger HTTP 409 Conflict: `"Cannot verify documents on a {loan.status} loan"`.
- **Verification:** `test_document_verification_status_guard` confirms verification succeeds on pending loans but raises HTTP 409 when the loan is rejected.

### 3.2 SHG-01: Single-SHG Membership Invariant
- **Affected File:** `backend/app/routers/community.py`
- **Root Cause:** A user could be concurrently added to multiple Self-Help Groups, overwriting foreign key relationships and creating inconsistent group loan accounting.
- **Remediation:** Added validation in `add_member`:
  ```python
  if member.shg_id and member.shg_id != shg.id:
      raise HTTPException(409, f"User '{member.name}' is already enrolled in another SHG (#{member.shg_id})")
  ```
- **Verification:** `test_shg_single_membership_invariant` verifies that adding an enrolled member to a second SHG returns HTTP 409 without altering their primary membership.

### 3.3 REP-01: Authoritative Institutional Reports & Borrower Isolation
- **Affected File:** `backend/app/routers/reports.py`
- **Root Cause:** Reports contained hardcoded placeholder fallback numbers (e.g. fabricated tax certificate values of Rs 18,450) and allowed cross-borrower data inspection via `?user_id=`.
- **Remediation:**
  1. Replaced all fabricated metrics with live SQLite database aggregations.
  2. Implemented strict role-based borrower isolation: non-staff borrowers can only access their own records, ignoring any spoofed `user_id` query parameters.
  3. Added explicit educational disclaimers to credit health diagnostics and simulated bureau reports.
- **Verification:** `test_authoritative_reports_and_borrower_isolation` confirms that unborrowed users receive exact zero values and borrower isolation is strictly enforced.

---

## 4. P3 UI/UX Polish, Accessibility, & Frontend Invariants

### 4.1 UI-01: Transparent Simulated Demo Disclosures
- **Affected Files:** `frontend/src/pages/Loans.jsx`, `frontend/src/pages/Dashboard.jsx`
- **Remediation:**
  1. Added persistent amber disclosure badges: `⚡ Simulated Demo Mode: Payments are mock settlements for testing financial literacy workflows.`
  2. Updated modal action buttons from misleading "Pay ₹..." to transparent "Confirm Mock Settlement (Demo)".
  3. Labeled UPI handles with `[DEMO PSP]`.

### 4.2 UI-02: Real-Time Category Filtering in Passbook
- **Affected File:** `frontend/src/pages/Transactions.jsx`
- **Remediation:** Added multi-category filter pill buttons (`All`, `EMI Repayments`, `Savings & Deposits`, `Goal Transfers`, `Livelihood & Income`, `General`) that filter live transactions alongside the Credit/Debit filter.

### 4.3 UI-03: Responsive Tables & Print Styling
- **Affected File:** `frontend/src/styles.css`
- **Remediation:**
  1. Wrapped all tabular components in `.table-responsive` with mobile overflow scrolling and touch hints.
  2. Added `@media print` rules optimizing Sanction Letters and Account Statements for clean A4 printing (suppressed navigation headers, buttons, and backgrounds).

### 4.4 I18N: Tri-Lingual Indian Language Support
- **Affected File:** `frontend/src/i18n.jsx`
- **Remediation:** Comprehensive vocabulary translations for English (`en`), Hindi (`hi`), and Marathi (`mr`) covering all banking, microfinance, SHG, and scheme terminology.

---

## 5. Verification Proof & Regression Test Summary

| Test Case Name | Target Component | Status |
| :--- | :--- | :--- |
| `test_calculators` | EMI, Agricultural, Sahukar trap calculators | **PASSED** |
| `test_auth_and_rbac` | Auth registration, login, role permissions | **PASSED** |
| `test_full_loan_lifecycle` | Application, officer approval, repayment, closure | **PASSED** |
| `test_requires_profile_before_applying` | Profile completeness guard | **PASSED** |
| `test_affordability_and_health_score` | AI assessment and financial health scoring | **PASSED** |
| `test_courses_quiz_and_schemes` | Courses, quizzes, scheme matching | **PASSED** |
| `test_shg_group_lending_and_savings` | SHG group loans, leader view, savings goals | **PASSED** |
| `test_staff_views` | Early warning, at-risk loans, reminders | **PASSED** |
| `test_reports_catalog_and_data` | Catalog access, PAR aging, compliance | **PASSED** |
| `test_harvest_bullet_loan_lifecycle` | Kisan harvest-bullet loan schedules | **PASSED** |
| `test_password_byte_boundaries_and_rate_limiting` | Bcrypt length check, login lockout | **PASSED** |
| `test_authoritative_reports_and_borrower_isolation` | Database aggregation, privacy isolation | **PASSED** |
| `test_financial_ledger_invariants_and_deposit_audit` | Ledger audit, balance-to-goal transfers | **PASSED** |
| `test_savings_balance_mass_assignment_prevented` | Profile mass-assignment prevention (P0 SEC-01) | **PASSED** |
| `test_expense_overdraft_prevention` | Expense overdraft prevention (P0 FIN-01) | **PASSED** |
| `test_loan_schedule_type_and_product_whitelist` | Loan schedule & product whitelisting (P1 FIN-03) | **PASSED** |
| `test_shg_single_membership_invariant` | Single SHG membership invariant (P2 SHG-01) | **PASSED** |
| `test_document_verification_status_guard` | Document verification status guard (P2 DOC-01) | **PASSED** |

**Total Backend Tests:** 18 / 18 passing (100%)  
**Frontend Production Build:** `vite build` completed in 995ms with 0 errors.  
**Database Integrity:** Verified backup created at `backend/backups/syra_backup_verified.db`, 14 tables, 0 loss.
