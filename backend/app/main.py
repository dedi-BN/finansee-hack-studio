from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import ai, crud, schemas
from .database import SessionLocal, engine, get_db
from .migrations import run_migrations
from .seed import seed_if_empty

run_migrations(engine)

with SessionLocal() as db:
    seed_if_empty(db)

app = FastAPI(title="Finansee Hack Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://finansee-hack-studio.vercel.app",  # placeholder - replace with the real Vercel URL once deployed
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/stats", response_model=schemas.DashboardStats)
def read_stats(db: Session = Depends(get_db)):
    return crud.get_stats(db)


@app.get("/api/hacks", response_model=list[schemas.Hack])
def read_hacks(
    search: str | None = None,
    category: str | None = None,
    status: str | None = None,
    age: str | None = None,
    employment: str | None = None,
    sort: str = "updated_at",
    order: str = "desc",
    limit: int | None = None,
    db: Session = Depends(get_db),
):
    return crud.list_hacks(
        db,
        search=search,
        category=category,
        status=status,
        age=age,
        employment=employment,
        sort=sort,
        order=order,
        limit=limit,
    )


@app.get("/api/hacks/{hack_id}", response_model=schemas.Hack)
def read_hack(hack_id: int, db: Session = Depends(get_db)):
    hack = crud.get_hack(db, hack_id)
    if not hack:
        raise HTTPException(status_code=404, detail="Hack not found")
    return hack


@app.post("/api/hacks", response_model=schemas.Hack)
def create_hack(hack_in: schemas.HackCreate, db: Session = Depends(get_db)):
    return crud.create_hack(db, hack_in)


@app.put("/api/hacks/{hack_id}", response_model=schemas.Hack)
def update_hack(hack_id: int, hack_in: schemas.HackUpdate, db: Session = Depends(get_db)):
    hack = crud.get_hack(db, hack_id)
    if not hack:
        raise HTTPException(status_code=404, detail="Hack not found")
    return crud.update_hack(db, hack, hack_in)


@app.delete("/api/hacks/{hack_id}")
def delete_hack(hack_id: int, db: Session = Depends(get_db)):
    hack = crud.get_hack(db, hack_id)
    if not hack:
        raise HTTPException(status_code=404, detail="Hack not found")
    crud.delete_hack(db, hack)
    return {"ok": True}


@app.post("/api/ai/generate-draft")
def generate_ai_draft(request: schemas.DraftRequest):
    try:
        return ai.generate_draft(
            topic=request.topic,
            core_message=request.core_message,
            audience=request.audience,
            expertise=request.expertise,
            title=request.title,
            finansee_section=request.finansee_section,
        )
    except ai.DraftGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
