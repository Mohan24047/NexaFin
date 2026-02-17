import sqlite3

def update_schema():
    db_path = 'backend/db/app.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    columns_to_add = [
        ("investment_override", "FLOAT"),
        ("investment_amount", "FLOAT"),
        ("ai_investment_amount", "FLOAT"),
        ("monthly_investment", "FLOAT DEFAULT 0.0")
    ]
    
    print(f"Connecting to {db_path}...")
    
    for col_name, col_type in columns_to_add:
        try:
            print(f"Adding column {col_name}...")
            cursor.execute(f"ALTER TABLE user_data ADD COLUMN {col_name} {col_type}")
            print(f"Successfully added {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding {col_name}: {e}")
                
    conn.commit()
    conn.close()
    print("Schema update complete.")

if __name__ == "__main__":
    update_schema()
