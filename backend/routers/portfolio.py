from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import database, models
from ..auth import utils, schemas
import json

router = APIRouter(
    prefix="/portfolio",
    tags=["Portfolio"]
)

@router.get("/me")
def get_my_portfolio(
    current_user: models.User = Depends(utils.get_current_user),
    db: Session = Depends(database.get_db)
):
    portfolio = db.query(models.UserPortfolio).filter(models.UserPortfolio.user_id == current_user.id).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
        
    return {
        "monthly_investment": portfolio.monthly_investment,
        "allocation": json.loads(portfolio.allocation_json)
    }

class PortfolioGenerate(schemas.BaseModel):
    amount: float

@router.post("/generate")
def generate_portfolio_endpoint(
    data: PortfolioGenerate,
    current_user: models.User = Depends(utils.get_current_user),
    db: Session = Depends(database.get_db)
):
    from services import portfolio_engine
    
    # Fetch risk tolerance from DB
    if not current_user.data:
         raise HTTPException(status_code=400, detail="User profile not completed")
         
    risk_tolerance = current_user.data.risk_tolerance or "moderate"
    user_type = current_user.data.user_type or "job"
    
    # Generate new allocation
    allocation_json = portfolio_engine.generate_portfolio(data.amount, risk_tolerance, user_type)
    
    # Check if exists
    portfolio = db.query(models.UserPortfolio).filter(models.UserPortfolio.user_id == current_user.id).first()
    
    if portfolio:
        portfolio.monthly_investment = data.amount
        portfolio.allocation_json = allocation_json
    else:
        portfolio = models.UserPortfolio(
            user_id=current_user.id,
            monthly_investment=data.amount,
            allocation_json=allocation_json
        )
        db.add(portfolio)
        
    db.commit()
    db.refresh(portfolio)
    
    return {"message": "Portfolio generated successfully", "allocation": json.loads(allocation_json)}
