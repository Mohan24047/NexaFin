from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import database, models
from ..auth import utils
from ..services import recommendation_engine

router = APIRouter(
    prefix="/recommendations",
    tags=["recommendations"]
)

@router.get("/job")
def get_job_recommendations(
    current_user: models.User = Depends(utils.get_current_user),
    db: Session = Depends(database.get_db)
):
    # Ensure user has data
    if not current_user.data:
        raise HTTPException(status_code=404, detail="User profile data not found")
        
    # Check user type
    if current_user.data.user_type != 'job':
        raise HTTPException(status_code=400, detail="Recommendations available for job users only")

    # Generate recommendations
    recommendations = recommendation_engine.generate_recommendations(current_user.data)
    
    return recommendations
