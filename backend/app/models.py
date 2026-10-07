from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Integer, String, Text

from .database import Base


class FinancialHack(Base):
    __tablename__ = "financial_hacks"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, unique=True, index=True, nullable=False)

    # Identifies rows created by the seed/replace scripts so re-running them
    # is idempotent and never touches hand-authored rows. NULL = user-created.
    seed_key = Column(String, unique=True, index=True, nullable=True)
    # Fingerprint of the editorial content as last written by the seed/sync
    # script. If a row's current content no longer matches it, someone edited
    # the row in the UI, and the sync script leaves it alone.
    seed_hash = Column(String, nullable=True)

    title = Column(String, nullable=False, default="")
    subtitle = Column(Text, default="")
    # Legacy short-description column, superseded by `subtitle`. Kept
    # (unused by the API) rather than dropped, so no data is destroyed.
    description = Column(Text, default="")

    hook = Column(Text, default="")
    why_it_matters = Column(Text, default="")
    problem = Column(Text, default="")
    example_story = Column(Text, default="")
    content = Column(Text, default="")
    action_steps = Column(JSON, default=list)
    cautions = Column(Text, default="")
    bottom_line = Column(Text, default="")
    cta = Column(Text, default="")
    professional_notes = Column(Text, default="")
    sources = Column(Text, default="")

    age_groups = Column(JSON, default=list)
    family_status = Column(JSON, default=list)
    employment = Column(JSON, default=list)
    financial_status = Column(JSON, default=list)
    expertise = Column(JSON, default=list)

    importance = Column(Integer, default=1)
    virality = Column(Integer, default=1)
    potential_savings = Column(Integer, default=1)
    urgency = Column(Integer, default=1)

    status = Column(String, default="Draft", index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
