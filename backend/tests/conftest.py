import os
import tempfile

_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp.name}"
os.environ["SECRET_KEY"] = "test-secret-at-least-32-bytes-long-for-jwt"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


def login(client, email, password):
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture(scope="session")
def staff(client):
    return {"officer": login(client, "officer@syra-demo.com", "officer123"),
            "admin": login(client, "admin@syra-demo.com", "admin123"),
            "leader": login(client, "leader@syra-demo.com", "leader123")}


def make_user(client, email, income=25000, expenses=12000):
    client.post("/auth/register", json={"name": "Test User", "email": email, "password": "secret123"})
    h = login(client, email, "secret123")
    client.patch("/auth/me", headers=h, json={"monthly_income": income, "monthly_expenses": expenses,
                                              "existing_emi": 0, "savings_balance": 30000})
    return h
