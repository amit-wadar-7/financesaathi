from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (register tables)
from .config import CORS_ORIGINS
from .database import Base, SessionLocal, engine
from .routers import auth, community, literacy, loans, staff, tools
from sqlalchemy import text
from .seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    with engine.connect() as con:
        try:
            cols = [c[1] for c in con.execute(text("PRAGMA table_info(loans)"))]
            if cols and "product_type" not in cols:
                con.execute(text("ALTER TABLE loans ADD COLUMN product_type VARCHAR(50) DEFAULT 'standard'"))
                con.commit()
        except Exception:
            pass
    with SessionLocal() as db:
        seed(db)
    yield


app = FastAPI(title="SYRA - Digital Financial Literacy & Microfinance Platform", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"],
                   allow_credentials=True)

for r in (auth.router, tools.router, loans.router, community.router, literacy.router, staff.router):
    app.include_router(r)


@app.get("/health")
def health():
    return {"status": "ok"}
