import sys
import os
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Asegurar que se importen módulos locales de backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import models
import auth
from database import SessionLocal, engine, Base

def seed_database():
    print("=== INITIALIZING & SEEDING GREENLIFE ENTERPRISE DATABASE ===")
    
    # 1. Crear todas las tablas en la base de datos (Postgres/SQLite)
    print("Creando tablas si no existen...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 2. Sembrar Usuarios
        print("\nVerificando usuarios...")
        default_users = [
            {"username": "Geonneitor", "role": "admin", "pin": "123456"},
            {"username": "Merrgato", "role": "admin", "pin": "123456"},
            {"username": "Sergio", "role": "admin", "pin": "123456"}
        ]
        
        for u_data in default_users:
            existing = db.query(models.User).filter(models.User.username == u_data["username"]).first()
            if not existing:
                new_user = models.User(
                    username=u_data["username"],
                    pin_hash=auth.get_password_hash(u_data["pin"]),
                    role=u_data["role"]
                )
                db.add(new_user)
                print(f"Usuario creado: {u_data['username']} (PIN provisional: {u_data['pin']})")
            else:
                print(f"Usuario {u_data['username']} ya existe.")
                
        # 3. Sembrar Servicios
        print("\nVerificando catálogo de servicios...")
        existing_service = db.query(models.Service).first()
        if not existing_service:
            default_services = [
                {
                    "name": "Corte de Césped (Residencial)",
                    "category": "Maintenance",
                    "description": "Corte, orillado y limpieza de soplador para jardines residenciales estándar.",
                    "base_price_usd": 45.0,
                    "base_price_mxn": 850.0
                },
                {
                    "name": "Poda de Arbustos y Setos",
                    "category": "Maintenance",
                    "description": "Poda de mantenimiento para arbustos y setos residenciales.",
                    "base_price_usd": 65.0,
                    "base_price_mxn": 1200.0
                },
                {
                    "name": "Instalación de Mulch (Mantillo)",
                    "category": "Landscaping",
                    "description": "Aplicación de mantillo premium para protección y nutrición de áreas verdes.",
                    "base_price_usd": 120.0,
                    "base_price_mxn": 2200.0
                },
                {
                    "name": "Limpieza de Hojas de Otoño",
                    "category": "Maintenance",
                    "description": "Recolección y retiro de hojas secas estacionales.",
                    "base_price_usd": 150.0,
                    "base_price_mxn": 2800.0
                }
            ]
            for s_data in default_services:
                service = models.Service(**s_data)
                db.add(service)
                print(f"Servicio creado: {service.name}")
        else:
            print("El catálogo de servicios ya tiene datos.")
            
        db.commit()
        print("\nBase de datos inicializada y sembrada con éxito.")
        
    except Exception as e:
        print(f"\nError en el seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
