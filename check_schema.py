import sqlite3

def check_schema():
    conn = sqlite3.connect('greenlife.db')
    cursor = conn.cursor()
    
    tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
    for table_name in tables:
        print(f"\nTable: {table_name[0]}")
        columns = cursor.execute(f"PRAGMA table_info({table_name[0]})").fetchall()
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
            
    conn.close()

if __name__ == "__main__":
    check_schema()
