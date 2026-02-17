
import sqlite3
import os

# Path to your SQLite DB
DB_PATH = "nexa_fin.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Attempting to add 'monthly_investment' column to 'user_data' table...")
        cursor.execute("ALTER TABLE user_data ADD COLUMN monthly_investment FLOAT DEFAULT 0.0")
        conn.commit()
        print("Migration successful: 'monthly_investment' column added.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column 'monthly_investment' already exists. Skipping.")
        else:
            print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
