from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db import database, models
from ..auth import utils
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter(
    prefix="/startups",
    tags=["Startups"]
)

class StartupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    revenue: float
    burn: float
    cash: float
    growth: float
    team: int
    runway: int
    survival_score: int

class StartupResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    creator_email: str
    created_at: datetime
    # Metrics
    revenue: float
    burn: float
    cash: float
    team: int
    survival_score: int
    
    class Config:
        orm_mode = True

@router.post("/", response_model=StartupResponse)
def create_startup(
    startup: StartupCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    # Retrieve email from current_user
    creator_email = current_user.email
    if not creator_email:
        raise HTTPException(status_code=400, detail="User email required")

    new_startup = models.Startup(
        name=startup.name,
        description=startup.description,
        creator_email=creator_email,
        revenue=startup.revenue,
        burn=startup.burn,
        cash=startup.cash,
        growth=startup.growth,
        team=startup.team,
        runway=startup.runway,
        survival_score=startup.survival_score
    )
    
    db.add(new_startup)
    db.commit()
    db.refresh(new_startup)
    
    return new_startup

@router.get("/my", response_model=List[StartupResponse])
def get_my_startups(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    # Fetch ONLY startups created by this user
    startups = db.query(models.Startup).filter(
        models.Startup.creator_email == current_user.email
    ).order_by(models.Startup.created_at.desc()).all()
    
    return startups
