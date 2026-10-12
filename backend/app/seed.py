from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models
from .security import hash_password
from .seed_data import COURSES, SCHEMES

# Demo accounts for local development. CHANGE or delete before any real deployment.
DEMO_USERS = [
    ("Admin", "admin@syra-demo.com", "admin123", "admin"),
    ("Loan Officer", "officer@syra-demo.com", "officer123", "officer"),
    ("SHG Leader", "leader@syra-demo.com", "leader123", "shg_leader"),
]


def seed(db: Session):
    if not db.scalar(select(models.User).limit(1)):
        for name, email, pw, role in DEMO_USERS:
            db.add(models.User(name=name, email=email, password_hash=hash_password(pw), role=role))
    if not db.scalar(select(models.Course).limit(1)):
        for slug, langs in COURSES.items():
            for lang, (title, summary, content, quiz) in langs.items():
                course = models.Course(slug=slug, language=lang, title=title, summary=summary, content=content)
                for q, opts, ans, expl in quiz:
                    course.questions.append(models.QuizQuestion(question=q, options=opts, answer_index=ans,
                                                                explanation=expl))
                db.add(course)
    if not db.scalar(select(models.Scheme).limit(1)):
        for lang, items in SCHEMES.items():
            for name, desc, elig, url in items:
                db.add(models.Scheme(name=name, language=lang, description=desc, eligibility=elig, url=url))
    db.commit()
