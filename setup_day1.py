import sqlite3
import os
from decimal import Decimal

db_path = "smokerings.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # 1. Create Supplier
    cursor.execute("INSERT INTO suppliers (name, contact_info) VALUES (?, ?)", ("Smoke Kings Global", "contact@smokekings.com"))
    supplier_id = cursor.lastrowid
    print(f"Created supplier ID: {supplier_id}")

    # 2. Update Product with Supplier ID
    cursor.execute("UPDATE products SET supplier_id = ? WHERE id = 2", (supplier_id,))
    print("Updated product 2 with supplier ID")

    # 3. Add stock to Geonneitor (User ID 1) for Product ID 2
    # Check if entry exists
    cursor.execute("SELECT id FROM user_stocks WHERE user_id = 1 AND product_id = 2")
    row = cursor.fetchone()
    if row:
        cursor.execute("UPDATE user_stocks SET quantity = quantity + 100 WHERE id = ?", (row[0],))
    else:
        cursor.execute("INSERT INTO user_stocks (user_id, product_id, quantity) VALUES (1, 2, 100)")
    print("Added 100 units of Flor Cali Gold to Geonneitor")

    conn.commit()
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
