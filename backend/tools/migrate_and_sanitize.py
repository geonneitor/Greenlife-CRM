import sqlite3
import os
import shutil

def run():
    # 1. Paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    root_db = os.path.join(base_dir, "smokerings.db")
    bak_db = os.path.join(base_dir, "backend", "smokerings.db")
    
    print(f"Root DB: {root_db}")
    print(f"Backup/Old DB: {bak_db}")
    
    # 2. If root DB is empty but backend DB has data, copy it
    if os.path.exists(bak_db) and (not os.path.exists(root_db) or os.path.getsize(root_db) < 1024):
        print("Copying data from backend/smokerings.db to root...")
        shutil.copy2(bak_db, root_db)
    
    # 3. Sanitize root DB
    conn = sqlite3.connect(root_db)
    cursor = conn.cursor()
    
    # Ensure products table exists before sanitizing
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='products'")
    if not cursor.fetchone():
        print("Products table not found in root DB. Let's wait for server initialization or force it.")
        # We'll just print a warning. The user should run the server once.
        return

    columns = [
        ('price_1g', '0.0'), ('price_14g', '0.0'), ('price_28g', '0.0'),
        ('cost_1g', '0.0'), ('cost_14g', '0.0'), ('cost_28g', '0.0'),
        ('price_3pack', '0.0'), ('cost_3pack', '0.0'),
        ('is_cannabis_type', '0'), ('is_bulk', '0'), ('restock_alert', '5.0')
    ]
    
    for col, default in columns:
        cursor.execute(f"UPDATE products SET {col} = {default} WHERE {col} IS NULL")
        if cursor.rowcount > 0:
            print(f"Updated {cursor.rowcount} rows in {col}")
            
    conn.commit()
    conn.close()
    print("Sanitization of Root DB complete.")

if __name__ == "__main__":
    run()
