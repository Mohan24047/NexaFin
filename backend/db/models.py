import uuid
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to user data
    data = relationship("UserData", back_populates="owner", uselist=False)
    portfolio = relationship("UserPortfolio", back_populates="owner", uselist=False)

class UserData(Base):
    __tablename__ = "user_data"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    user_type = Column(String)  # e.g., 'startup', 'investor'
    
    # Financial metrics
    income = Column(Float, default=0.0)
    expenses = Column(Float, default=0.0)
    revenue = Column(Float, default=0.0)
    employees = Column(Integer, default=0)
    budget = Column(Float, default=0.0)
    
    # Extended Job Data
    current_savings = Column(Float, default=0.0)
    risk_tolerance = Column(String, default="moderate") # low, moderate, high
    investment_goal = Column(String, default="wealth_growth") # retirement, wealth_growth, safety
    investment_override = Column(Float, nullable=True) # Deprecated
    investment_amount = Column(Float, nullable=True) # Keeping for legacy/compatibility
    ai_investment_amount = Column(Float, nullable=True)
    monthly_investment = Column(Float, default=0.0) # New persistent field

    # Corporate Treasury fields (startup users)
    cash_balance = Column(Float, default=0.0)
    runway_months = Column(Float, default=0.0)
    debt = Column(Float, default=0.0)
    other_assets = Column(Float, default=0.0)

    # Store user query/market text
    market_text = Column(String, nullable=True)

    # Identity verification
    gst_number = Column(String, nullable=True)      # For startup users (15 char alphanumeric)
    aadhaar_number = Column(String, nullable=True)   # For job users (12 digit)
    
    owner = relationship("User", back_populates="data")

class UserPortfolio(Base):
    __tablename__ = "user_portfolio"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    monthly_investment = Column(Float, default=0.0)
    allocation_json = Column(String) # JSON string of allocation
    created_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="portfolio")

class InvestmentRequest(Base):
    __tablename__ = "investment_requests_v2"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    investor_user_id = Column(String, ForeignKey("users.id"))
    startup_user_id = Column(String, ForeignKey("users.id"))

    startup_id = Column(String) # Can be same as startup_user_id or specific project ID
    startup_name = Column(String, nullable=True) # Checkpoint for history
    startup_owner = Column(String, nullable=True) # The email of the creator, for filtering
    message = Column(String, nullable=True)
    status = Column(String, default="pending") # pending, accepted, rejected
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships (Optional but good for access)
    investor = relationship("User", foreign_keys=[investor_user_id])
    startup_user = relationship("User", foreign_keys=[startup_user_id])

class Startup(Base):
    __tablename__ = "startups"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String)
    description = Column(String, nullable=True)
    creator_email = Column(String, nullable=False) # Critical field
    industry = Column(String, nullable=True)
    
    # Financial Snapshots
    revenue = Column(Float, default=0.0)
    burn = Column(Float, default=0.0)
    cash = Column(Float, default=0.0)
    growth = Column(Float, default=0.0)
    team = Column(Integer, default=0)
    runway = Column(Integer, default=0)
    survival_score = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    receiver_email = Column(String, index=True)
    type = Column(String)  # e.g. "investor_request_accepted"
    message = Column(String)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
