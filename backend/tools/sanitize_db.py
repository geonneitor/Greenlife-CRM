import sqlite3
import os

def sanitize_db():
    # Target the root database file
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "smokerings.db")
    print(f"Connecting to: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # List of new columns that might have NULLs
    columns = [
        ('price_1g', '0.0'),
        ('price_14g', '0.0'),
        ('price_28g', '0.0'),
        ('cost_1g', '0.0'),
        ('cost_14g', '0.0'),
        ('cost_28g', '0.0'),
        ('price_3pack', '0.0'),
        ('cost_3pack', '0.0'),
        ('is_cannabis_type', '0'),
        ('is_bulk', '0'),
        ('restock_alert', '5.0')
    ]
    
    print("Sanitizing products table...")
    for col, default in columns:
        try:
            cursor.execute(f"UPDATE products SET {col} = {default} WHERE {col} IS NULL")
            if cursor.rowcount > 0:
                print(f"Updated {cursor.rowcount} rows for column: {col}")
        except Exception as e:
            print(f"Error updating {col}: {e}")
            
    conn.commit()
    conn.close()
    print("Sanitization complete!")

if __name__ == "__main__":
    sanitize_db()
