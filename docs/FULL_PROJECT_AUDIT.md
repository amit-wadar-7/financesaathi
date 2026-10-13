# Full Project Audit & Root-Cause Analysis: SYRA / FinanceSaathi

**Audit Date:** 2026-10-13T06:50:00+05:30  
**Application:** SYRA / FinanceSaathi (Rural Microfinance & Financial Literacy Platform)  
**Lead Auditor:** Senior Full-Stack Engineer, Security Reviewer & Systems Architect  
**Active Database:** `backend/syra.db` (Verified backup at `backend/backups/syra_backup_verified.db`)

---

## 1. Audit Methodology & Scope

This audit was conducted by inspecting source code line by line across all layers:
- Backend: `backend/app/main.py`, `config.py`, `database.py`, `deps.py`, `models.py`, `schemas.py`, `security.py`, `finance.py`, `ml.py`, `seed.py`
- Routers: `auth.py`, `loans.py`, `reports.py`, `staff.py`, `community.py`, `tools.py`, `literacy.py`
- Frontend: `frontend/src/api.js`, `auth.jsx`, `i18n.jsx`, `App.jsx`, `ui.jsx`, `styles.css`, `pages/*.jsx`
- Tests: `backend/tests/test_api.py`, `e2e/e2e_browser_test.py`

Every defect was traced through the complete lifecycle:
**UI Component -> API Request -> Auth & RBAC -> Schema Validation -> Financial Business Logic -> DB Persistence -> Frontend Feedback**.

---

## 2. Issues Categorized by Severity

```
P0 — Critical (2 Issues)
P1 — High (5 Issues)
P2 — Medium (6 Issues)
P3 — Low (4 Issues)
```

---

### P0 — Critical Severity (Security Breaches, Accounting Violations, Data Loss)

#### Issue SEC-01: Mass-Assignment of `savings_balance` in Profile Update
- **Severity:** P0
- **File & Function:** `backend/app/schemas.py` (`ProfileIn`) & `backend/app/routers/auth.py` (`update_profile`)
- **Actual Problem:** `ProfileIn` includes `savings_balance: float | None = Field(default=None, ge=0)`. Any authenticated user could send `PATCH /auth/me` with `{"savings_balance": 1000000}` and arbitrarily modify their bank balance without a deposit, ledger transaction, or audit entry!
- **Reproduction Steps:**
  1. Authenticate as regular user.
  2. Send `PATCH /auth/me` with body `{"savings_balance": 500000}`.
  3. Inspect `user.savings_balance` in database; observe that the balance was updated directly.
- **Expected Behavior:** `savings_balance` is an immutable protected ledger balance that can only change through atomic financial mutations (`/money/income`, `/money/expense`, `/money/transfer`, `/savings/goals/{id}/deposit`), never via profile patch.
- **Root Cause:** Permissive inclusion of financial balance fields inside user profile DTO.
- **Recommended Fix:** Remove `savings_balance` from `ProfileIn` schema completely.
- **Regression Test:** Pytest attempting `PATCH /auth/me` with `savings_balance` and verifying it is ignored or rejected, and balance remains unchanged.

#### Issue FIN-01: Clamping Balance to Zero While Recording Full Expense (Phantom Overdraft)
- **Severity:** P0
- **File & Function:** `backend/app/routers/staff.py` (`add_expense`)
- **Actual Problem:** 
  ```python
  user.savings_balance = round(max(0.0, user.savings_balance - body.amount), 2)
  ```
  If a user has ₹500 in savings and records an expense of ₹2,500, the server sets `user.savings_balance = 0.0`, but records `Transaction(amount=2500, is_credit=False)`. This creates a ₹2,000 unbacked phantom overdraft that violates double-entry accounting reconciliation.
- **Reproduction Steps:**
  1. User has balance of ₹1,000.
  2. User submits expense of ₹3,000 via `POST /money/expense`.
  3. Response returns `balance: 0.0` and records ₹3,000 expense transaction.
- **Expected Behavior:** Since overdrafts are not an explicitly supported facility, the system must enforce strict insufficient-funds policy: reject the request with HTTP 400 Bad Request if `user.savings_balance < body.amount`.
- **Root Cause:** `max(0.0, ...)` was used as a cosmetic clamp instead of enforcing financial ledger balance checks.
- **Recommended Fix:** Add pre-condition check:
  ```python
  if user.savings_balance < body.amount:
      raise HTTPException(400, f"Insufficient funds: Available balance Rs {user.savings_balance:,.2f} is less than requested expense Rs {body.amount:,.2f}")
  user.savings_balance = round(user.savings_balance - body.amount, 2)
  ```
- **Regression Test:** Pytest testing expense > balance (HTTP 400), expense == balance (balance 0, HTTP 200), and expense < balance.

---

### P1 — High Severity (Incorrect Calculations, Broken Workflows, Auth Escapes)

#### Issue SEC-02: Missing Production Hardening for `SECRET_KEY`
- **Severity:** P1
- **File & Function:** `backend/app/config.py`
- **Actual Problem:** Default development key could be accidentally deployed in production without triggering a hard failure.
- **Root Cause:** Permissive default fallback without checking `ENVIRONMENT == "production"`.
- **Recommended Fix:** Validate at startup that production requires a custom key >= 32 characters.
- **Status:** Fixed & Verified.

#### Issue FIN-02: Password UTF-8 Byte Length Truncation
- **Severity:** P1
- **File & Function:** `backend/app/schemas.py` & `security.py`
- **Actual Problem:** Silent slicing `[:72]` allowed long or multi-byte Devanagari passwords to be clipped without user notification.
- **Root Cause:** No explicit byte boundary check in Pydantic schema.
- **Recommended Fix:** Add Pydantic field validator enforcing `6 <= len(password.encode('utf-8')) <= 72`.
- **Status:** Fixed & Verified.

#### Issue FIN-03: Unsupported Loan Product and Schedule Types Allowed
- **Severity:** P1
- **File & Function:** `backend/app/schemas.py` (`LoanIn`) & `backend/app/routers/loans.py` (`apply_for_loan`)
- **Actual Problem:** `LoanIn` declared `product_type: str = "standard"` and `schedule_type: str = "monthly"` without enum or Literal restriction. A client could pass arbitrary strings (e.g. `schedule_type="random_test"`), which defaulted silently to standard amortization during approval.
- **Root Cause:** Unconstrained string types in schema.
- **Recommended Fix:** Restrict `product_type` and `schedule_type` using `Literal` to supported types:
  - `product_type`: `standard`, `kisan_agri`, `pm_mudra`, `mahila_shakti`, `pm_svanidhi`, `emergency_health`, `solar_green`, `artisan_micro`
  - `schedule_type`: `monthly`, `harvest_bullet`
- **Regression Test:** Pytest sending invalid `schedule_type="unknown"` expecting HTTP 422.

#### Issue REP-01: Fabricated Report Data and Fallback Placeholders
- **Severity:** P1
- **File & Function:** `backend/app/routers/reports.py`
- **Actual Problem:** `collection-efficiency` returned hardcoded `₹4,50,000`, `tax-certificate` returned fake `₹18,450`, and `credit-health` mimicked official bureau reports.
- **Root Cause:** Demonstration placeholders left in reporting engine.
- **Recommended Fix:** Replace with authoritative DB aggregations and clear educational disclaimers.
- **Status:** Fixed & Verified.

#### Issue AUTH-01: Lack of Brute-Force Rate Limiting
- **Severity:** P1
- **File & Function:** `backend/app/routers/auth.py` (`login`)
- **Actual Problem:** Repeated failed login attempts were not throttled.
- **Root Cause:** No rate limiter configured on auth route.
- **Recommended Fix:** Add sliding-window in-memory failed attempt counter triggering HTTP 429 after 5 failures.
- **Status:** Fixed & Verified.

---

### P2 — Medium Severity (Incomplete Features, Inconsistent UI States)

#### Issue UI-01: Undisclosed Simulated Demo Payments
- **Severity:** P2
- **File & Function:** `frontend/src/pages/Loans.jsx` & `Dashboard.jsx`
- **Actual Problem:** UPI payment modals claimed to verify live UPI PSP handles without disclosing demo simulation mode.
- **Root Cause:** Missing simulated mode disclaimer banner.
- **Recommended Fix:** Added prominent `⚡ Simulated Demo Mode` banner and updated button labels.
- **Status:** Fixed & Verified.

#### Issue UI-02: Stale Data on Demo Persona Switching
- **Severity:** P2
- **File & Function:** `frontend/src/App.jsx` (`RolePerspectiveSwitcher`)
- **Actual Problem:** Switching personas re-authenticates the user, but in-memory component states or notifications could linger from previous session.
- **Root Cause:** Navigation did not invalidate all cached data contexts.
- **Recommended Fix:** Clear notifications and component caches on persona switch.

#### Issue UI-03: Incomplete Multilingual Translation Keys
- **Severity:** P2
- **File & Function:** `frontend/src/i18n.jsx`
- **Actual Problem:** Financial product terms, amortization methods, and statutory compliance tags were missing in Hindi and Marathi.
- **Root Cause:** Initial dictionary was limited to ~25 navigation keys.
- **Recommended Fix:** Expanded dictionaries for EN, HI, and MR.
- **Status:** Fixed & Verified.

#### Issue SHG-01: Conflicting SHG Membership Assignment
- **Severity:** P2
- **File & Function:** `backend/app/routers/community.py` (`add_member`)
- **Actual Problem:** An SHG leader could add an existing user to their SHG even if the user already belonged to another SHG (`member.shg_id is not None`).
- **Root Cause:** Missing check on existing `member.shg_id`.
- **Recommended Fix:** If `member.shg_id and member.shg_id != shg.id`, raise HTTP 409 Conflict explaining the member is already enrolled in another SHG.
- **Regression Test:** Pytest testing re-enrollment of already-assigned member.

#### Issue DOC-01: Loan Document Verification on Inactive Loans
- **Severity:** P2
- **File & Function:** `backend/app/routers/loans.py` (`verify_document`)
- **Actual Problem:** Document verification did not check loan status, allowing verification on closed or rejected loans.
- **Root Cause:** Missing status precondition.
- **Recommended Fix:** Restrict verification to `loan.status in ("pending", "approved")`.

#### Issue UI-04: Mobile Table Horizontal Overflow
- **Severity:** P2
- **File & Function:** `frontend/src/styles.css`
- **Actual Problem:** Amortization tables clipped on viewport widths < 480px.
- **Root Cause:** Missing touch-scroll table container.
- **Recommended Fix:** Added `.table-responsive` with smooth touch scrolling and custom scrollbars.
- **Status:** Fixed & Verified.

---

### P3 — Low Severity (Cosmetic, Minor Polish, Redundant Files)

#### Issue POL-01: Redundant Empty Database File
- **Severity:** P3
- **File:** `backend/financesaathi.db` (0 bytes)
- **Problem:** Caused initial ambiguity with `backend/syra.db`.
- **Fix:** Documented in `docs/DATABASE.md` as legacy placeholder.

#### Issue POL-02: Print Styles for Official Sanction Letter
- **Severity:** P3
- **File:** `frontend/src/styles.css`
- **Problem:** Browser print included top bar and sidebar navigation.
- **Fix:** Added `@media print` rules cleanly isolating the document canvas.
- **Status:** Fixed & Verified.

#### Issue POL-03: Missing Transaction Category Filter
- **Severity:** P3
- **File:** `frontend/src/pages/Transactions.jsx`
- **Problem:** Passbook list displayed all items without category pills.
- **Fix:** Add category filter tabs on Passbook page.

#### Issue POL-04: Production Startup Exception Masking
- **Severity:** P3
- **File:** `backend/app/main.py`
- **Problem:** Ensure no raw stack traces are returned to client in HTTP 500 error responses.
