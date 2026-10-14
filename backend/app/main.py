from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (register tables)
from .config import CORS_ORIGINS
from .database import Base, SessionLocal, engine
from .routers import auth, community, grievances, literacy, loans, reports, staff, tools
from .seed import seed


from sqlalchemy import text


def _migrate_sqlite_columns(eng):
    try:
        with eng.begin() as conn:
            # Check schemes columns
            res = conn.execute(text("PRAGMA table_info(schemes)")).fetchall()
            existing_cols = {row[1] for row in res}
            cols_to_add = [
                ("code", "VARCHAR(50) DEFAULT ''"),
                ("language", "VARCHAR(5) DEFAULT 'en'"),
                ("category", "VARCHAR(50) DEFAULT 'general'"),
                ("benefit_summary", "VARCHAR(255) DEFAULT ''"),
                ("benefit_value", "FLOAT DEFAULT 0.0"),
                ("eligibility_rules", "JSON DEFAULT '[]'"),
                ("last_verified", "VARCHAR(20) DEFAULT ''"),
            ]
            for col_name, col_def in cols_to_add:
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE schemes ADD COLUMN {col_name} {col_def}"))

            # Check loan_products columns
            res_lp = conn.execute(text("PRAGMA table_info(loan_products)")).fetchall()
            existing_lp = {row[1] for row in res_lp}
            lp_cols = [
                ("name_hi", "VARCHAR(120) DEFAULT ''"),
                ("name_mr", "VARCHAR(120) DEFAULT ''"),
                ("allowed_schedule_types", "JSON DEFAULT '[\"monthly\"]'"),
                ("required_documents", "JSON DEFAULT '[\"aadhaar\"]'"),
                ("eligibility_notes", "TEXT DEFAULT ''"),
                ("active", "BOOLEAN DEFAULT 1"),
            ]
            for col_name, col_def in lp_cols:
                if col_name not in existing_lp:
                    conn.execute(text(f"ALTER TABLE loan_products ADD COLUMN {col_name} {col_def}"))
    except Exception:
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Idempotent table creation (works on both SQLite and PostgreSQL)
    Base.metadata.create_all(engine)
    _migrate_sqlite_columns(engine)
    with SessionLocal() as db:
        seed(db)
    yield


app = FastAPI(
    title="FinanceSaathi (साथी AI) - Digital Financial Literacy & Microfinance Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

for r in (auth.router, tools.router, loans.router, community.router, literacy.router, staff.router, reports.router, grievances.router):
    app.include_router(r)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "app": "FinanceSaathi (साथी AI)",
        "version": "1.0.0",
    }
