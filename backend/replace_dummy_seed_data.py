"""Manually-run script that syncs the hacks in app/hacks_data.py into the
database: replaces the original dummy seed rows, refreshes seeded rows when
their editorial text changes in code, and inserts hacks that have no row yet.

Works against whatever DATABASE_URL points to - the local SQLite file or the
live Postgres (Neon). Run from the backend/ directory:

    python replace_dummy_seed_data.py            # dry run (default) - prints a plan, changes nothing
    python replace_dummy_seed_data.py --apply    # backs up, then applies the plan
    python replace_dummy_seed_data.py --apply --force   # also overwrite rows edited in the UI

Safety model
------------
- Backup: with --apply, every row of financial_hacks is exported to
  backups/financial_hacks_<timestamp>.json before anything is written, for
  SQLite and Postgres alike. For SQLite the .db file is copied as well.
- Edits made in the UI are never overwritten by default. Each seeded row
  carries `seed_hash`, a fingerprint of the content the script last wrote.
  A row is refreshed only if its current content still matches that
  fingerprint (nobody touched it). A row whose content differs, or that has
  no fingerprint yet and differs from the code, is reported as "edited" and
  skipped. --force overwrites those too.
- `status` is never changed on an existing seeded row - the workflow state
  belongs to the editors. (Dummy rows being replaced for the first time and
  brand-new rows get the status from hacks_data.py.)
- Rows that already match the code are left alone and reported as unchanged.
- Rows created by hand (no seed_key, not an original dummy) are never touched.
- Never deletes any row.
"""

import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

# Windows terminals often default to a non-UTF-8 codepage, which breaks
# printing Hebrew titles. Force UTF-8 output regardless of the console.
sys.stdout.reconfigure(encoding="utf-8")

from sqlalchemy import func, text

from app import models
from app.database import DATABASE_URL, IS_SQLITE, SessionLocal, engine
from app.hacks_data import HACKS, OLD_DUMMY_TITLES
from app.migrations import TABLE, run_migrations
from app.seed import EDITORIAL_FIELDS, seed_fingerprint

BACKUP_DIR = Path(__file__).parent / "backups"


def backup_db() -> None:
    BACKUP_DIR.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    with engine.connect() as conn:
        rows = [dict(r) for r in conn.execute(text(f"SELECT * FROM {TABLE}")).mappings()]
    dest = BACKUP_DIR / f"financial_hacks_{stamp}.json"
    dest.write_text(json.dumps(rows, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    print(f"Backed up {len(rows)} row(s) to {dest}")

    if IS_SQLITE:
        db_file = Path(DATABASE_URL.split("///", 1)[1])
        if db_file.exists():
            copy = BACKUP_DIR / f"finansee_hacks_{stamp}_pre_replace.db"
            shutil.copy2(db_file, copy)
            print(f"Copied database file to {copy}")


def changed_fields(row: models.FinancialHack, hack: dict) -> list[str]:
    return [f for f in EDITORIAL_FIELDS if (getattr(row, f) or "") != (hack.get(f) or "")]


def write_content(row: models.FinancialHack, hack: dict, include_status: bool) -> None:
    for field in EDITORIAL_FIELDS:
        setattr(row, field, hack[field])
    row.seed_key = hack["seed_key"]
    if include_status:
        row.status = hack["status"]
    row.seed_hash = seed_fingerprint(hack)


def classify(row: models.FinancialHack, hack: dict) -> str:
    """unchanged / refresh / edited for a row that already carries this seed_key."""
    current = seed_fingerprint(row)
    if current == seed_fingerprint(hack):
        return "unchanged"
    if row.seed_hash and current == row.seed_hash:
        return "refresh"
    return "edited"


def main() -> None:
    apply = "--apply" in sys.argv
    force = "--force" in sys.argv

    run_migrations(engine)
    target = "SQLite (local file)" if IS_SQLITE else "Postgres (" + DATABASE_URL.split("@")[-1].split("/")[0] + ")"
    print(f"Database: {target}")

    if apply:
        backup_db()

    plan = {"replace_dummy": [], "refresh": [], "insert": [], "edited": [], "unchanged": [], "missing": []}

    with SessionLocal() as db:
        next_number = (db.query(func.max(models.FinancialHack.number)).scalar() or 1000) + 1

        for i, hack in enumerate(HACKS):
            row = db.query(models.FinancialHack).filter(models.FinancialHack.seed_key == hack["seed_key"]).first()

            if row is None and i < len(OLD_DUMMY_TITLES):
                # First run: replace the original dummy row in the same position.
                row = (
                    db.query(models.FinancialHack)
                    .filter(
                        models.FinancialHack.number == 1001 + i,
                        models.FinancialHack.title == OLD_DUMMY_TITLES[i],
                        models.FinancialHack.seed_key.is_(None),
                    )
                    .first()
                )
                if row is None:
                    plan["missing"].append((1001 + i, OLD_DUMMY_TITLES[i]))
                    continue
                plan["replace_dummy"].append((row.number, hack["title"]))
                if apply:
                    write_content(row, hack, include_status=True)
                continue

            if row is None:
                plan["insert"].append((next_number, hack["title"]))
                if apply:
                    db.add(models.FinancialHack(number=next_number, seed_hash=seed_fingerprint(hack), **hack))
                next_number += 1
                continue

            kind = classify(row, hack)
            if kind == "unchanged":
                plan["unchanged"].append((row.number, hack["title"]))
                if apply and not row.seed_hash:
                    row.seed_hash = seed_fingerprint(hack)  # record the baseline for next time
            elif kind == "refresh" or force:
                plan["refresh"].append((row.number, hack["title"] + ("  [FORCED]" if kind == "edited" else "")))
                if apply:
                    write_content(row, hack, include_status=False)
            else:
                plan["edited"].append((row.number, row.title, changed_fields(row, hack)))

        if apply:
            db.commit()

    header = "APPLIED" if apply else "DRY RUN"
    print(
        f"\n{header}: {len(plan['replace_dummy'])} dummy row(s) replaced, {len(plan['refresh'])} refreshed, "
        f"{len(plan['insert'])} inserted, {len(plan['edited'])} skipped as edited, "
        f"{len(plan['unchanged'])} unchanged."
    )
    sections = [
        ("replace_dummy", "Dummy rows replaced with real content"),
        ("refresh", "Refreshed with the current text from hacks_data.py (status kept)"),
        ("insert", "New rows"),
    ]
    for key, title in sections:
        if plan[key]:
            print(f"\n{title}:")
            for number, name in plan[key]:
                print(f"  #{number}: {name}")
    if plan["edited"]:
        print("\nSkipped - edited in the UI, left untouched (use --force to overwrite):")
        for number, name, fields in plan["edited"]:
            print(f"  #{number}: {name}  (differs in: {', '.join(fields)})")
    if plan["missing"]:
        print("\nNo matching row found (left untouched):")
        for number, name in plan["missing"]:
            print(f"  #{number}: {name}")

    if not apply:
        print("\nThis was a dry run - no changes were made. Re-run with --apply to write changes.")
    else:
        print("\nDone.")


if __name__ == "__main__":
    main()
