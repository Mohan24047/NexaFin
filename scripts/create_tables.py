import sys
import os
sys.path.append(os.getcwd())
from backend.db import models, database

def create_tables():
    print("Creating all tables in sql_app.db...")
    models.Base.metadata.create_all(bind=database.engine)
    print("Tables created successfully.")

if __name__ == "__main__":
    create_tables()
