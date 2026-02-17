import sqlite3

def check_schema():
    conn = sqlite3.connect('backend/db/app.db')
    cursor = conn.cursor()
    
    print("--- user_data Columns ---")
    cursor.execute("PRAGMA table_info(user_data)")
    columns = cursor.fetchall()
    for col in columns:
        print(col)
        
    conn.close()

if __name__ == "__main__":
    check_schema()
