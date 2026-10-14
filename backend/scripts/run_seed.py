import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.app.database import SessionLocal, engine, Base
from backend.app.seed import seed_content
from backend.app import models
from sqlalchemy import select

# Ensure all tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()
seed_content(db)

courses = db.scalars(select(models.Course)).all()
schemes = db.scalars(select(models.Scheme)).all()

print(f"Total courses in DB: {len(courses)}")
for c in courses:
    print(f"  {c.slug} ({c.language}): {len(c.questions)} questions")
print(f"Total schemes in DB: {len(schemes)}")
for s in schemes[:8]:
    print(f"  {s.code} ({s.language}): {s.name}")

db.close()
