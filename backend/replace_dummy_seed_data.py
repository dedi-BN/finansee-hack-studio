"""One-time / re-runnable, manually-run script that syncs the 25 launch
hacks in app/hacks_data.py into the database - both replacing the original
dummy seed rows and refreshing already-seeded rows when their editorial
content changes (e.g. the Finansee section rewrite).

Run from the backend/ directory, after reviewing what it will do:

    python replace_dummy_seed_data.py           # dry run (default) - prints a plan, changes nothing
    python replace_dummy_seed_data.py --apply    # backs up the DB, then applies the changes

Safety model
------------
- Backs up finansee_hacks.db (timestamped, into backend/backups/) before
  writing anything, whenever --apply is used and the DB file exists.
- A row is only touched if it matches a known hack from hacks_data.py by
  `number` (1001-1025, the original seeding order) AND either:
    (a) same `title` as the original dummy AND `seed_key IS NULL` - the
        first-run "replace dummy content" path, or
    (b) `seed_key` already equals this hack's seed_key - the "refresh
        previously-seeded content" path, safe to re-run any time the
        editorial text in hacks_data.py changes.
  A row a user has since retitled, or created themselves (different
  number / no matching seed_key), never matches either path and is left
  untouched.
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

from sqlalchemy import and_, or_

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

    updated, skipped = [], []
    with SessionLocal() as db:
        for i, (old_title, new_hack) in enumerate(zip(OLD_DUMMY_TITLES, HACKS)):
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

        if apply and updated:
            db.commit()

    print(f"\n{'APPLIED' if apply else 'DRY RUN'} - {len(updated)} row(s) would be replaced, {len(skipped)} skipped (already replaced or modified by a user):\n")
    for number, title in updated:
        print(f"  #{number}: {title}")
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
