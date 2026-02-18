from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserDataSchema(BaseModel):
    user_type: Optional[str] = None
    income: Optional[float] = None
    expenses: Optional[float] = None
    revenue: Optional[float] = None
    employees: Optional[int] = None
    budget: Optional[float] = None
    market_text: Optional[str] = None
    current_savings: Optional[float] = None
    risk_tolerance: Optional[str] = None
    investment_goal: Optional[str] = None
    investment_override: Optional[float] = None # Deprecated
    investment_amount: Optional[float] = None
    ai_investment_amount: Optional[float] = None
    monthly_investment: Optional[float] = None
    # Corporate Treasury fields
    cash_balance: Optional[float] = None
    runway_months: Optional[float] = None
    debt: Optional[float] = None
    other_assets: Optional[float] = None
    # Identity verification
    gst_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    
    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    data: Optional[UserDataSchema] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserProfileUpdate(BaseModel):
    user_type: Optional[str] = None
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    annual_revenue: Optional[float] = None
    employee_count: Optional[int] = None
    annual_budget: Optional[float] = None
    market_description: Optional[str] = None
    current_savings: Optional[float] = None
    risk_tolerance: Optional[str] = None
    investment_goal: Optional[str] = None
    investment_override: Optional[float] = None # Deprecated
    investment_amount: Optional[float] = None
    ai_investment_amount: Optional[float] = None
    monthly_investment: Optional[float] = None
    # Identity verification
    gst_number: Optional[str] = None
    aadhaar_number: Optional[str] = None

