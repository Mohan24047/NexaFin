from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from ..db import database, models
from ..auth import schemas, utils
from ..services import portfolio_engine, recommendation_engine

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    try:
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = utils.get_password_hash(user.password)
        new_user = models.User(
            email=user.email,
            password_hash=hashed_password
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Initialize empty user data
        user_data = models.UserData(user_id=new_user.id)
        db.add(user_data)
        db.commit()
        
        return new_user
    except Exception as e:
        print(f"SIGNUP ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Signup Failed: {str(e)}")

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not utils.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email
    }

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(utils.get_current_user)):
    return current_user

@router.put("/profile", response_model=schemas.UserResponse)
def update_profile(
    profile_data: schemas.UserProfileUpdate,
    current_user: models.User = Depends(utils.get_current_user),
    db: Session = Depends(database.get_db)
):
    # Ensure user_data exists
    if not current_user.data:
        user_data = models.UserData(user_id=current_user.id)
        db.add(user_data)
        db.commit()
        db.refresh(current_user)

    # Update fields
    user_data = current_user.data
    print(f"DEBUG: Input profile_data: {profile_data.dict(exclude_unset=True)}")
    print(f"DEBUG: Before update - Budget: {user_data.budget}, Revenue: {user_data.revenue}")
    
    for key, value in profile_data.dict(exclude_unset=True).items():
        if key == 'market_description':
             user_data.market_text = value
        elif key == 'monthly_income':
             user_data.income = value
        elif key == 'monthly_expenses':
             user_data.expenses = value
        elif key == 'annual_revenue':
             user_data.revenue = value
        elif key == 'employee_count':
             user_data.employees = value
        elif key == 'annual_budget':
             user_data.budget = value
        elif key == 'investment_override':
             pass # details below, we prefer the new fields
        elif key == 'investment_amount':
             pass # Use monthly_investment
        elif key == 'ai_investment_amount':
             user_data.ai_investment_amount = value
        elif key == 'monthly_investment':
             user_data.monthly_investment = value
        else:
             setattr(user_data, key, value)
    
    print(f"DEBUG: After update - Budget: {user_data.budget}, Revenue: {user_data.revenue}, Monthly Inv: {user_data.monthly_investment}")
    
    db.commit()
    db.refresh(user_data)
    
    # --- AUTO-GENERATE PORTFOLIO ---
    if user_data.user_type == 'job':
        # Determine Final Investment Amount
        # 1. User Override (monthly_investment)
        # 2. AI Calculation (passed from frontend OR stored previously)
        
        final_investment = 0.0
        
        if user_data.monthly_investment is not None and user_data.monthly_investment > 0:
            final_investment = user_data.monthly_investment
            print(f"DEBUG: Using USER SET monthly_investment: {final_investment}")
        elif user_data.ai_investment_amount is not None:
             final_investment = user_data.ai_investment_amount
             print(f"DEBUG: Using AI GENERATED investment amount: {final_investment}")
        
        # Fallback if both are missing (e.g. legacy data)
        if final_investment <= 0 and user_data.income > 0:
             try:
                recs = recommendation_engine.generate_recommendations(user_data)
                final_investment = recs.get("recommended_investment", 0)
                # Save this as AI amount for consistency?
                user_data.ai_investment_amount = final_investment
                db.commit() 
                print(f"DEBUG: Calculated Fallback AI investment: {final_investment}")
             except:
                pass

        if final_investment > 0:
            try:
                # 2. Generate allocation
                allocation_json = portfolio_engine.generate_portfolio(final_investment, user_data.risk_tolerance)
                
                # 3. Save/Update Portfolio
                existing_portfolio = db.query(models.UserPortfolio).filter(models.UserPortfolio.user_id == current_user.id).first()
                if existing_portfolio:
                    existing_portfolio.monthly_investment = final_investment
                    existing_portfolio.allocation_json = allocation_json
                else:
                    new_portfolio = models.UserPortfolio(
                        user_id=current_user.id,
                        monthly_investment=final_investment,
                        allocation_json=allocation_json
                    )
                    db.add(new_portfolio)
                db.commit()
                print(f"DEBUG: Auto-generated portfolio for {current_user.email} with amount ${final_investment}")
            except Exception as e:
                print(f"ERROR generating portfolio: {e}")

    # --- AUTO-GENERATE STARTUP PORTFOLIO ---
    elif user_data.user_type == 'startup' and user_data.budget > 0:
        try:
            # Investment Capital = 30% of Annual Budget (as per requirement)
            invest_amount = user_data.budget * 0.3
            
            # Generate Startup Allocation
            allocation_json = portfolio_engine.generate_portfolio(invest_amount, "high", user_type='startup')
            
            # Save/Update
            existing_portfolio = db.query(models.UserPortfolio).filter(models.UserPortfolio.user_id == current_user.id).first()
            if existing_portfolio:
                existing_portfolio.monthly_investment = invest_amount
                existing_portfolio.allocation_json = allocation_json
            else:
                new_portfolio = models.UserPortfolio(
                    user_id=current_user.id,
                    monthly_investment=invest_amount,
                    allocation_json=allocation_json
                )
                db.add(new_portfolio)
            db.commit()
            print(f"DEBUG: Auto-generated STARTUP portfolio for {current_user.email}")
        except Exception as e:
            print(f"ERROR generating startup portfolio: {e}")

    return current_user

@router.put("/update-investment")
def update_investment(data: dict, current_user: models.User = Depends(utils.get_current_user), db: Session = Depends(database.get_db)):
    amount = data.get("monthly_investment")

    user_data = db.query(models.UserData).filter(models.UserData.user_id == current_user.id).first()

    if not user_data:
        raise HTTPException(status_code=404, detail="Profile not found")

    user_data.monthly_investment = amount
    db.commit()
    db.refresh(user_data)
    
    # Also update the portfolio if it exists so they match
    existing_portfolio = db.query(models.UserPortfolio).filter(models.UserPortfolio.user_id == current_user.id).first()
    if existing_portfolio:
         existing_portfolio.monthly_investment = amount
         db.commit()

    return {"success": True, "monthly_investment": user_data.monthly_investment}
