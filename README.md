# FinanceSaathi (साथी AI) - Digital Financial Literacy & Microfinance Platform

An institutional desktop microfinance platform designed for rural and semi-urban self-help groups (SHGs), micro-entrepreneurs, and credit officers. Built in compliance with **Reserve Bank of India (RBI) Microfinance Fair Practices Code** and the **Digital Personal Data Protection (DPDP) Act, 2023**.

---

## Architecture Overview

```
syra/
├── backend/            # FastAPI REST backend & ML affordability engine
│   ├── app/            # Core application (routers, auth, finance math, ML models)
│   ├── tests/          # Comprehensive pytest test suite
│   └── requirements.txt
├── frontend/           # React 18 + Vite responsive desktop interface
│   ├── src/            # Components, pages, custom SVG design system, i18n
│   ├── package.json
│   └── vite.config.js
└── e2e/                # End-to-end browser integration tests
```

---

## Prerequisites

- **Python 3.10+** (Python 3.11/3.12 recommended)
- **Node.js 18+** & **npm**
- **Git**

---

## 1. Backend Setup & Startup

```bash
# Navigate to backend directory
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

- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Database**: SQLite `syra.db` is auto-initialized and seeded with demo accounts on first launch.

---

## 2. Frontend Setup & Startup

In a second terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

- **Desktop Web App**: `http://localhost:5173`

---

## Default Demo Accounts (Pre-Seeded)

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Admin** | `admin@syra-demo.com` | `admin123` | System audit log, user role configuration, batch reminder runner |
| **Credit Officer** | `officer@syra-demo.com` | `officer123` | Underwriting terminal, KYC document authentication, loan sanction/rejection |
| **SHG Leader** | `leader@syra-demo.com` | `leader123` | Group roster management, meeting ledger, member invitations |
| **New Borrower** | *Self-Register* | *Any Password* | Full loan proposal, savings goals, passbook ledger, multilingual Saathi AI |

---

## Key Features & Financial Tools

1. **AI Affordability Engine**: Live underwriter pre-check evaluating Debt-to-Income (FOIR), expense ratios, and safe borrowing headroom.
2. **Sahukar Debt Trap Exposer**: Unmasks informal moneylender rates (e.g. ₹3/mo per ₹100 = 36% APR) vs. SHG 12% reducing balance, calculating exact wealth saved and generating a 3-step refinance roadmap.
3. **Kisan Harvest Flexi-EMI Planner**: Agricultural crop-cycle cashflow repayment schedule (gestation interest-only maintenance + harvest Mandi sale lumpsum principal clearance).
4. **NABARD SHG-Bank Linkage Governance**: Group loan management, assembly schedule, statutory quorum tracking, and member rosters.
5. **Printable Passbook Terminal**: Stamped digital passbook and transaction vouchers with cryptographic verification seals and one-click print styling (`@media print`).
6. **Saathi AI Voice Assistant**: Multilingual financial guidance in English, Hindi (हिन्दी), and Marathi (मराठी) with Web Speech API audio narration and voice STT input.
7. **Government Yojana Matcher**: Evaluates landholding, livelihood, and SHG status to match eligible grants (PM-KISAN, Lakhpati Didi, PM SVANidhi, PMFBY, Mudra).

---

## Running Automated Tests

```bash
# Run backend tests (100% pass rate)
cd backend
pytest -q

# Run frontend production build verification
cd frontend
npm run build
```

---

## Contributing & Collaboration

1. Clone or fork this repository:
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd syra
   ```
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes and push:
   ```bash
   git commit -m "Add descriptive commit message"
   git push origin feature/your-feature-name
   ```
