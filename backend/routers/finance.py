from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import database, models
from ..auth import utils
from ..services import finance_engine
from pydantic import BaseModel

router = APIRouter(
    prefix="/finance",
    tags=["finance"]
)

@router.get("/job-plan")
def get_job_plan(
    current_user: models.User = Depends(utils.get_current_user),
    db: Session = Depends(database.get_db)
):
    # Ensure user has data
    if not current_user.data:
        raise HTTPException(status_code=400, detail="User profile not found. Please complete onboarding.")
    
    user_data = current_user.data
    
    # Check if user is 'job' type
    if user_data.user_type != "job":
        raise HTTPException(status_code=400, detail="Financial plan is only available for Job users.")
    
    plan = finance_engine.generate_job_plan(
        income=user_data.income,
        expenses=user_data.expenses,
        risk_tolerance=user_data.risk_tolerance or "moderate"
    )
    
    return plan


class InvestmentUpdate(BaseModel):
    amount: float

@router.put("/investment")
def update_investment(
    data: InvestmentUpdate,
    current_user: models.User = Depends(utils.get_current_user),
    db: Session = Depends(database.get_db)
):
    if not current_user.data:
        raise HTTPException(status_code=400, detail="User data not found")
    
    # Update logic
    current_user.data.investment_amount = data.amount
    # Ensure AI amount doesn't override this in future logic, 
    # but we keep it for reference or fallback if user clears it (set to 0)
    
    db.commit()
    return {"monthly_investment": current_user.data.investment_amount}

@router.get("/me")
def get_my_finance(
    current_user: models.User = Depends(utils.get_current_user),
    db: Session = Depends(database.get_db)
):
    user_data = current_user.data
    if not user_data:
        raise HTTPException(status_code=400, detail="User data not found")
        
    # Fetch Portfolio Value
    portfolio = db.query(models.UserPortfolio).filter(models.UserPortfolio.user_id == current_user.id).first()
    portfolio_value = portfolio.monthly_investment if portfolio else 0.0
    
    # Calculate Net Worth
    # Net Worth = Savings + Portfolio Value (Simple approximation)
    net_worth = (user_data.current_savings or 0.0) + portfolio_value
    
    # Determine Monthly Investment to return
    # Priority: User Input > AI Calc > 0
    monthly_investment = user_data.monthly_investment
    if monthly_investment is None or monthly_investment <= 0:
         # Fallback to legacy fields if necessary, or just 0
         monthly_investment = user_data.investment_amount or user_data.ai_investment_amount or 0.0

    return {
        "monthly_income": user_data.income,
        "monthly_expenses": user_data.expenses,
        "current_savings": user_data.current_savings or 0.0,
        "portfolio_value": portfolio_value, # This might be total accumulated, distinct from monthly input
        "net_worth": net_worth,
        "monthly_investment": monthly_investment 
    }


# ─── Job User Personal Finance Update ────────────────────────────────

class PersonalFinanceUpdate(BaseModel):
    monthly_income: float
    monthly_expenses: float
    current_savings: float
    monthly_investment: float


@router.put("/personal")
def update_personal_finance(
    payload: PersonalFinanceUpdate,
    current_user: models.User = Depends(utils.get_current_user),
    db: Session = Depends(database.get_db)
):
    fields = payload.dict()
    for key, value in fields.items():
        if value is None or value != value:
            raise HTTPException(status_code=400, detail=f"Invalid value for {key}")
        if value < 0:
            raise HTTPException(status_code=400, detail=f"{key} must be >= 0")

    user_data = current_user.data
    if not user_data:
        user_data = models.UserData(user_id=current_user.id)
        db.add(user_data)
        db.commit()
        db.refresh(current_user)
        user_data = current_user.data

    user_data.income = payload.monthly_income
    user_data.expenses = payload.monthly_expenses
    user_data.current_savings = payload.current_savings
    user_data.monthly_investment = payload.monthly_investment

    db.commit()
    db.refresh(user_data)

    portfolio = db.query(models.UserPortfolio).filter(models.UserPortfolio.user_id == current_user.id).first()
    portfolio_value = portfolio.monthly_investment if portfolio else 0.0
    net_worth = (user_data.current_savings or 0.0) + portfolio_value

    return {
        "success": True,
        "data": {
            "monthly_income": user_data.income,
            "monthly_expenses": user_data.expenses,
            "current_savings": user_data.current_savings,
            "monthly_investment": user_data.monthly_investment,
            "portfolio_value": portfolio_value,
            "net_worth": net_worth,
        }
    }


# ─── Corporate Treasury Endpoints ────────────────────────────────────

class TreasuryUpdate(BaseModel):
    cash_balance: float
    annual_revenue: float
    monthly_expenses: float
    debt: float
    other_assets: float


@router.get("/treasury")
def get_treasury(
    current_user: models.User = Depends(utils.get_current_user),
    db: Session = Depends(database.get_db)
):
    user_data = current_user.data
    if not user_data:
        raise HTTPException(status_code=400, detail="User data not found")

    return {
        "cash_balance": user_data.cash_balance or 0.0,
        "annual_revenue": user_data.revenue or 0.0,
        "monthly_expenses": user_data.expenses or 0.0,
        "debt": user_data.debt or 0.0,
        "other_assets": user_data.other_assets or 0.0,
    }


@router.put("/treasury")
def update_treasury(
    payload: TreasuryUpdate,
    current_user: models.User = Depends(utils.get_current_user),
    db: Session = Depends(database.get_db)
):
    # Validation: all values must be >= 0
    fields = payload.dict()
    for key, value in fields.items():
        if value is None or value != value:  # NaN check: NaN != NaN
            raise HTTPException(status_code=400, detail=f"Invalid value for {key}")
        if value < 0:
            raise HTTPException(status_code=400, detail=f"{key} must be >= 0")

    user_data = current_user.data
    if not user_data:
        # Auto-create user data row (upsert)
        user_data = models.UserData(user_id=current_user.id)
        db.add(user_data)
        db.commit()
        db.refresh(current_user)
        user_data = current_user.data

    user_data.cash_balance = payload.cash_balance
    user_data.revenue = payload.annual_revenue
    user_data.expenses = payload.monthly_expenses
    user_data.debt = payload.debt
    user_data.other_assets = payload.other_assets

    db.commit()
    db.refresh(user_data)

    return {
        "success": True,
        "data": {
            "cash_balance": user_data.cash_balance,
            "annual_revenue": user_data.revenue,
            "monthly_expenses": user_data.expenses,
            "debt": user_data.debt,
            "other_assets": user_data.other_assets,
        }
    }

