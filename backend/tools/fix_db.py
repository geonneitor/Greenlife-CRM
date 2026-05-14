import sqlite3
import os

DB_PATH = 'smokerings.db'

def fix_database():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if 'pin_hash' column exists in 'users' table
    cursor.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'pin_hash' not in columns:
        print("Adding 'pin_hash' column to 'users' table...")
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN pin_hash VARCHAR(128)")
            conn.commit()
            print("Column 'pin_hash' added successfully.")
        except Exception as e:
            print(f"Error adding column: {e}")
    else:
        print("'pin_hash' column already exists.")

    # Optional: Initialize admin users if needed (though main.py also does this)
    # But since main.py might fail due to other things, let's ensure they exist.
    conn.close()

if __name__ == "__main__":
    fix_database()
