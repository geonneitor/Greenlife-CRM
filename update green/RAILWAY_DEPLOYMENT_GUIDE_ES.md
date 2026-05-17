# 🚀 GUÍA DE DESPLIEGUE: Chinches Finanzas en Railway

## Resumen
- **Backend:** FastAPI + SQLAlchemy + SQLite
- **Auth:** JWT (passlib + python-jose)
- **Deploy:** Railway
- **Base de datos:** SQLite (local development) → PostgreSQL (Railway production)
- **Servidor:** Gunicorn + Uvicorn

---

## PARTE 1: PREPARACIÓN LOCAL

### 1.1 Estructura Esperada del Proyecto

```
chinches-finanzas/
├── backend/
│   ├── main.py                 (o app.py - punto de entrada)
│   ├── auth.py                 (módulo de autenticación JWT)
│   ├── models.py               (modelos SQLAlchemy)
│   ├── database.py             (conexión BD)
│   ├── requirements.txt         (dependencias)
│   ├── .env.example            (variables de entorno)
│   └── venv/                   (entorno virtual)
├── frontend/                   (React, Vue, etc - si existe)
├── .gitignore
├── README.md
└── Procfile                    (para Railway - lo crearemos)
```

### 1.2 Archivo `requirements.txt` (Tu versión actual)

```
fastapi
uvicorn
sqlalchemy
passlib[bcrypt]
python-multipart
python-jose[cryptography]
slowapi
pydantic
pydantic-settings
gunicorn
jinja2
aiofiles
a2wsgi
python-dotenv
mangum
```

**✅ Perfecto.** No necesitas agregar nada más.

### 1.3 Verificar que SQLite funciona localmente

```bash
cd backend
python -c "from sqlalchemy import create_engine; engine = create_engine('sqlite:///./app.db'); print('✅ SQLite funciona')"
```

---

## PARTE 2: ACTUALIZAR ARCHIVOS DE CONFIGURACIÓN

### 2.1 Crear `.env.example` (Backend)

```env
# ========================================
# CHINCHES FINANZAS - VARIABLES DE ENTORNO
# ========================================

# BASE DE DATOS
# Desarrollo: SQLite
DATABASE_URL=sqlite:///./app.db

# Producción (Railway): PostgreSQL
# DATABASE_URL=postgresql://user:password@host:5432/dbname
# Railway lo genera automáticamente - NO EDITAR MANUALMENTE

# SEGURIDAD - JWT
SECRET_KEY=your_super_secret_key_change_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# SEGURIDAD - BCRYPT
BCRYPT_LOG_ROUNDS=12

# API
API_TITLE=Chinches Finanzas API
API_VERSION=1.0.0
API_DESCRIPTION=Sistema de gestión de finanzas

# CORS (Si tienes frontend)
ALLOWED_ORIGINS=http://localhost:3000,https://chinches-finanzas.netlify.app

# RATE LIMITING
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900

# AMBIENTE
ENVIRONMENT=development
# Valores: development, staging, production

DEBUG=False
LOG_LEVEL=INFO
```

### 2.2 Crear `Procfile` (Para Railway)

```
web: gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app
```

**Si tu archivo principal es `app.py` en lugar de `main.py`:**
```
web: gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.app:app
```

### 2.3 Crear `.gitignore` (Backend)

```
# Entorno Virtual
venv/
env/
ENV/
.venv

# Base de datos local
*.db
*.sqlite
*.sqlite3
app.db

# Variables de entorno
.env
.env.local
.env.*.local

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# Sistema
.DS_Store
Thumbs.db

# Testing
.pytest_cache/
.coverage
htmlcov/

# Logs
*.log
```

---

## PARTE 3: CONFIGURAR AUTENTICACIÓN JWT

### 3.1 Estructura Recomendada de `auth.py`

Tu `auth.py` ya existe. Verifica que tenga esto:

```python
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel

# Configuración de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuración de JWT
SECRET_KEY = "your_secret_key"  # Cargar desde .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

### 3.2 Usar variables de entorno en `main.py`

```python
from fastapi import FastAPI
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title=os.getenv("API_TITLE", "Chinches Finanzas API"),
    version=os.getenv("API_VERSION", "1.0.0"),
    description=os.getenv("API_DESCRIPTION", "Sistema de gestión")
)

# Variables de entorno
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "False") == "True"

if DEBUG:
    print(f"🚀 Ejecutando en {ENVIRONMENT}")
```

---

## PARTE 4: ACTUALIZAR main.py / app.py

### 4.1 Configurar CORS (Para conectar con frontend)

```python
from fastapi.middleware.cors import CORSMiddleware

# Después de crear la app
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4.2 Agregar Health Check (Importante para Railway)

```python
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "version": os.getenv("API_VERSION", "1.0.0")
    }

@app.get("/")
def root():
    return {"message": "Chinches Finanzas API", "docs": "/docs"}
```

### 4.3 Configurar puerto dinámico (Railway requiere esto)

```python
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(
        "main:app",  # O "app:app" según tu archivo
        host="0.0.0.0",
        port=port,
        reload=DEBUG
    )
```

---

## PARTE 5: DESPLIEGUE EN RAILWAY

### 5.1 Preparar el Repositorio

```bash
# 1. Asegúrate de estar en la raíz del proyecto
cd /ruta/a/Chinches Finanzas

# 2. Inicializar Git (si no lo has hecho)
git init
git add .
git commit -m "Initial commit: FastAPI backend ready for deployment"

# 3. Crear repositorio en GitHub
# Ir a https://github.com/new
# Crear repo: "chinches-finanzas"
# Ejecutar:
git remote add origin https://github.com/TU_USUARIO/chinches-finanzas.git
git branch -M main
git push -u origin main
```

### 5.2 Conectar a Railway (Paso a Paso)

**Paso 1: Ir a Railway.app**
```
https://railway.app
```

**Paso 2: Crear nuevo proyecto**
- Click en "New Project"
- Seleccionar "Deploy from GitHub"
- Conectar tu cuenta GitHub
- Seleccionar el repositorio "chinches-finanzas"

**Paso 3: Configurar el servicio Python**
- Railway automáticamente detecta `requirements.txt`
- En la pestaña del servicio:
  - Root Directory: `.` (raíz)
  - Start Command: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app`
  - O usa `Procfile` si lo creaste

**Paso 4: Configurar variables de entorno**
- Click en "Variables" en el servicio
- Agregar estas variables:

```
SECRET_KEY=generate_a_random_string_here_at_least_32_chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
API_TITLE=Chinches Finanzas API
API_VERSION=1.0.0
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=INFO
ALLOWED_ORIGINS=https://tu-frontend.netlify.app,https://chinches-finanzas.netlify.app
```

**IMPORTANTE:** Para generar SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Paso 5: Agregar Base de Datos (PostgreSQL)**
- En el proyecto de Railway
- Click en "Add Service"
- Seleccionar "PostgreSQL"
- Railway automáticamente crea `DATABASE_URL`

**Paso 6: Cambiar DATABASE_URL en variables**
```
DATABASE_URL=postgresql://[autogenerado por Railway]
```

**Paso 7: Deploy**
- Click en "Deploy"
- Esperar a que termine (2-5 minutos)
- Railway te dará una URL: `https://tu-app.up.railway.app`

---

## PARTE 6: VERIFICAR QUE FUNCIONA

### 6.1 Probar Endpoints

```bash
# Health check
curl https://tu-app.up.railway.app/health

# Documentación interactiva
# Ir a: https://tu-app.up.railway.app/docs
```

### 6.2 Revisar Logs

En Railway Dashboard:
- Click en tu servicio
- Pestaña "Logs"
- Ver si hay errores

### 6.3 Problema: Base de datos no migra

Si tienes migraciones (Alembic):
```bash
# En Railway > Variables > "Add variable"
# Agregar comando de migración:
RAILWAY_RUN_COMMAND="alembic upgrade head && gunicorn..."
```

Si tienes Sqlalchemy con `Base.metadata.create_all()`:
```python
# En main.py
from database import Base, engine

# Crear tablas automáticamente
Base.metadata.create_all(bind=engine)

@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
```

---

## PARTE 7: CONECTAR FRONTEND CON BACKEND

### 7.1 Actualizar URL de API en Frontend

En tu archivo de configuración del frontend (.env):
```env
REACT_APP_API_URL=https://tu-app.up.railway.app
```

### 7.2 Llamadas a API desde Frontend

```javascript
// Ejemplo con Fetch
const response = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
```

---

## PARTE 8: MONITOREO Y MANTENIMIENTO

### 8.1 Ver Logs en Tiempo Real
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Ver logs
railway logs --service backend
```

### 8.2 Redeploy Manual
```bash
# Después de cambios en GitHub
git push origin main

# Railway automáticamente detecta y redeploya
# O en Railway Dashboard: Click "Redeploy"
```

### 8.3 Problemas Comunes

**Error: ModuleNotFoundError**
- Verificar que `requirements.txt` incluya todas las dependencias
- Reinstalar: `pip install -r requirements.txt`

**Error: Cannot find module 'main'**
- Verificar estructura de carpetas
- Procfile debe apuntar al archivo correcto: `backend.main:app`

**Error: Port already in use**
- Railway asigna puerto dinámico en variable `PORT`
- Tu código debe usar: `port = int(os.getenv("PORT", 5000))`

**Error: Database connection**
- Verificar `DATABASE_URL` en Variables
- Si es PostgreSQL: `postgresql://user:pass@host:5432/db`

---

## PARTE 9: MIGRAR DE SQLite A PostgreSQL

### 9.1 En Desarrollo (mantener SQLite)
```
DATABASE_URL=sqlite:///./app.db
```

### 9.2 En Producción (Railway + PostgreSQL)
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
# Railway lo genera automáticamente
```

### 9.3 Migrar datos (si tienes datos en SQLite)
```bash
# 1. Exportar desde SQLite
sqlite3 app.db ".dump" > dump.sql

# 2. Procesar y adaptar a PostgreSQL si es necesario

# 3. Importar en PostgreSQL de Railway
# (Railway proporciona CLI para esto)
```

---

## PARTE 10: CHECKLIST FINAL

Antes de ir a producción:

- [ ] Repositorio en GitHub
- [ ] Proyecto creado en Railway
- [ ] PostgreSQL agregada
- [ ] Variables de entorno configuradas
- [ ] SECRET_KEY generada y segura
- [ ] ALLOWED_ORIGINS actualizado
- [ ] Health check funciona: `/health`
- [ ] Docs disponibles: `/docs`
- [ ] Tests pasados: `pytest`
- [ ] Frontend conectado y funciona
- [ ] Logs sin errores
- [ ] SSL/HTTPS automático (Railway lo hace)

---

## PARTE 11: DOMINIO PERSONALIZADO (Opcional)

En Railway Dashboard:
1. Click en el servicio
2. "Settings" → "Networking"
3. "Generate Domain"
4. O conectar dominio personalizado (requiere cambiar DNS)

---

## 🎯 RESUMEN DE PASOS

1. ✅ Actualizar `requirements.txt` (ya lo tienes)
2. ✅ Crear `.env.example`
3. ✅ Crear `Procfile`
4. ✅ Actualizar `main.py` con CORS y health check
5. ✅ Crear `.gitignore`
6. ✅ Push a GitHub
7. ✅ Crear proyecto en Railway
8. ✅ Conectar PostgreSQL
9. ✅ Configurar variables
10. ✅ Deploy y verificar

**Tiempo estimado:** 30-45 minutos

---

**¿Dudas? Pregunta en cada paso.** 🚀
