from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey, Text, Date, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    pin_hash = Column(String(128))
    role = Column(String(20), nullable=False, default='staff')  # 'admin', 'staff'
    email = Column(String(128), unique=True, index=True)
    phone = Column(String(20), unique=True, index=True)
    recovery_code = Column(String(6), nullable=True)
    recovery_expiry = Column(DateTime, nullable=True)
    settings = Column(Text, default='{}')
    security_answer_hash = Column(String(128), nullable=True)
    avatar_filename = Column(String(256), nullable=True)
    avatar_url = Column(String(512), nullable=True)

    projects = relationship("Project", back_populates="manager")
    audit_logs = relationship("AuditLog", back_populates="user")
    expenses = relationship("Expense", back_populates="user")

    __table_args__ = (
        CheckConstraint("role IN ('admin', 'staff')", name='ck_user_role'),
    )

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(64), index=True, nullable=False)
    last_name = Column(String(64), index=True, nullable=False)
    email = Column(String(128), index=True)
    phone = Column(String(20))
    address = Column(String(256))
    property_size = Column(String(64)) # e.g., "0.5 acres", "2000 sqft"
    client_type = Column(String(20), default='Residential') # 'Residential', 'Commercial'
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    projects = relationship("Project", back_populates="client")

    __table_args__ = (
        CheckConstraint("client_type IN ('Residential', 'Commercial')", name='ck_client_type'),
    )

class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), index=True, nullable=False)
    category = Column(String(64), index=True, nullable=False) # 'Maintenance', 'Landscaping', 'Hardscaping', 'Irrigation'
    description = Column(Text)
    base_price_usd = Column(Numeric(10, 2), default=0.0)
    base_price_mxn = Column(Numeric(10, 2), default=0.0)
    is_active = Column(Boolean, default=True)

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey('clients.id'), nullable=False)
    manager_id = Column(Integer, ForeignKey('users.id'), index=True)
    title = Column(String(128), nullable=False)
    description = Column(Text)
    status = Column(String(32), default='Estimate', index=True) # 'Estimate', 'Approved', 'In Progress', 'Completed', 'Cancelled', 'Maintenance'
    
    total_quoted_usd = Column(Numeric(10, 2), default=0.0)
    total_quoted_mxn = Column(Numeric(10, 2), default=0.0)
    
    start_date = Column(Date)
    end_date = Column(Date)
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, onupdate=func.now())

    client = relationship("Client", back_populates="projects")
    manager = relationship("User", back_populates="projects")
    payments = relationship("Payment", back_populates="project")
    items = relationship("ProjectItem", back_populates="project")
    expenses = relationship("Expense", back_populates="project")

    __table_args__ = (
        CheckConstraint("status IN ('Estimate', 'Approved', 'In Progress', 'Completed', 'Cancelled', 'Maintenance')", name='ck_project_status'),
    )

class ProjectItem(Base):
    __tablename__ = "project_items"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    service_id = Column(Integer, ForeignKey('services.id'), nullable=False)
    quantity = Column(Numeric(10, 2), default=1.0)
    price_at_quote_usd = Column(Numeric(10, 2), nullable=False)
    price_at_quote_mxn = Column(Numeric(10, 2), nullable=False)
    notes = Column(String(256))

    project = relationship("Project", back_populates="items")
    service = relationship("Service")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default='USD') # 'USD', 'MXN'
    exchange_rate = Column(Numeric(10, 4), default=1.0) # Exchange rate at moment of payment
    payment_method = Column(String(32)) # 'Zelle', 'Cash', 'Check', 'Transfer', 'PayPal'
    proof_filename = Column(String(256))
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    notes = Column(String(256))

    project = relationship("Project", back_populates="payments")

    __table_args__ = (
        CheckConstraint("currency IN ('USD', 'MXN')", name='ck_payment_currency'),
    )

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), index=True, nullable=False)
    email = Column(String(128), index=True, nullable=False)
    phone = Column(String(20))
    service_type = Column(String(128)) # e.g., "Landscaping", "Consultation", "Assesment"
    message = Column(Text)
    status = Column(String(32), default='New', index=True) # 'New', 'Contacted', 'Quoted', 'Converted', 'Rejected'
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), index=True)
    updated_at = Column(DateTime, onupdate=func.now())

    __table_args__ = (
        CheckConstraint("status IN ('New', 'Contacted', 'Quoted', 'Converted', 'Rejected')", name='ck_lead_status'),
    )

class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    action = Column(String(64), nullable=False)
    entity = Column(String(32), nullable=False)
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, server_default=func.now())
    ip_address = Column(String(45), nullable=True)

    user = relationship("User", back_populates="audit_logs")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    category = Column(String(64), nullable=False, default='Operación', index=True)
    description = Column(String(256), nullable=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=True)

    user = relationship("User", back_populates="expenses")
    project = relationship("Project", back_populates="expenses")
