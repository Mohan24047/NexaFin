from sqlalchemy.orm import Session
from db import database, models
import sys

# Create session
session = database.SessionLocal()

try:
    print("--- Check Specific User 'startup13@gmail.com' ---")
    my_startup = session.query(models.Startup).filter(models.Startup.creator_email == "startup13@gmail.com").first()
    if my_startup:
        print(f"FOUND STARTUP for startup13@gmail.com:")
        print(f"  Name: {my_startup.name}")
        print(f"  ID: {my_startup.id}")
    else:
        print("NO STARTUP FOUND for startup13@gmail.com")

    target_email = "startup13@gmail.com"
    print(f"\n--- Checking Requests WHERE Startup Owner = {target_email} ---")
    owner_requests = session.query(models.InvestmentRequest).filter(models.InvestmentRequest.startup_owner == target_email).all()
    if owner_requests:
        for r in owner_requests:
             print(f"FOUND (Owner): ID={r.id}, StartupID={r.startup_id}, Status={r.status}")
    else:
        print(f"NO REQUESTS found where owner is {target_email}")

    print(f"\n--- Checking Requests WHERE Investor = {target_email} ---")
    # need user ID for investor check
    user = session.query(models.User).filter(models.User.email == target_email).first()
    if user:
        inv_requests = session.query(models.InvestmentRequest).filter(models.InvestmentRequest.investor_user_id == user.id).all()
        if inv_requests:
            for r in inv_requests:
                print(f"FOUND (Investor): ID={r.id}, Startup={r.startup_name}, Status={r.status}")
        else:
             print("NO REQUESTS sent by this user.")
    
    target_id_from_frontend = "b6eb00cc-c25d-44bc-a7f0-0c4848d256c8"
    print(f"\n--- Checking Requests for Frontend ID: {target_id_from_frontend} ---")
    requests = session.query(models.InvestmentRequest).filter(models.InvestmentRequest.startup_id == target_id_from_frontend).all()
    if requests:
        for r in requests:
             print(f"FOUND: ID={r.id}")
             print(f"  Startup Name: {r.startup_name}")
             print(f"  Startup Owner: {r.startup_owner}")
             print(f"  Investor ID: {r.investor_user_id}")
             print(f"  Status: {r.status}")
    else:
        print(f"NO REQUESTS found for ID {target_id_from_frontend}")

    # Also check what this ID belongs to
    print(f"\n--- Identifying ID {target_id_from_frontend} ---")
    s = session.query(models.Startup).filter(models.Startup.id == target_id_from_frontend).first()
    if s: print(f"It is a STARTUP: {s.name}, Owner: {s.creator_email}")
    
    u = session.query(models.User).filter(models.User.id == target_id_from_frontend).first()
    if u: print(f"It is a USER: {u.email}")
    
    print("\n--- ABSOLUTE LAST REQUEST ---")
    last_req = session.query(models.InvestmentRequest).order_by(models.InvestmentRequest.created_at.desc()).first()
except Exception as e:
    print(f"Error: {e}")
finally:
    session.close()
