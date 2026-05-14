import sqlite3

def setup_demo_data():
    conn = sqlite3.connect('smokerings.db')
    cursor = conn.cursor()
    
    # 1. Add Flower Product
    cursor.execute("""
        INSERT OR REPLACE INTO products (id, name, category, price_retail, cost_supplier, price_1g, is_cannabis_type, unit_type)
        VALUES (1, 'Super Lemon Haze', 'Flor', 50.0, 25.0, 50.0, 1, 'weight')
    """)
    
    # 2. Add Stock for User 1 (Geonneitor)
    cursor.execute("SELECT id FROM users WHERE username = 'Geonneitor'")
    user = cursor.fetchone()
    user_id = user[0] if user else 1
    
    cursor.execute("INSERT OR REPLACE INTO user_stocks (user_id, product_id, quantity) VALUES (?, 1, 100.0)", (user_id,))
    
    conn.commit()
    conn.close()
    print("Demo product 'Super Lemon Haze' at $50/g added with 100g stock.")

if __name__ == "__main__":
    setup_demo_data()
