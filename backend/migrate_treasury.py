"""
Migration script: Add treasury columns to user_data table.
Safe to run multiple times — skips columns that already exist.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db", "app.db")

COLUMNS_TO_ADD = [
    ("cash_balance", "REAL DEFAULT 0.0"),
    ("runway_months", "REAL DEFAULT 0.0"),
    ("debt", "REAL DEFAULT 0.0"),
    ("other_assets", "REAL DEFAULT 0.0"),
]

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get existing columns
    cursor.execute("PRAGMA table_info(user_data)")
    existing_cols = {row[1] for row in cursor.fetchall()}
    print(f"Existing columns: {existing_cols}")

    for col_name, col_def in COLUMNS_TO_ADD:
        if col_name in existing_cols:
            print(f"  ✓ Column '{col_name}' already exists — skipping")
        else:
            sql = f"ALTER TABLE user_data ADD COLUMN {col_name} {col_def}"
            cursor.execute(sql)
            print(f"  ✚ Added column '{col_name}'")

    conn.commit()
    conn.close()
    print("\nMigration complete.")

if __name__ == "__main__":
    migrate()
