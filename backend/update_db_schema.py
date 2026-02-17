from db.database import engine
from db.models import Base

print("--- Updating Database Schema ---")
Base.metadata.create_all(bind=engine)
print("--- Schema Updated Successfully ---")
