import sqlite3

def fix_db():
    conn = sqlite3.connect('smokerings.db')
    cursor = conn.cursor()
    
    # Check current columns
    cursor.execute("PRAGMA table_info(products)")
    columns = [col[1] for col in cursor.fetchall()]
    print(f"Current columns: {columns}")
    
    new_cols = [
        ('price_retail', 'FLOAT DEFAULT 0.0'),
        ('price_1g', 'FLOAT DEFAULT 0.0'),
        ('price_14g', 'FLOAT DEFAULT 0.0'),
        ('price_28g', 'FLOAT DEFAULT 0.0'),
        ('cost_1g', 'FLOAT DEFAULT 0.0'),
        ('cost_14g', 'FLOAT DEFAULT 0.0'),
        ('cost_28g', 'FLOAT DEFAULT 0.0'),
        ('price_3pack', 'FLOAT DEFAULT 0.0'),
        ('cost_3pack', 'FLOAT DEFAULT 0.0'),
        ('is_cannabis_type', 'BOOLEAN DEFAULT 0'),
        ('is_bulk', 'BOOLEAN DEFAULT 0'),
        ('image_filename', 'VARCHAR(256)'),
        ('restock_alert', 'FLOAT DEFAULT 5.0')
    ]
    
    for col_name, col_type in new_cols:
        if col_name not in columns:
            print(f"Adding column: {col_name}...")
            try:
                cursor.execute(f"ALTER TABLE products ADD COLUMN {col_name} {col_type}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
    
    # Special: Rename 'price' to 'price_retail' if 'price_retail' is missing but 'price' exists
    # But I already handled adding 'price_retail' if missing.
    
    conn.commit()
    conn.close()
    print("Database fix complete!")

if __name__ == "__main__":
    fix_db()
