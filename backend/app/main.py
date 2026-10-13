from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (register tables)
from .config import CORS_ORIGINS
from .database import Base, SessionLocal, engine
from .routers import auth, community, grievances, literacy, loans, reports, staff, tools
from .seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Idempotent table creation (works on both SQLite and PostgreSQL)
    Base.metadata.create_all(engine)
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
