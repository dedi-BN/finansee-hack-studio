import hashlib
import json

from sqlalchemy.orm import Session

from . import models
from .hacks_data import HACKS

# Fields of a hack that the sync script may write and that count as
# "editorial content" when detecting edits made in the UI. `status` is
# deliberately excluded: the workflow state belongs to the editors, and the
# sync script never changes it on an existing row.
EDITORIAL_FIELDS = [key for key in HACKS[0] if key not in ("seed_key", "status")]


def seed_fingerprint(values) -> str:
    """Stable hash of a hack's editorial content. Accepts a dict (from
    hacks_data) or a FinancialHack row."""
    get = values.get if isinstance(values, dict) else (lambda f: getattr(values, f, None))
    payload = {field: get(field) if get(field) is not None else "" for field in EDITORIAL_FIELDS}
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def seed_if_empty(db: Session) -> None:
    """Populates a brand-new database with the launch hacks from hacks_data.py.

    Only runs when the table is completely empty, so it never touches a
    database that already has data (seeded or hand-authored) - safe to
    call on every app startup.
    """
    if db.query(models.FinancialHack).count() > 0:
        return

    for i, hack in enumerate(HACKS):
        db.add(models.FinancialHack(number=1001 + i, seed_hash=seed_fingerprint(hack), **hack))

    db.commit()
