import sqlite3

def add_missing_indexes():
    conn = sqlite3.connect('greenlife.db')
    cursor = conn.cursor()
    
    print("Adding missing indexes manually...")
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_projects_created_at ON projects(created_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_projects_status ON projects(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_projects_manager_id ON projects(manager_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_payments_timestamp ON payments(timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_expenses_category ON expenses(category)")
        conn.commit()
        print("Success: Indexes added.")
    except Exception as e:
        print(f"Error adding indexes: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_missing_indexes()
