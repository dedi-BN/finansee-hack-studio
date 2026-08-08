from sqlalchemy.orm import Session

from . import models
from .hacks_data import HACKS


def seed_if_empty(db: Session) -> None:
    """Populates a brand-new database with the 25 real launch hacks.

    Only runs when the table is completely empty, so it never touches a
    database that already has data (seeded or hand-authored) - safe to
    call on every app startup.
    """
    if db.query(models.FinancialHack).count() > 0:
        return

    for i, hack in enumerate(HACKS):
        db.add(models.FinancialHack(number=1001 + i, **hack))

    db.commit()
