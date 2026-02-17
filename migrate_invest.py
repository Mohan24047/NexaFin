import sqlite3

def migrate_investment_requests():
    db_path = 'backend/db/app.db'
    print(f"Connecting to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create table if not exists
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS investment_requests (
        id VARCHAR PRIMARY KEY,
        investor_user_id VARCHAR,
        startup_user_id VARCHAR,
        startup_id VARCHAR,
        message VARCHAR,
        status VARCHAR DEFAULT 'pending',
        created_at DATETIME,
        FOREIGN KEY(investor_user_id) REFERENCES users(id),
        FOREIGN KEY(startup_user_id) REFERENCES users(id)
    );
    """
    
    try:
        print("Creating investment_requests table...")
        cursor.execute(create_table_sql)
        print("Table created successfully.")
    except Exception as e:
        print(f"Error creating table: {e}")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate_investment_requests()
