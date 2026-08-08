from typing import List, Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from . import models, schemas

SORTABLE_FIELDS = {
    "number": models.FinancialHack.number,
    "title": models.FinancialHack.title,
    "status": models.FinancialHack.status,
    "updated_at": models.FinancialHack.updated_at,
    "importance": models.FinancialHack.importance,
    "virality": models.FinancialHack.virality,
    "potential_savings": models.FinancialHack.potential_savings,
    "urgency": models.FinancialHack.urgency,
}


def get_next_number(db: Session) -> int:
    max_number = db.query(func.max(models.FinancialHack.number)).scalar()
    return (max_number or 1000) + 1


def get_hack(db: Session, hack_id: int) -> Optional[models.FinancialHack]:
    return db.query(models.FinancialHack).filter(models.FinancialHack.id == hack_id).first()


def list_hacks(
    db: Session,
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    age: Optional[str] = None,
    employment: Optional[str] = None,
    sort: str = "updated_at",
    order: str = "desc",
    limit: Optional[int] = None,
) -> List[models.FinancialHack]:
    query = db.query(models.FinancialHack)

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                models.FinancialHack.title.ilike(like),
                models.FinancialHack.hook.ilike(like),
                models.FinancialHack.content.ilike(like),
            )
        )

    if status:
        query = query.filter(models.FinancialHack.status == status)

    sort_column = SORTABLE_FIELDS.get(sort, models.FinancialHack.updated_at)
    query = query.order_by(sort_column.asc() if order == "asc" else sort_column.desc())

    results = query.all()

    # JSON "array contains" filters are done in Python for portability
    # between SQLite and Postgres (SQLite has no native JSON contains op).
    if category:
        results = [h for h in results if category in (h.expertise or [])]
    if age:
        results = [h for h in results if age in (h.age_groups or [])]
    if employment:
        results = [h for h in results if employment in (h.employment or [])]

    if limit is not None:
        results = results[:limit]

    return results


def create_hack(db: Session, hack_in: schemas.HackCreate) -> models.FinancialHack:
    hack = models.FinancialHack(number=get_next_number(db), **hack_in.model_dump())
    db.add(hack)
    db.commit()
    db.refresh(hack)
    return hack


def update_hack(
    db: Session, hack: models.FinancialHack, hack_in: schemas.HackUpdate
) -> models.FinancialHack:
    for field, value in hack_in.model_dump().items():
        setattr(hack, field, value)
    db.commit()
    db.refresh(hack)
    return hack


def delete_hack(db: Session, hack: models.FinancialHack) -> None:
    db.delete(hack)
    db.commit()


def get_stats(db: Session) -> schemas.DashboardStats:
    total = db.query(func.count(models.FinancialHack.id)).scalar() or 0
    counts = dict(
        db.query(models.FinancialHack.status, func.count(models.FinancialHack.id))
        .group_by(models.FinancialHack.status)
        .all()
    )
    return schemas.DashboardStats(
        total=total,
        draft=counts.get("Draft", 0),
        professional_review=counts.get("Professional Review", 0),
        approved=counts.get("Approved", 0),
        published=counts.get("Published", 0),
    )
