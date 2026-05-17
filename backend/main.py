from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import sys
import logging
from dotenv import load_dotenv

# Asegurar que Python pueda encontrar los módulos locales de 'backend'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Cargar variables de entorno
load_dotenv()

# Importar módulos locales
import models, database, auth, notifications, deps
from database import engine, get_db
from routes import services, projects, clients, payments, expenses, reports, files, leads
import random
from datetime import datetime, timedelta


# ✅ Crear tablas (Asegurar que la base de datos esté al día)
models.Base.metadata.create_all(bind=engine)

# ✅ Configuración de Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("api_errors.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("greenlife-crm")

# ✅ Rate Limiting
def get_safe_remote_address(request: Request):
    try:
        return get_remote_address(request) or "127.0.0.1"
    except:
        return "127.0.0.1"

limiter = Limiter(key_func=get_safe_remote_address)
app = FastAPI(title="Greenlife Enterprise API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(
    status_code=429,
    content={"detail": "Demasiados intentos. Intenta más tarde."}
))

# ✅ CORS: restringido en produccion
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:4173",
    "https://smokerings.app",
    "https://www.smokerings.app",
    "https://greenlifeenterprisellc.com",
    "https://www.greenlifeenterprisellc.com",
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Autenticación Setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login-pin")

# ✅ Dependencia para obtener usuario autenticado
# Nota: Ahora usamos la de deps.py preferiblemente, pero mantenemos esta por compatibilidad local si es necesario
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return deps.get_current_user(token, db)

# ✅ Registrar routers API
app.include_router(services.router, prefix="/api/services", tags=["services"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(clients.router, prefix="/api/clients", tags=["clients"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["expenses"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(leads.router, prefix="/api/leads", tags=["leads"])

@app.get("/api/health")
def health_check():
    return {"status": "online", "message": "Greenlife API is responding"}

# ✅ Listado público de usuarios para el login
@app.get("/api/users/list")
def list_public_users(db: Session = Depends(get_db)):
    """Retorna usuarios básicos para la pantalla de selección inicial"""
    users = db.query(models.User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "role": u.role,
            "avatar_url": u.avatar_url,
            "avatar_filename": u.avatar_filename
        } for u in users
    ]

# ✅ Login con PIN
@app.post("/api/login-pin")
@limiter.limit("5/minute")
async def login_with_pin(request: Request, data: dict, db: Session = Depends(get_db)):
    username = data.get("username")
    pin = data.get("pin")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not auth.verify_password(pin, user.pin_hash):
        raise HTTPException(status_code=401, detail="PIN incorrecto")
    
    # Payload para el token
    token_payload = {
        "sub": user.username,
        "user_id": user.id,
        "role": user.role
    }
    
    access_token = auth.create_access_token(data=token_payload)
    refresh_token = auth.create_refresh_token(data=token_payload)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # segundos
        "user_id": user.id,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "avatar_url": user.avatar_url,
            "avatar_filename": user.avatar_filename
        }
    }

# ✅ Endpoint de refresh
@app.post("/api/refresh")
async def refresh_access_token(data: dict, db: Session = Depends(get_db)):
    """Valida refreshToken y emite nuevo accessToken"""
    refresh_token = data.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="refresh_token requerido")
    
    try:
        # Decodificación manual para verificar tipo refresh
        payload = auth.jwt.decode(refresh_token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token tipo incorrecto")
        
        user_id = payload.get("user_id")
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        
        token_payload = {
            "sub": user.username,
            "user_id": user.id,
            "role": user.role
        }
        
        new_access_token = auth.create_access_token(data=token_payload)
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    except auth.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

# ✅ Endpoints de Seguridad y Usuarios
@app.get("/api/users/me")
async def get_me(current_user: models.User = Depends(deps.get_current_user)):
    """Retorna los datos del usuario logueado usando el token JWT"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "email": current_user.email,
        "phone": current_user.phone,
        "avatar_url": current_user.avatar_url,
        "avatar_filename": current_user.avatar_filename
    }

@app.post("/api/users/change-pin")
async def change_pin(data: dict, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(get_db)):
    """Cambia el PIN validando el anterior"""
    old_pin = data.get("old_pin")
    new_pin = data.get("new_pin")
    if not old_pin or not new_pin:
        raise HTTPException(status_code=400, detail="PIN anterior y nuevo son requeridos")
    if not auth.verify_password(old_pin, current_user.pin_hash):
        raise HTTPException(status_code=401, detail="PIN anterior incorrecto")
    current_user.pin_hash = auth.get_password_hash(new_pin)
    db.commit()
    return {"message": "PIN actualizado correctamente"}

@app.post("/api/auth/forgot-pin")
@limiter.limit("3/minute")
async def forgot_pin(request: Request, data: dict, db: Session = Depends(get_db)):
    """Inicia flujo de recuperación enviando OTP"""
    username = data.get("username")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if not user.email and not user.phone:
        raise HTTPException(status_code=400, detail="El usuario no tiene email ni teléfono configurado para recuperación")
    
    otp = "".join([str(random.randint(0, 9)) for _ in range(6)])
    user.recovery_code = otp
    user.recovery_expiry = datetime.utcnow() + timedelta(minutes=15)
    db.commit()
    
    notifications.send_recovery_code(user.email, user.phone, user.username, otp)
    return {"message": "Código de recuperación enviado"}

@app.post("/api/auth/verify-otp")
async def verify_otp(data: dict, db: Session = Depends(get_db)):
    username = data.get("username")
    code = data.get("code")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not user.recovery_code:
        raise HTTPException(status_code=404, detail="Solicitud de recuperación no encontrada")
    if user.recovery_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="El código ha expirado")
    if user.recovery_code != code:
        raise HTTPException(status_code=401, detail="Código incorrecto")
    return {"message": "Código validado correctamente"}

@app.post("/api/auth/reset-pin")
async def reset_pin_recovery(data: dict, db: Session = Depends(get_db)):
    username = data.get("username")
    code = data.get("code")
    new_pin = data.get("new_pin")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or user.recovery_code != code:
        raise HTTPException(status_code=401, detail="Verificación inválida")
    if user.recovery_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Sesión expirada")
    user.pin_hash = auth.get_password_hash(new_pin)
    user.recovery_code = None
    user.recovery_expiry = None
    db.commit()
    return {"message": "PIN reestablecido con éxito"}

@app.post("/api/users")
async def create_user(data: dict, admin: models.User = Depends(deps.get_admin_user), db: Session = Depends(get_db)):
    username = data.get("username")
    role = data.get("role", "staff")
    email = data.get("email")
    phone = data.get("phone")
    pin = data.get("pin") or "".join([str(random.randint(0, 9)) for _ in range(6)])
    if not username:
        raise HTTPException(status_code=400, detail="Username es requerido")
    existing = db.query(models.User).filter(models.User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
    new_user = models.User(
        username=username,
        pin_hash=auth.get_password_hash(pin),
        role=role,
        email=email,
        phone=phone
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    notifications.send_registration_info(email, phone, username, pin)
    return {"id": new_user.id, "username": new_user.username, "role": new_user.role, "provisional_pin": pin}

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: int, admin: models.User = Depends(deps.get_admin_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propio usuario")
    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado correctamente"}

@app.post("/api/admin/backup")
async def trigger_backup(admin: models.User = Depends(deps.get_admin_user)):
    from tools import backups
    db_path = "greenlife.db"
    backup_dir = "backups"
    success, result = backups.perform_db_backup(db_path, backup_dir)
    if not success:
        raise HTTPException(status_code=500, detail=f"Error al crear respaldo: {result}")
    backups.cleanup_old_backups(backup_dir, keep_last=10)
    return {"message": "Respaldo creado con éxito", "path": result}

# ✅ Almacenamiento Estático
if not os.path.exists("./uploads"):
    os.makedirs("./uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ✅ Frontend Serving & SPA Fallback
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
frontend_index = os.path.join(frontend_dist, "index.html")
if os.path.exists(os.path.join(frontend_dist, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("uploads/"):
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    if os.path.exists(frontend_index):
        return FileResponse(frontend_index)
    return JSONResponse(status_code=404, content={"error": "Frontend build not found"})

@app.on_event("startup")
def create_initial_admins():
    db = next(database.get_db())
    admins = ["Sergio", "Geonneitor"]
    for admin_name in admins:
        admin = db.query(models.User).filter(models.User.username == admin_name).first()
        if not admin:
            new_admin = models.User(
                username=admin_name,
                pin_hash=auth.get_password_hash("123456"),
                role="admin"
            )
            db.add(new_admin)
            print(f"Created initial admin user: {admin_name}")
    db.commit()
