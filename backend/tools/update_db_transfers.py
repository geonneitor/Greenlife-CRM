import sqlite3

def update_db():
    conn = sqlite3.connect('smokerings.db')
    cursor = conn.cursor()
    
    print("Creating transfers table...")

    # SQLite fix: "INTEGER PRIMARY KEY" is automatically autoincrement
    cursor.execute("DROP TABLE IF EXISTS transfers")
    cursor.execute("""
        CREATE TABLE transfers (
            id INTEGER PRIMARY KEY,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sender_id) REFERENCES users(id),
            FOREIGN KEY(receiver_id) REFERENCES users(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        )
    """)
    
    conn.commit()
    conn.close()
    print("Table 'transfers' created successfully.")

if __name__ == "__main__":
    update_db()
