"""One-time / re-runnable, manually-run script that syncs the hacks in
app/hacks_data.py into the database - replacing the original dummy seed
rows, refreshing already-seeded rows when their editorial content changes
(e.g. a copy rewrite), and inserting any hack that has no row yet at all
(e.g. a brand-new hack added to HACKS after the original 25).

Run from the backend/ directory, after reviewing what it will do:

    python replace_dummy_seed_data.py           # dry run (default) - prints a plan, changes nothing
    python replace_dummy_seed_data.py --apply    # backs up the DB, then applies the changes

Safety model
------------
- Backs up finansee_hacks.db (timestamped, into backend/backups/) before
  writing anything, whenever --apply is used and the DB file exists.
- For the original 25 hacks (matched positionally to OLD_DUMMY_TITLES), a
  row is only touched if it matches by `number` (1001-1025, the original
  seeding order) AND either:
    (a) same `title` as the original dummy AND `seed_key IS NULL` - the
        first-run "replace dummy content" path, or
    (b) `seed_key` already equals this hack's seed_key - the "refresh
        previously-seeded content" path, safe to re-run any time the
        editorial text in hacks_data.py changes.
  A row a user has since retitled, or created themselves (different
  number / no matching seed_key), never matches either path and is left
  untouched.
- For hacks beyond the original 25 (no dummy counterpart), a row is
  matched only by `seed_key`. If found, it's refreshed in place (same
  safe re-run behavior as path (b) above). If not found, a brand-new row
  is inserted with the next free `number` (max existing number + 1).
- Matched rows are updated in place (same id) with the current content
  from hacks_data.py, and (re-)stamped with their `seed_key`.
- Never deletes any row.
"""

import shutil
import sys
from datetime import datetime
from pathlib import Path

# Windows terminals often default to a non-UTF-8 codepage, which breaks
# printing Hebrew titles. Force UTF-8 output regardless of the console.
sys.stdout.reconfigure(encoding="utf-8")

from sqlalchemy import and_, func, or_

from app import models
from app.database import SessionLocal, engine
from app.hacks_data import HACKS, OLD_DUMMY_TITLES
from app.migrations import run_migrations

DB_PATH = Path(__file__).parent / "finansee_hacks.db"
BACKUP_DIR = Path(__file__).parent / "backups"


def backup_db() -> None:
    if not DB_PATH.exists():
        return
    BACKUP_DIR.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest = BACKUP_DIR / f"finansee_hacks_{stamp}_pre_replace.db"
    shutil.copy2(DB_PATH, dest)
    print(f"Backed up database to {dest}")


def main() -> None:
    apply = "--apply" in sys.argv

    run_migrations(engine)

    original_hacks = HACKS[: len(OLD_DUMMY_TITLES)]
    new_hacks = HACKS[len(OLD_DUMMY_TITLES) :]

    updated, skipped, inserted = [], [], []
    with SessionLocal() as db:
        for i, (old_title, new_hack) in enumerate(zip(OLD_DUMMY_TITLES, original_hacks)):
            number = 1001 + i
            row = (
                db.query(models.FinancialHack)
                .filter(
                    models.FinancialHack.number == number,
                    or_(
                        and_(
                            models.FinancialHack.title == old_title,
                            models.FinancialHack.seed_key.is_(None),
                        ),
                        models.FinancialHack.seed_key == new_hack["seed_key"],
                    ),
                )
                .first()
            )
            if row is None:
                skipped.append((number, old_title))
                continue

            updated.append((number, new_hack["title"]))
            if apply:
                for field, value in new_hack.items():
                    setattr(row, field, value)

        # Hacks with no dummy counterpart: refresh by seed_key if the row
        # already exists, otherwise insert as a brand-new row with the
        # next free number.
        next_number = (db.query(func.max(models.FinancialHack.number)).scalar() or 1000) + 1
        for new_hack in new_hacks:
            row = (
                db.query(models.FinancialHack)
                .filter(models.FinancialHack.seed_key == new_hack["seed_key"])
                .first()
            )
            if row is not None:
                updated.append((row.number, new_hack["title"]))
                if apply:
                    for field, value in new_hack.items():
                        setattr(row, field, value)
                continue

            inserted.append((next_number, new_hack["title"]))
            if apply:
                db.add(models.FinancialHack(number=next_number, **new_hack))
            next_number += 1

        if apply and (updated or inserted):
            db.commit()

    print(
        f"\n{'APPLIED' if apply else 'DRY RUN'} - {len(updated)} row(s) would be replaced/refreshed, "
        f"{len(inserted)} row(s) would be inserted as new, {len(skipped)} skipped "
        "(already replaced or modified by a user):\n"
    )
    for number, title in updated:
        print(f"  #{number}: {title}")
    if inserted:
        print("\nNew rows (no existing dummy or seed_key match found):")
        for number, title in inserted:
            print(f"  #{number} (new): {title}")
    if skipped:
        print("\nSkipped (no exact dummy match found - left untouched):")
        for number, title in skipped:
            print(f"  #{number}: {title}")

    if not apply:
        print("\nThis was a dry run - no changes were made. Re-run with --apply to write changes.")
    else:
        print("\nDone.")


if __name__ == "__main__":
    if "--apply" in sys.argv:
        backup_db()
    main()
