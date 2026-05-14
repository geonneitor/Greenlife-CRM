import os
import sys
import time
import sqlite3
from datetime import datetime, timedelta

# Añadir el directorio actual al path para importar modelos locales
sys.path.append(os.path.join(os.getcwd(), "backend"))

import models
from database import engine, SessionLocal, get_db, Base
from sqlalchemy import func, text

def check_wal_mode():
    conn = sqlite3.connect('greenlife.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode")
    mode = cursor.fetchone()[0]
    print(f"Current journal mode: {mode}")
    conn.close()
    return mode == "wal"

def check_indexes():
    conn = sqlite3.connect('greenlife.db')
    cursor = conn.cursor()
    
    print("\nAll Indexes in database:")
    cursor.execute("SELECT name, tbl_name FROM sqlite_master WHERE type='index';")
    indexes = cursor.fetchall()
    for idx in indexes:
        print(f"  - {idx[0]} (on {idx[1]})")
    conn.close()

def test_dashboard_query_efficiency():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        start_date = now - timedelta(days=7)
        
        print("\n--- Testing Optimized Dashboard Query ---")
        start_time = time.time()
        
        # Consolidation of counts and sums
        project_query = db.query(models.Project).filter(models.Project.created_at >= start_date)
        stats = project_query.with_entities(
            func.sum(models.Project.total_quoted_usd).label("sum_usd"),
            func.sum(models.Project.total_quoted_mxn).label("sum_mxn"),
            func.count(models.Project.id).label("count_total")
        ).first()
        
        # Payment sums (Fixed logic)
        paid_usd = db.query(func.sum(models.Payment.amount)).filter(
            models.Payment.timestamp >= start_date,
            models.Payment.currency == 'USD'
        ).scalar() or 0
        
        end_time = time.time()
        
        print(f"Projects found in last 7 days: {stats.count_total}")
        print(f"Total Quoted USD: {stats.sum_usd or 0}")
        print(f"Total Paid USD: {paid_usd}")
        print(f"Execution time: {end_time - start_time:.6f} segundos")
        
    finally:
        db.close()

if __name__ == "__main__":
    print("=== PERFORMANCE & INTEGRITY TEST ===")
    
    # Ensure tables and indexes are created
    print("Creating tables and indexes...")
    models.Base.metadata.create_all(bind=engine)
    
    # Explicitly set WAL mode to ensure it sticks
    with engine.connect() as conn:
        conn.execute(text("PRAGMA journal_mode=WAL"))
        conn.commit()
    
    wal_ok = check_wal_mode()
    check_indexes()
    test_dashboard_query_efficiency()
    
    if wal_ok:
        print("\nSUCCESS: WAL mode is active.")
    else:
        print("\nWARNING: WAL mode is not active. Check database.py events.")
