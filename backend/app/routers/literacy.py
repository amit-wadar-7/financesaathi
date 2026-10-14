from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(tags=["literacy"])


@router.get("/courses")
def list_courses(language: str = "en", db: Session = Depends(get_db)):
    cs = db.scalars(select(models.Course).where(models.Course.language == language).order_by(models.Course.id)).all()
    return [{"id": c.id, "slug": c.slug, "title": c.title, "summary": c.summary, "language": c.language} for c in cs]


@router.get("/courses/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):
    c = db.get(models.Course, course_id)
    if not c:
        raise HTTPException(404, "Course not found")
    return {"id": c.id, "slug": c.slug, "title": c.title, "content": c.content, "language": c.language}


@router.get("/courses/{course_id}/quiz")
def get_quiz(course_id: int, db: Session = Depends(get_db)):
    c = db.get(models.Course, course_id)
    if not c:
        raise HTTPException(404, "Course not found")
    # correct answers are intentionally not sent to the client
    return [{"id": q.id, "question": q.question, "options": q.options} for q in c.questions]


@router.post("/courses/{course_id}/quiz/submit")
def submit_quiz(course_id: int, body: schemas.QuizSubmitIn, user=Depends(get_current_user),
                db: Session = Depends(get_db)):
    c = db.get(models.Course, course_id)
    if not c:
        raise HTTPException(404, "Course not found")
    qs = c.questions
    if len(body.answers) != len(qs):
        raise HTTPException(400, f"Expected {len(qs)} answers")
    results = [{"question_id": q.id, "correct": a == q.answer_index, "explanation": q.explanation}
               for q, a in zip(qs, body.answers)]
    score = round(sum(r["correct"] for r in results) / len(qs) * 100, 1)
    prog = db.scalar(select(models.CourseProgress).where(
        models.CourseProgress.user_id == user.id, models.CourseProgress.course_slug == c.slug))
    if not prog:
        prog = models.CourseProgress(user_id=user.id, course_slug=c.slug)
        db.add(prog)
    prog.best_score = max(prog.best_score or 0, score)
    prog.completed = prog.best_score >= 60
    prog.updated_at = models.now()
    db.commit()
    return {"score": score, "passed": score >= 60, "results": results}


@router.get("/progress")
def my_progress(user=Depends(get_current_user), db: Session = Depends(get_db)):
    ps = db.scalars(select(models.CourseProgress).where(models.CourseProgress.user_id == user.id)).all()
    return [{"course_slug": p.course_slug, "best_score": p.best_score, "completed": p.completed} for p in ps]


@router.get("/schemes")
def schemes(language: str = "en", db: Session = Depends(get_db)):
    ss = db.scalars(select(models.Scheme).where(models.Scheme.language == language)).all()
    return [{
        "id": s.id,
        "code": s.code,
        "name": s.name,
        "language": s.language,
        "category": s.category,
        "benefit_summary": s.benefit_summary,
        "benefit_value": s.benefit_value,
        "description": s.description,
        "eligibility": s.eligibility,
        "eligibility_rules": s.eligibility_rules or {},
        "url": s.url,
        "last_verified": s.last_verified or "2026-10-01",
    } for s in ss]

