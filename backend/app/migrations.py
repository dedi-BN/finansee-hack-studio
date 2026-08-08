from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from .database import Base

TABLE = "financial_hacks"

# (column name, SQL type + default). Only additive changes: a column is
# added if missing, never altered or dropped, so existing rows and any
# hand-authored data are always preserved.
NEW_COLUMNS = [
    ("seed_key", "TEXT"),
    ("subtitle", "TEXT DEFAULT ''"),
    ("why_it_matters", "TEXT DEFAULT ''"),
    ("problem", "TEXT DEFAULT ''"),
    ("example_story", "TEXT DEFAULT ''"),
    ("action_steps", "TEXT DEFAULT '[]'"),
    ("cautions", "TEXT DEFAULT ''"),
    ("professional_notes", "TEXT DEFAULT ''"),
    ("sources", "TEXT DEFAULT ''"),
]


def run_migrations(engine: Engine) -> None:
    Base.metadata.create_all(bind=engine)

    existing_columns = {col["name"] for col in inspect(engine).get_columns(TABLE)}

    with engine.begin() as conn:
        for name, ddl_type in NEW_COLUMNS:
            if name not in existing_columns:
                conn.execute(text(f"ALTER TABLE {TABLE} ADD COLUMN {name} {ddl_type}"))

        conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_financial_hacks_seed_key "
                "ON financial_hacks (seed_key)"
            )
        )
