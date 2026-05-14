from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime, date

# ─────────────────────────────────────────
# Users
# ─────────────────────────────────────────

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    pin: str
    role: str = "staff"

class User(UserBase):
    id: int
    role: str
    email: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# ─────────────────────────────────────────
# Clients
# ─────────────────────────────────────────

class ClientBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    property_size: Optional[str] = None
    client_type: str = "Residential"
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ─────────────────────────────────────────
# Leads (Prospectos de Cotización)
# ─────────────────────────────────────────

class LeadBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    service_type: Optional[str] = None
    message: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class Lead(LeadBase):
    id: int
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# ─────────────────────────────────────────
# Services
# ─────────────────────────────────────────

class ServiceBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    base_price_usd: float = 0.0
    base_price_mxn: float = 0.0
    is_active: bool = True

class ServiceCreate(ServiceBase):
    pass

class Service(ServiceBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# ─────────────────────────────────────────
# Payments
# ─────────────────────────────────────────

class PaymentBase(BaseModel):
    amount: float
    currency: str = "USD"
    exchange_rate: float = 1.0
    payment_method: Optional[str] = "Cash"
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    project_id: int

class Payment(PaymentBase):
    id: int
    project_id: int
    proof_filename: Optional[str] = None
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

# ─────────────────────────────────────────
# Projects
# ─────────────────────────────────────────

class ProjectItemBase(BaseModel):
    service_id: int
    quantity: float = 1.0
    price_at_quote_usd: float
    price_at_quote_mxn: float
    notes: Optional[str] = None

class ProjectItemCreate(ProjectItemBase):
    pass

class ProjectItem(ProjectItemBase):
    id: int
    service: Optional[Service] = None
    model_config = ConfigDict(from_attributes=True)

class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "Estimate"
    total_quoted_usd: float = 0.0
    total_quoted_mxn: float = 0.0
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class ProjectCreate(ProjectBase):
    client_id: int
    items: List[ProjectItemCreate] = []

class Project(ProjectBase):
    id: int
    client_id: int
    manager_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    client: Optional[Client] = None
    items: List[ProjectItem] = []
    payments: List[Payment] = []
    model_config = ConfigDict(from_attributes=True)

# ─────────────────────────────────────────
# Auth & Misc
# ─────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    pin: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: User

# ─────────────────────────────────────────
# Expenses
# ─────────────────────────────────────────

class ExpenseBase(BaseModel):
    amount: float
    category: str
    description: Optional[str] = None
    project_id: Optional[int] = None

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    timestamp: datetime
    user_id: int
    model_config = ConfigDict(from_attributes=True)
