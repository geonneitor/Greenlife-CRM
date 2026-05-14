from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

router = APIRouter()

@router.post("", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    db_payment = models.Payment(**payment.model_dump())
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

@router.get("/project/{project_id}", response_model=List[schemas.Payment])
def read_project_payments(project_id: int, db: Session = Depends(get_db)):
    payments = db.query(models.Payment).filter(models.Payment.project_id == project_id).all()
    return payments

@router.get("", response_model=List[schemas.Payment])
def read_all_payments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    payments = db.query(models.Payment).order_by(models.Payment.timestamp.desc()).offset(skip).limit(limit).all()
    return payments
