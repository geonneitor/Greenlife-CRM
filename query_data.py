import sqlite3
import os

db_path = "smokerings.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        print("--- PRODUCTS ---")
        cursor.execute("SELECT * FROM products")
        for row in cursor.fetchall():
            print(row)
        
        print("\n--- SUPPLIERS ---")
        cursor.execute("SELECT * FROM suppliers")
        for row in cursor.fetchall():
            print(row)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
else:
    print("DB not found")
