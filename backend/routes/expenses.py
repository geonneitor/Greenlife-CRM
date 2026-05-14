from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, utils
from database import get_db
from deps import get_current_user

router = APIRouter(tags=["expenses"])

@router.get("", response_model=List[schemas.Expense])
def get_expenses(
    project_id: Optional[int] = None,
    limit: int = 200,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Expense)
    if project_id:
        query = query.filter(models.Expense.project_id == project_id)
    if current_user.role != "admin":
        query = query.filter(models.Expense.user_id == current_user.id)
    return query.order_by(models.Expense.timestamp.desc()).offset(offset).limit(limit).all()

@router.post("", response_model=schemas.Expense)
def create_expense(
    expense: schemas.ExpenseCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_expense = models.Expense(
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        project_id=expense.project_id,
        user_id=current_user.id
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    utils.log_action(db, user_id=current_user.id, action="expense_created", entity="expense", entity_id=db_expense.id, details={"amount": float(db_expense.amount)})
    
    return db_expense

@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
        
    if current_user.role != "admin" and db_expense.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para borrar este gasto")
        
    db.delete(db_expense)
    db.commit()
    return {"message": "Gasto eliminado"}

@router.delete("/clear/all")
def clear_expenses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
        
    db.query(models.Expense).delete()
    db.commit()
    return {"message": "Historial de gastos borrado correctamente"}


