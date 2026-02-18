"""One-time migration: add gst_number and aadhaar_number columns to user_data table."""
import sqlite3, os, glob

DB_FILES = glob.glob("**/*.db", recursive=True)
NEW_COLS = ["gst_number", "aadhaar_number"]

for db_path in DB_FILES:
    print(f"\n=== {db_path} ===")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    if "user_data" not in tables:
        print("  user_data table not found, skipping.")
        conn.close()
        continue

    existing = [row[1] for row in cur.execute("PRAGMA table_info(user_data)").fetchall()]
    print(f"  Existing columns: {existing}")

    for col in NEW_COLS:
        if col in existing:
            print(f"  Column '{col}' already exists, skipping.")
        else:
            cur.execute(f"ALTER TABLE user_data ADD COLUMN {col} TEXT")
            print(f"  Added column '{col}'.")

    conn.commit()
    conn.close()
    print("  Done.")

print("\nMigration complete!")
