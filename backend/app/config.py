import os

APP_ENV = os.environ.get("APP_ENV", os.environ.get("ENVIRONMENT", "dev")).lower()
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./financesaathi.db")
# Fallback to syra.db if financesaathi.db does not exist but syra.db exists (smooth local upgrade)
if DATABASE_URL.endswith("financesaathi.db") and not os.path.exists("financesaathi.db") and os.path.exists("syra.db"):
    DATABASE_URL = "sqlite:///./syra.db"

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me-at-least-32-chars-long")
ACCESS_TOKEN_MINUTES = int(os.environ.get("ACCESS_TOKEN_MINUTES", "30"))
REFRESH_TOKEN_DAYS = int(os.environ.get("REFRESH_TOKEN_DAYS", "7"))

CORS_ORIGINS_RAW = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000")
CORS_ORIGINS = [orig.strip() for orig in CORS_ORIGINS_RAW.split(",") if orig.strip()]

SEED_DEMO = os.environ.get("SEED_DEMO", "false").lower() in ("true", "1", "yes")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

UPI_VPA = os.environ.get("UPI_VPA", "financesaathi@okhdfcbank")
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "none").lower()

# Security hardening: In production, enforce non-default secret key >= 32 chars and explicit CORS
if APP_ENV == "production":
    if not SECRET_KEY or SECRET_KEY == "dev-secret-change-me-at-least-32-chars-long" or len(SECRET_KEY) < 32:
        raise RuntimeError("CRITICAL SECURITY ERROR: A secure, non-default SECRET_KEY of at least 32 characters is required in production.")
    if "*" in CORS_ORIGINS:
        raise RuntimeError("CRITICAL SECURITY ERROR: Wildcard CORS origin is forbidden in production.")
