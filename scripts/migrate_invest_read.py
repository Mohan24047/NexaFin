import sqlite3
import os

DB_PATH = "backend/db/app.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Attempting to add 'is_read' column to 'investment_requests' table...")
        cursor.execute("ALTER TABLE investment_requests ADD COLUMN is_read BOOLEAN DEFAULT 0")
        conn.commit()
        print("Migration successful: Added 'is_read' column.")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("Column 'is_read' already exists. Skipping.")
        else:
            print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
