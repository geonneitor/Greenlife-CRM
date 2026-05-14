from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
import models, schemas
from database import get_db

router = APIRouter()

@router.post("", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    # Create the project
    db_project = models.Project(
        client_id=project.client_id,
        title=project.title,
        description=project.description,
        status=project.status,
        total_quoted_usd=project.total_quoted_usd,
        total_quoted_mxn=project.total_quoted_mxn,
        start_date=project.start_date,
        end_date=project.end_date
    )
    db.add(db_project)
    db.flush() # Get project ID

    # Add items
    for item in project.items:
        db_item = models.ProjectItem(
            project_id=db_project.id,
            service_id=item.service_id,
            quantity=item.quantity,
            price_at_quote_usd=item.price_at_quote_usd,
            price_at_quote_mxn=item.price_at_quote_mxn,
            notes=item.notes
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("", response_model=List[schemas.Project])
def read_projects(skip: int = 0, limit: int = 100, status: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Project).options(
        joinedload(models.Project.client),
        joinedload(models.Project.items).joinedload(models.ProjectItem.service)
    )
    if status:
        query = query.filter(models.Project.status == status)
    projects = query.order_by(models.Project.created_at.desc()).offset(skip).limit(limit).all()
    return projects

@router.get("/{project_id}", response_model=schemas.Project)
def read_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}", response_model=schemas.Project)
def update_project_status(project_id: int, status_update: str, db: Session = Depends(get_db)):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    db_project.status = status_update
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/{project_id}/financials")
def get_project_financials(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    total_payments = sum([float(p.amount) for p in project.payments])
    total_expenses = sum([float(e.amount) for e in project.expenses])
    profit = total_payments - total_expenses
    
    margin = 0.0
    if total_payments > 0:
        margin = (profit / total_payments) * 100
        
    return {
        "project_id": project.id,
        "total_quoted_usd": float(project.total_quoted_usd),
        "total_payments_usd": total_payments,
        "total_expenses_usd": total_expenses,
        "profit_usd": profit,
        "margin_percentage": margin
    }
