import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

# Local default is a SQLite file. In production set DATABASE_URL to a
# Postgres connection string (e.g. from Neon or Render Postgres) so data
# survives restarts and redeploys - a SQLite file on Render's disk does not.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./finansee_hacks.db").strip()

# Hosting providers hand out "postgres://" or "postgresql://" URLs; SQLAlchemy
# needs the driver named explicitly to use psycopg 3.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgres://"):]
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgresql://"):]

IS_SQLITE = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if IS_SQLITE else {},
    # Serverless Postgres (e.g. Neon) closes idle connections; check each
    # pooled connection before use instead of failing the request.
    pool_pre_ping=not IS_SQLITE,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
