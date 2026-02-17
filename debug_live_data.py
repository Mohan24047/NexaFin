
from backend.db import database, models
from sqlalchemy.orm import Session
from sqlalchemy import text


def log(msg):
    with open("live_dump.log", "a") as f:
        f.write(msg + "\n")
    print(msg)

def debug_data():
    with open("live_dump.log", "w") as f:
        f.write("--- Live Data Dump ---\n")

    db = Session(bind=database.engine)
    
    log("--- 1. Latest 5 Startups ---")
    startups = db.query(models.Startup).order_by(models.Startup.id.desc()).limit(5).all()
    for s in startups:
        log(f"Startup: '{s.name}' (ID: {s.id})")
        log(f"   -> Owner Email: {s.creator_email}")
        
    log("\n--- 2. Latest 5 Requests (V2) ---")
    try:
        requests = db.query(models.InvestmentRequest).order_by(models.InvestmentRequest.created_at.desc()).limit(5).all()
        if not requests:
            log("NO REQUESTS FOUND in v2 table.")
        for r in requests:
            log(f"Request: '{r.message}'")
            log(f"   -> Startup: '{r.startup_name}' (ID: {r.startup_id})")
            log(f"   -> Assigned Owner: {r.startup_owner}")
            log(f"   -> Status: {r.status}")
    except Exception as e:
        log(f"Error querying requests: {e}")

if __name__ == "__main__":
    debug_data()

