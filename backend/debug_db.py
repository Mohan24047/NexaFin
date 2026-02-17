from sqlalchemy.orm import Session
from db import database, models
import sys

# Create session
session = database.SessionLocal()

try:
    print("--- User Data Inspection ---")
    users = session.query(models.User).all()
    for user in users:
        print(f"User: {user.email}")
        if user.data:
            print(f"  Type: {user.data.user_type}")
            print(f"  Income: {user.data.income}")
            print(f"  Expenses: {user.data.expenses}")
            print(f"  Risk: {user.data.risk_tolerance}")
            print(f"  Savings: {user.data.current_savings}")
        else:
            print("  No Data Linked")
    print("----------------------------")
except Exception as e:
    print(f"Error: {e}")
finally:
    session.close()
