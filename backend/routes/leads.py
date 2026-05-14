from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, auth, notifications, deps
from database import get_db

router = APIRouter()

# ✅ Endpoint Público: Crear solicitud de cotización desde la web
@router.post("/public/quote-request", response_model=schemas.Lead)
def create_quote_request(lead: schemas.LeadCreate, db: Session = Depends(get_db)):
    """Recibe prospectos desde el sitio web greenlifeenterprisellc.com"""
    db_lead = models.Lead(**lead.model_dump())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    
    # Enviar correo de confirmación al cliente
    notifications.send_quote_confirmation(db_lead.email, db_lead.name)
    
    return db_lead

# ✅ Endpoints Protegidos (Gestión interna)

@router.get("/", response_model=List[schemas.Lead])
def list_leads(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(deps.get_current_user)
):
    return db.query(models.Lead).order_by(models.Lead.created_at.desc()).all()

@router.patch("/{lead_id}", response_model=schemas.Lead)
def update_lead(lead_id: int, lead_data: schemas.LeadUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    db_lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    
    for key, value in lead_data.model_dump(exclude_unset=True).items():
        setattr(db_lead, key, value)
    
    db.commit()
    db.refresh(db_lead)
    return db_lead

@router.post("/{lead_id}/convert", response_model=schemas.Project)
def convert_lead_to_project(lead_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    """Convierte un lead en un Cliente y un Proyecto (Estimate) real"""
    db_lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    
    # 1. Crear Cliente
    name_parts = db_lead.name.split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    
    db_client = models.Client(
        first_name=first_name,
        last_name=last_name,
        email=db_lead.email,
        phone=db_lead.phone,
        notes=f"Convertido desde Lead ID: {db_lead.id}. Mensaje original: {db_lead.message}"
    )
    db.add(db_client)
    db.flush()
    
    # 2. Crear Proyecto
    db_project = models.Project(
        client_id=db_client.id,
        title=f"Proyecto: {db_lead.service_type or 'General Landscaping'}",
        description=db_lead.message,
        status="Estimate"
    )
    db.add(db_project)
    
    # 3. Marcar Lead como convertido
    db_lead.status = "Converted"
    
    db.commit()
    db.refresh(db_project)
    return db_project
