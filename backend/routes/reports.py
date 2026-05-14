from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import models, schemas
from database import get_db
from deps import get_current_user
from datetime import datetime, timedelta
from decimal import Decimal

router = APIRouter(tags=["reports"])

@router.get("/dashboard", response_model=dict)
def get_dashboard_summary(
    period: str = "week", 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Consolidated dashboard for Landscaping CRM.
    """
    now = datetime.utcnow()
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    else:
        start_date = now - timedelta(days=7)

    # Project Metrics (Optimized)
    project_query = db.query(models.Project).filter(models.Project.created_at >= start_date)
    if current_user.role != "admin":
        project_query = project_query.filter(models.Project.manager_id == current_user.id)
        
    project_stats = project_query.with_entities(
        func.sum(models.Project.total_quoted_usd).label("sum_usd"),
        func.sum(models.Project.total_quoted_mxn).label("sum_mxn"),
        func.count(models.Project.id).label("count_total")
    ).first()
    
    total_quoted_usd = project_stats.sum_usd or 0
    total_quoted_mxn = project_stats.sum_mxn or 0
    total_projects = project_stats.count_total or 0
    
    # Active projects (Filtered)
    active_projects = project_query.filter(models.Project.status.in_(['In Progress', 'Approved', 'Maintenance'])).count()

    # Client Metrics
    total_clients = db.query(models.Client).count()

    # Payment Metrics (Fixed: columns amount_usd/mxn don't exist)
    total_paid_usd = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.timestamp >= start_date,
        models.Payment.currency == 'USD'
    ).scalar() or 0
    
    total_paid_mxn = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.timestamp >= start_date,
        models.Payment.currency == 'MXN'
    ).scalar() or 0

    # Chart Data (Projects started per day)
    chart_data_raw = db.query(
        func.strftime('%Y-%m-%d', models.Project.created_at).label('day'),
        func.sum(models.Project.total_quoted_usd).label('quoted_usd'),
        func.sum(models.Project.total_quoted_mxn).label('quoted_mxn')
    ).filter(models.Project.created_at >= start_date)
    
    if current_user.role != "admin":
        chart_data_raw = chart_data_raw.filter(models.Project.manager_id == current_user.id)
        
    chart_data_raw = chart_data_raw.group_by('day').all()
    chart_data = [{"name": d.day, "quoted_usd": float(d.quoted_usd or 0), "quoted_mxn": float(d.quoted_mxn or 0)} for d in chart_data_raw]

    # Expenses (Optimized)
    expenses_data = db.query(
        models.Expense.category,
        func.sum(models.Expense.amount).label('total')
    ).filter(models.Expense.timestamp >= start_date).group_by(models.Expense.category).all()
    
    total_expenses = sum(e.total for e in expenses_data)
    expenses_by_category = {e.category: float(e.total) for e in expenses_data}

    return {
        "metrics": {
            "quoted_usd": float(total_quoted_usd),
            "quoted_mxn": float(total_quoted_mxn),
            "paid_usd": float(total_paid_usd),
            "paid_mxn": float(total_paid_mxn),
            "expenses": float(total_expenses),
            "active_projects": active_projects,
            "total_projects": total_projects,
            "total_clients": total_clients,
            "period": period
        },
        "chartData": chart_data,
        "expensesByCategory": expenses_by_category
    }
