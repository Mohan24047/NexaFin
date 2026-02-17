from sqlalchemy.orm import Session
from db import database, models

session = database.SessionLocal()

try:
    print("--- Data Integrity Check ---")
    users = session.query(models.User).all()
    user_ids = {u.id for u in users}
    
    print(f"Total Users: {len(users)}")
    
    all_data = session.query(models.UserData).all()
    print(f"Total Data Rows: {len(all_data)}")
    
    orphans = 0
    for data in all_data:
        if data.user_id not in user_ids:
            print(f"ORPHAN DATA FOUND: ID={data.id}, User_ID={data.user_id}")
            orphans += 1
        else:
            # Check consistency
            user = session.query(models.User).get(data.user_id)
            print(f"Valid Link: User {user.email} <-> Data (Income: {data.income})")

    if orphans == 0:
        print("SUCCESS: All data rows are linked to valid users via user_id.")
    else:
        print(f"WARNING: {orphans} orphaned data rows found.")

except Exception as e:
    print(f"Error: {e}")
finally:
    session.close()
