from datetime import datetime
from typing import Any, Dict, List

from pydantic import BaseModel, ConfigDict


class HackBase(BaseModel):
    title: str = ""
    subtitle: str = ""
    hook: str = ""
    why_it_matters: str = ""
    problem: str = ""
    example_story: str = ""
    content: str = ""
    action_steps: List[str] = []
    cautions: str = ""
    bottom_line: str = ""
    cta: str = ""
    professional_notes: str = ""
    sources: str = ""

    age_groups: List[str] = []
    family_status: List[str] = []
    employment: List[str] = []
    financial_status: List[str] = []
    expertise: List[str] = []

    importance: int = 1
    virality: int = 1
    potential_savings: int = 1
    urgency: int = 1

    status: str = "Draft"


class HackCreate(HackBase):
    pass


class HackUpdate(HackBase):
    pass


class Hack(HackBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    number: int
    created_at: datetime
    updated_at: datetime


class DraftRequest(BaseModel):
    topic: str
    core_message: str
    audience: Dict[str, Any]
    expertise: str
    # Title the editor picked in the wizard (step 5). When set, the draft
    # keeps it verbatim instead of letting the model invent its own.
    title: str = ""
    # The 5-part "How Finansee helps" section the editor wrote in step 4,
    # keyed like FinanseeSection in frontend/src/lib/finansee.ts
    # (knows / needed / analyzes / receives / nextStep). Non-empty parts are
    # kept verbatim in `cta`; empty parts are filled by the model.
    finansee_section: Dict[str, str] = {}


class DashboardStats(BaseModel):
    total: int
    draft: int
    professional_review: int
    approved: int
    published: int
