from sqlalchemy.orm import Session
from db import database, models

# Create session
session = database.SessionLocal()

try:
    print("--- Populating Test Data ---")
    # Update all users to have some data for testing
    users = session.query(models.User).all()
    for user in users:
        print(f"Updating User: {user.email}")
        if not user.data:
             user.data = models.UserData(user_id=user.id)
        
        # Set test values for Job profile
        user.data.income = 6000.0
        user.data.expenses = 2500.0
        user.data.risk_tolerance = 'moderate'
        user.data.current_savings = 12000.0
        
        # Determine disposable
        disposable = 6000.0 - 2500.0
        print(f"  Set Income=6000, Expenses=2500, Disposable={disposable}")
        
    session.commit()
    print("--- Update Complete ---")
except Exception as e:
    print(f"Error: {e}")
    session.rollback()
finally:
    session.close()
