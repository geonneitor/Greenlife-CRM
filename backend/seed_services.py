from sqlalchemy.orm import Session
from database import SessionLocal
import models

def seed_services():
    db = SessionLocal()
    try:
        # Check if services already exist
        existing = db.query(models.Service).first()
        if existing:
            print("El catálogo de servicios ya tiene datos.")
            return

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
                "description": "Modelado y poda de mantenimiento para arbustos y cercas vivas.",
                "base_price_usd": 65.0,
                "base_price_mxn": 1200.0
            },
            {
                "name": "Instalación de Mulch (Cama de Mantillo)",
                "category": "Installation",
                "description": "Aplicación de mulch premium para protección y estética de parterres.",
                "base_price_usd": 120.0,
                "base_price_mxn": 2200.0
            },
            {
                "name": "Limpieza de Hojas (Temporada)",
                "category": "Cleanup",
                "description": "Recolección y retiro de hojas secas y escombros estacionales.",
                "base_price_usd": 150.0,
                "base_price_mxn": 2800.0
            }
        ]

        for s_data in default_services:
            service = models.Service(**s_data)
            db.add(service)
            print(f"Servicio creado: {service.name}")

        db.commit()
        print("Catálogo de Greenlife Enterprise inicializado con éxito.")
    except Exception as e:
        print(f"Error en el seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_services()
