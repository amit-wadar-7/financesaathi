# FinanceSaathi / SYRA (साथी AI) - Digital Financial Literacy & Microfinance Platform

An institutional digital financial inclusion and microfinance platform engineered for rural and semi-urban Self-Help Groups (SHGs), smallholder farmers, micro-entrepreneurs, and credit underwriters.

Built in strict compliance with the **Reserve Bank of India (RBI) Microfinance Loans Directions 2022**, **Priority Sector Lending (PSL) Guidelines**, and the **Digital Personal Data Protection (DPDP) Act, 2023**.

---

## 1. Architectural Highlights

- **Full-Stack Stack:** FastAPI (Python 3.11+) + SQLAlchemy 2.0 ORM + SQLite / PostgreSQL + React 18 + Vite + Custom Microfinance Design System.
- **Consistent Double-Entry Ledger:** Centralized ledger service (`backend/app/ledger.py`) tracking wallets, savings balances, thrift contributions, and loans with zero balance drift.
- **Microcredit Products:** 7 targeted loan facilities (Kisan Agri, PM MUDRA, Mahila Shakti SHG Enterprise, PM SVANidhi, Clean Energy Solar, Emergency Health, Artisan Microcredit).
- **Flexible Amortization Engines:** Reducing Balance EMI alongside Agricultural Kisan Harvest-aligned schedules (Gestation interest maintenance + Mandi harvest sale lumpsum bullets) with zero foreclosure penalties.
- **Real KYC Document Pipeline:** Magic byte validation (PDF, PNG, JPEG), file size limits (<= 2MB), borrower data isolation, and officer review desk.
- **Autonomous SHG Governance:** Quorum tracking meetings, member thrift savings register, and peer-to-peer internal lending with leader approval and repayments.
- **Offline RAG-Lite Saathi AI:** Zero paid APIs (`LLM_PROVIDER=none`), TF-IDF cosine-similarity retrieval over RBI rules, SHG guidelines, fraud defense, and schemes with trilingual responses (English, Hindi, Marathi).
- **RBI Fair Practices Grievance Redressal:** Formal internal ombudsman ticket tracking (`/grievances`) with statutory 30-day turnaround tracking and officer resolution remarks.
- **Mobile-First Responsive Interface:** Bottom navigation bar, slide-out navigation drawer, dark mode toggle, and clean `@media print` stylesheets for statements and sanction letters.
- **Security & Privacy:** Silent token rotation (DPDP Act compliance), consent tracking, data portability (`GET /me/export`), and erasure requests.

---

## 2. Directory Structure

```
syra/
├── backend/            # FastAPI REST backend & ML affordability engine
│   ├── app/            # Core application
│   │   ├── ledger.py   # Double-entry ledger & money movement service
│   │   ├── deps.py     # Auth dependencies, role enforcement & audit
│   │   ├── models.py   # SQLAlchemy models (User, Loan, SHG, Grievance, etc.)
│   │   ├── saathi/     # Offline RAG-Lite retriever & multilingual engine
│   │   └── routers/    # Modular API routers (auth, loans, staff, community, grievances, etc.)
│   ├── backups/        # Verified database backup archives (syra_backup_verified.db)
│   ├── tests/          # Comprehensive pytest test suite (29 passing tests)
│   ├── financesaathi.db# Active operational database
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/           # React 18 + Vite responsive mobile/desktop interface
│   ├── src/            # Components, pages, custom SVG icons, i18n
│   │   ├── pages/      # Dashboard, Loans, Community, Reports, Grievances, etc.
│   │   ├── App.jsx     # Route definitions, mobile drawer & bottom navigation
│   │   └── styles.css  # Production fintech design system & responsive rules
│   ├── public/         # PWA Web App manifest & icons
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml  # Multi-container orchestration
└── docs/               # Architecture, audit, and verification reports
```

---

## 3. Quick Start & Setup

### 3.1 Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

- **Backend API:** `http://localhost:8000`
- **Interactive Swagger Documentation:** `http://localhost:8000/docs`

### 3.2 Frontend Setup

In a separate terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

- **Frontend Application:** `http://localhost:5173`

### 3.3 Docker Deployment

To launch the complete platform using Docker Compose:

```bash
docker compose up --build -d
```

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`

---

## 4. Verification & Testing

Execute the automated test suites to verify system integrity:

```bash
# 1. Run backend tests (29/29 passing)
backend\.venv\Scripts\python -m pytest backend/tests -v

# 2. Run frontend production build (0 errors)
cd frontend
npm run build
```

---

## 5. Audit & Compliance Highlights

- **RBI Microfinance Directions 2022:** 100% collateral-free microfinance, zero prepayment penalties, reducing balance interest calculation, and strict PSL >= 75% target monitoring.
- **DPDP Act 2023:** Mandatory consent checkboxes, user data export (`/me/export`), and digital erasure requests.
- **RBI Fair Practices Redressal:** Turnaround Time (TAT) metrics with officer remarks and resolution timestamps on complaints.
- **Zero Mock / Zero Fake Data:** All KPIs, passbooks, and reports are dynamically computed from transactions, repayments, and thrift entries in `financesaathi.db`.
