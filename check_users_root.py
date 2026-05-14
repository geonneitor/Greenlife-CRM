import sqlite3
import os

db_path = "smokerings.db" # Root DB
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, username, role FROM users")
        users = cursor.fetchall()
        print("Users found:")
        for user in users:
            print(f"ID: {user[0]}, Username: {user[1]}, Role: {user[2]}")
    except Exception as e:
        print(f"Error querying users: {e}")
    finally:
        conn.close()
else:
    print(f"Database not found at {db_path}")
