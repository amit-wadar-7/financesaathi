import os

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./syra.db")
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me-at-least-32-chars-long")
ACCESS_TOKEN_MINUTES = int(os.environ.get("ACCESS_TOKEN_MINUTES", "120"))
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
