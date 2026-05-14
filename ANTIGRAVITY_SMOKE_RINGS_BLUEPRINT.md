# 🔥 SMOKE RINGS — BLUEPRINT ANTIGRAVITY
## Robustez + Producción: Tareas Técnicas Ultra-Específicas

**Versión:** 1.0  
**Fecha:** Abril 2026  
**Objetivo:** Convertir Smoke Rings en un sistema "indestructible" ante fallos de red y expiración de sesiones  
**Tiempo estimado:** 4-5 días (1 persona a tiempo completo)

---

## 📋 TABLA DE CONTENIDOS

1. [Contexto & Problemas Actuales](#1-contexto--problemas-actuales)
2. [Arquitectura Nueva](#2-arquitectura-nueva)
3. [Fase 1: Backend (1-2 días)](#fase-1-backend-1-2-días)
4. [Fase 2: Frontend Stores (1 día)](#fase-2-frontend-stores-1-día)
5. [Fase 3: Frontend API (1 día)](#fase-3-frontend-api-1-día)
6. [Fase 4: Hooks & Componentes (1 día)](#fase-4-hooks--componentes-1-día)
7. [Fase 5: Assets & Build (1 día)](#fase-5-assets--build-1-día)
8. [Fase 6: Testing & Deploy (1-2 días)](#fase-6-testing--deploy-1-2-días)
9. [Fase 7: Limpieza (1 día)](#fase-7-limpieza--documentación-1-día)
10. [Troubleshooting](#troubleshooting)

---

## 1. CONTEXTO & PROBLEMAS ACTUALES

### El Problema Central

El sistema sufre de **tres fallos de diseño sincronizados**:

```
[Token expira sin refresh mechanism]
    ↓
[Axios interceptor hace request a /token que no existe]
    ↓
[401 error, app no sabe qué hacer]
    ↓
[localStorage.clear() borra TODO (including settings)]
    ↓
[window.location.href refresca, pierde estado de la app]
    ↓
[Usuario vuelve a login, pero localStorage vacío = desincronización]
```

### Raíces

1. **Backend**: `ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60` (30 DÍAS sin refresh)
2. **Backend**: No hay endpoint `/refresh` para renovar tokens
3. **Backend**: No hay función `get_current_user()` — seller_id viene del frontend (sin validación)
4. **Frontend**: `localStorage.clear()` borra TODO sin discriminación
5. **Frontend**: No hay diferencia entre auth storage y user preferences storage
6. **Frontend**: `window.location.href` rompe el estado de React

### Decisiones de Diseño

- ✅ Tokens cortos: 15 minutos (access) + 7 días (refresh)
- ✅ Single Source of Truth: Zustand store (no localStorage directo)
- ✅ localStorage estratégico: 2 keys (`__smoke_auth`, `__smoke_ui`) — nunca más
- ✅ Interceptor inteligente: refresh automático sin page reload
- ✅ Sin `window.location` reloads: usar eventos customizados
- ✅ User ID en JWT: seller_id sacado del token, no del frontend

---

## 2. ARQUITECTURA NUEVA

### Flujo de Datos

```
┌─────────────────────────────────────────────────────┐
│          ZUSTAND STORE (Memory)                      │
│  useAuthStore: { user, accessToken, refreshToken } │
│  useUIStore: { theme, accentColor, language }      │
└────────────────┬──────────────────────────────────┘
                 │ (persist ONLY)
                 ↓
┌─────────────────────────────────────────────────────┐
│      localStorage (Disk)                             │
│  __smoke_auth: { accessToken, refreshToken }        │
│  __smoke_ui: { theme, accentColor, ... }            │
└────────────────┬──────────────────────────────────┘
                 │ (rehydrate on mount)
                 ↓
┌─────────────────────────────────────────────────────┐
│      API Client (Axios Interceptors)                 │
│  - Request: Attach accessToken                      │
│  - Request: Check expiration, refresh if needed     │
│  - Response 401: Clear auth, emit logout event      │
│  - Retry: 3 intentos con backoff exponencial        │
└────────────────┬──────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│      FastAPI Backend                                 │
│  - /login-pin: Devuelve {accessToken, refresh...}  │
│  - /refresh: Valida refreshToken, emite nuevo      │
│  - Todos los endpoints: Extraen user_id del JWT    │
│  - 401 response: Solo si ambos tokens inválidos    │
└─────────────────────────────────────────────────────┘
```

---

## FASE 1: BACKEND (1-2 DÍAS)

### T1.1 — Actualizar `auth.py`

**Archivo:** `backend/auth.py`

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import os

# ✅ CAMBIO: Leer SECRET_KEY desde env
SECRET_KEY = os.getenv("SECRET_KEY", "SUPER_SECRET_KEY_REPLACE_FOR_PROD")
ALGORITHM = "HS256"

# ✅ CAMBIO: Tokens cortos + refresh
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ✅ CAMBIO: Nuevo modelo
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos

# ✅ CAMBIO: Nuevo modelo
class TokenData(BaseModel):
    user_id: int
    username: str
    role: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # ✅ CAMBIO: Agregar "type" field
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ✅ CAMBIO: Nueva función
def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ✅ CAMBIO: Nueva función
def decode_token(token: str) -> Optional[TokenData]:
    """Decodifica y valida el JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            return None
        return TokenData(
            user_id=payload.get("user_id"),
            username=payload.get("sub"),
            role=payload.get("role")
        )
    except JWTError:
        return None
```

**Checklist:**
- [ ] Cambiar `ACCESS_TOKEN_EXPIRE_MINUTES` de `30*24*60` a `15`
- [ ] Agregar `REFRESH_TOKEN_EXPIRE_DAYS = 7`
- [ ] Crear clase `TokenData` con `user_id`, `username`, `role`
- [ ] Crear función `create_refresh_token()`
- [ ] Crear función `decode_token()`
- [ ] Cambiar `SECRET_KEY` para leer desde `os.getenv()`
- [ ] **Testing**: `python -c "from auth import create_access_token; token = create_access_token({'sub': 'test', 'user_id': 1, 'role': 'admin'}); print(len(token) > 50)"`
  - Esperado: `True`

---

### T1.2 — Reescribir `main.py`

**Archivo:** `backend/main.py`

**CRÍTICO**: Este archivo es el corazón. Copiar exactamente:

```python
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import models, database, auth
from database import engine, get_db
from routes import products, sales, inventory, customers, expenses
import os

# ✅ Crear tablas
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smoke Rings API")

# ✅ CORS: restringido en producción
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
origins = ["http://localhost:5173", "http://localhost:3000"]
if ENVIRONMENT == "production":
    origins = [
        "https://smokerings.app",
        "https://www.smokerings.app",
        os.getenv("FRONTEND_URL", "")  # Vercel URL
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in origins if o],  # Filter empty strings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Registrar routers API
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(inventory.router)
app.include_router(customers.router)
app.include_router(expenses.router)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ✅ NUEVO: Dependencia para obtener usuario autenticado
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Extrae user_id del JWT y valida existencia en DB"""
    token_data = auth.decode_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

@app.get("/")
def read_root():
    return {"message": "Smoke Rings API is online"}

# ✅ MODIFICADO: Login con PIN
@app.post("/login-pin")
async def login_with_pin(data: dict, db: Session = Depends(get_db)):
    username = data.get("username")
    pin = data.get("pin")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not auth.verify_password(pin, user.pin_hash):
        raise HTTPException(status_code=401, detail="PIN incorrecto")
    
    # ✅ Cambio: Devolver refresh token
    access_token = auth.create_access_token(data={
        "sub": user.username,
        "user_id": user.id,
        "role": user.role
    })
    refresh_token = auth.create_refresh_token(data={
        "sub": user.username,
        "user_id": user.id,
        "role": user.role
    })
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # segundos
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }

# ✅ NUEVO: Endpoint de refresh
@app.post("/refresh")
async def refresh_access_token(data: dict, db: Session = Depends(get_db)):
    """Valida refreshToken y emite nuevo accessToken"""
    refresh_token = data.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="refresh_token requerido")
    
    try:
        payload = auth.jwt.decode(refresh_token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token tipo incorrecto")
        
        user_id = payload.get("user_id")
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        
        new_access_token = auth.create_access_token(data={
            "sub": user.username,
            "user_id": user.id,
            "role": user.role
        })
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    except auth.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

# ✅ NUEVO: Servir assets estáticos
@app.get("/assets/{file_path:path}")
async def serve_asset(file_path: str):
    """Servir assets compilados (CSS, JS, etc.)"""
    asset_path = os.path.join("../frontend/dist/assets", file_path)
    if os.path.exists(asset_path):
        return FileResponse(asset_path)
    raise HTTPException(status_code=404, detail="Asset no encontrado")

# ✅ NUEVO: SPA Fallback (DEBE IR AL FINAL)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Fallback para SPA: todas las rutas no-API van a index.html"""
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Endpoint no encontrado")
    
    index_path = "../frontend/dist/index.html"
    if os.path.exists(index_path):
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Frontend no compilado. Ejecuta: cd frontend && npm run build")

# ✅ Inicializar admins
@app.on_event("startup")
def create_initial_admins():
    db = next(database.get_db())
    admins = ["Geonneitor", "Merrgato"]
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
```

**Checklist:**
- [ ] Cambiar `ACCESS_TOKEN_EXPIRE_MINUTES` → 15
- [ ] Agregar `get_current_user()` dependencia
- [ ] Modificar `/login-pin` para devolver `refresh_token`
- [ ] Crear `/refresh` endpoint
- [ ] Agregar routes para servir assets y SPA fallback
- [ ] Actualizar CORS para incluir producción URLs
- [ ] **Testing**: 
  ```bash
  # Login
  curl -X POST http://localhost:8000/login-pin \
    -H "Content-Type: application/json" \
    -d '{"username":"Geonneitor","pin":"123456"}'
  # Esperado: { "access_token": "...", "refresh_token": "...", "expires_in": 900 }
  
  # Refresh (reemplazar <REFRESH_TOKEN>)
  curl -X POST http://localhost:8000/refresh \
    -H "Content-Type: application/json" \
    -d '{"refresh_token":"<REFRESH_TOKEN>"}'
  # Esperado: { "access_token": "...", "expires_in": 900 }
  ```

---

### T1.3 — Actualizar `sales.py`

**Archivo:** `backend/routes/sales.py`

**Solo mostrar cambios (buscar y reemplazar):**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, database, auth
from database import get_db

router = APIRouter(prefix="/sales", tags=["sales"])

# ✅ CAMBIO: Agregar current_user, remover seller_id como param
@router.post("/", response_model=schemas.Sale)
def create_sale(
    sale: schemas.SaleCreate,
    current_user: models.User = Depends(auth.get_current_user),  # ✅ NUEVO
    db: Session = Depends(get_db)
):
    """El seller_id se extrae del usuario autenticado"""
    seller_id = current_user.id  # ✅ CAMBIO: del token, no frontend
    
    # ... resto del código sin cambios en lógica ...
    items_to_create = []
    total_commission = 0
    
    for item in sale.items:
        product = db.query(models.Product).filter_by(id=item.product_id).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Producto no encontrado (ID {item.product_id})")

        user_stock = db.query(models.UserStock).filter_by(user_id=seller_id, product_id=item.product_id).first()
        if not user_stock or user_stock.quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name}")
        
        # Lógica de costo/comisión (sin cambios)
        if product.is_cannabis_type:
            if item.quantity >= 28:
                cost_unit = (product.cost_28g / 28) if product.cost_28g > 0 else product.cost_supplier
            elif item.quantity >= 14:
                cost_unit = (product.cost_14g / 14) if product.cost_14g > 0 else product.cost_supplier
            else:
                cost_unit = product.cost_1g if product.cost_1g > 0 else product.cost_supplier
        elif item.quantity == 3 and product.cost_3pack > 0:
            cost_unit = product.cost_3pack / 3
        else:
            cost_unit = product.cost_supplier

        item_commission = (item.price_at_sale - cost_unit) * item.quantity
        total_commission += item_commission
        
        user_stock.quantity -= item.quantity
        
        items_to_create.append(models.SaleItem(
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_sale=item.price_at_sale,
            cost_at_sale=cost_unit
        ))

    db_sale = models.Sale(
        seller_id=seller_id,  # ✅ Ahora seguro del JWT
        total_amount=sale.total_amount,
        total_commission=total_commission,
        payment_method=sale.payment_method,
        buyer_name=sale.buyer_name,
        is_future_sale=sale.is_future_sale,
        scheduled_date=sale.scheduled_date,
        location=sale.location,
        notes=sale.notes,
        paid_in_advance=sale.paid_in_advance,
        status=sale.status if sale.is_future_sale else "completed"
    )
    db.add(db_sale)
    db.flush()
    
    for item in items_to_create:
        item.sale_id = db_sale.id
        db.add(item)
    
    db.commit()
    db.refresh(db_sale)
    return db_sale

# ✅ CAMBIO: Agregar filtro por usuario actual
@router.get("/", response_model=List[schemas.Sale])
def get_sales(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener ventas solo del usuario autenticado"""
    return db.query(models.Sale).filter(
        models.Sale.seller_id == current_user.id
    ).order_by(models.Sale.timestamp.desc()).all()

# ✅ CAMBIO: Agregar current_user (rest sin cambios)
@router.patch("/{sale_id}/status", response_model=schemas.Sale)
def update_sale_status(
    sale_id: int,
    status_update,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    sale = db.query(models.Sale).filter(models.Sale.id == sale_id).first()
    if not sale or sale.seller_id != current_user.id:  # ✅ Verificar propiedad
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    
    sale.status = status_update.status
    if status_update.paid_in_advance is not None:
        sale.paid_in_advance = status_update.paid_in_advance
        
    db.commit()
    db.refresh(sale)
    return sale
```

**Checklist:**
- [ ] En `create_sale()`: cambiar signature para usar `current_user: models.User = Depends(auth.get_current_user)`
- [ ] Reemplazar `seller_id` param con `seller_id = current_user.id`
- [ ] En `get_sales()`: agregar filtro `seller_id == current_user.id`
- [ ] **Testing**: Autenticarse, hacer POST a `/sales/` sin pasar `seller_id` como query param
  - Esperado: Venta creada con seller_id = user autenticado

---

### T1.4 — Crear `.env` (Backend)

**Archivo:** `backend/.env`

```env
# ✅ GENERADOR: python -c "import secrets; print(secrets.token_urlsafe(64))"
SECRET_KEY=YOUR_RANDOM_64_CHAR_KEY_HERE_NOT_THIS_STRING

# Base de datos
DATABASE_URL=sqlite:///./smokerings.db

# Entorno
ENVIRONMENT=development

# Tokens
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Frontend (para CORS)
FRONTEND_URL=http://localhost:5173
```

**Archivo:** `backend/.env.example` (sin secretos)

```env
SECRET_KEY=your_secret_key_here
DATABASE_URL=sqlite:///./smokerings.db
ENVIRONMENT=development
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=http://localhost:5173
```

**Archivo:** `.gitignore` (agregar)

```gitignore
backend/.env
frontend/.env.local
*.db
__pycache__/
node_modules/
.DS_Store
```

**Checklist:**
- [ ] Generar SECRET_KEY con `python -c "import secrets; print(secrets.token_urlsafe(64))"`
- [ ] Crear `backend/.env` con SECRET_KEY generado
- [ ] Crear `backend/.env.example` SIN SECRET_KEY
- [ ] Agregar `backend/.env` a `.gitignore`
- [ ] **Testing**: `echo $SECRET_KEY` en terminal desde `backend/` folder → debe mostrar la clave

---

### T1.5 — Rate Limiting (Opcional pero recomendado)

**Instalar:**

```bash
cd backend
pip install slowapi
```

**Archivo:** `backend/main.py` (agregar al inicio)

```python
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

# ✅ AGREGAR esto antes de app = FastAPI()
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(
    status_code=429,
    content={"detail": "Demasiados intentos. Intenta más tarde."}
))
```

**Decorar login:**

```python
@app.post("/login-pin")
@limiter.limit("5/minute")  # ✅ AGREGAR
async def login_with_pin(request, data: dict, db: Session = Depends(get_db)):
    # ... resto sin cambios
```

**Checklist:**
- [ ] Instalar `slowapi`
- [ ] Importar limiter y exception handler
- [ ] Decorar `/login-pin` con `@limiter.limit("5/minute")`
- [ ] **Testing**: Hacer 6 requests rápidos a `/login-pin` → 6to debe devolver 429

---

## FASE 2: FRONTEND STORES (1 DÍA)

### T2.1 — Instalar Zustand

```bash
cd frontend
npm install zustand
```

**Verificar:**

```bash
npm list zustand
# Esperado: zustand@latest
```

---

### T2.2 — Crear `stores/useAuthStore.js`

**Archivo:** `frontend/src/stores/useAuthStore.js`

```javascript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * SINGLE SOURCE OF TRUTH para autenticación
 * 
 * ✅ Centraliza: user, accessToken, refreshToken, expiresAt
 * ✅ Persiste SOLO en localStorage.__smoke_auth
 * ✅ NO persiste: authStatus, isLoading (revierten en cada app mount)
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // === Estado ===
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      authStatus: 'idle', // 'idle' | 'loading' | 'authenticated' | 'failed'
      
      // === Acciones ===
      setUser: (user) => set({ user }),
      
      setTokens: (accessToken, refreshToken, expiresIn) => {
        // expiresIn es segundos (ej: 900 para 15 min)
        const expiresAt = Date.now() + expiresIn * 1000;
        set({
          accessToken,
          refreshToken,
          expiresAt,
          authStatus: 'authenticated'
        });
      },
      
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          authStatus: 'idle'
        });
      },
      
      isTokenExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        // Considerar expirado si faltan menos de 60 segundos
        return Date.now() >= (expiresAt - 60 * 1000);
      },
      
      isAuthenticated: () => {
        const { user, accessToken } = get();
        return !!user && !!accessToken;
      }
    }),
    {
      name: '__smoke_auth', // localStorage key
      storage: createJSONStorage(() => localStorage),
      // ✅ CRÍTICO: solo persiste tokens y user, NO authStatus/isLoading
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt
      })
    }
  )
);
```

**Checklist:**
- [ ] Crear archivo en `frontend/src/stores/useAuthStore.js`
- [ ] Copiar contenido exactamente
- [ ] Verificar `persist`, `partialize`, `name` están correctos
- [ ] **Testing**: 
  ```javascript
  // En consola del navegador (después de npm run dev)
  import { useAuthStore } from '@/stores/useAuthStore.js'
  const store = useAuthStore()
  console.log(store.isAuthenticated())  // false
  console.log(localStorage.getItem('__smoke_auth'))  // null
  ```

---

### T2.3 — Crear `stores/useUIStore.js`

**Archivo:** `frontend/src/stores/useUIStore.js`

```javascript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Preferencias de UI: tema, idioma, layout
 * ✅ NUNCA se borra en logout (independiente de auth)
 * ✅ Persiste indefinidamente
 */
export const useUIStore = create(
  persist(
    (set) => ({
      // === Estado ===
      theme: 'dark',           // 'dark' | 'light'
      accentColor: '#00D084',  // Color del accent (verde)
      language: 'es',          // 'es' | 'en'
      sidebarCollapsed: false,
      
      // === Acciones ===
      setTheme: (theme) => set({ theme }),
      setAccentColor: (color) => set({ accentColor: color }),
      setLanguage: (lang) => set({ language: lang }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
    }),
    {
      name: '__smoke_ui',
      storage: createJSONStorage(() => localStorage)
      // ✅ SIN partialize: persiste TODO en este store
    }
  )
);
```

**Checklist:**
- [ ] Crear archivo en `frontend/src/stores/useUIStore.js`
- [ ] Copiar contenido
- [ ] Verificar que NO tiene `partialize` (persiste TODO)
- [ ] **Testing**:
  ```javascript
  import { useUIStore } from '@/stores/useUIStore.js'
  const store = useUIStore()
  store.setAccentColor('#FF0000')
  console.log(localStorage.getItem('__smoke_ui'))  // debe contener accentColor
  ```

---

### T2.4 — Crear `stores/useNotificationStore.js` (si no existe)

**Archivo:** `frontend/src/stores/useNotificationStore.js`

```javascript
import { create } from 'zustand';

/**
 * Toast notifications globales
 * No persiste (solo en memoria)
 */
export const useNotificationStore = create((set) => ({
  notifications: [],
  
  addNotification: (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }]
    }));
    
    // Auto-remove después de duration
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        }));
      }, duration);
    }
    
    return id;
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }));
  },
  
  clearAll: () => {
    set({ notifications: [] });
  }
}));
```

**Checklist:**
- [ ] Crear archivo en `frontend/src/stores/useNotificationStore.js`
- [ ] Implementar `addNotification()`, `removeNotification()`, `clearAll()`

---

## FASE 3: FRONTEND API (1 DÍA)

### T3.1 — Crear `api/client.js`

**Archivo:** `frontend/src/api/client.js`

**CRÍTICO: este archivo es el corazón del interceptor**

```javascript
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

console.log('[API] Base URL:', API_URL);

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * INTERCEPTOR DE REQUEST
 * ✅ Agrega token Authorization
 * ✅ Verifica si token está expirado, intenta refresh
 * ✅ Si refresh falla, aborta request y clearAuth
 */
client.interceptors.request.use(
  async (config) => {
    const { accessToken, isTokenExpired, refreshToken } = useAuthStore.getState();
    
    // Si no hay token, dejar pasar (login no lo necesita)
    if (!accessToken) {
      return config;
    }
    
    // Si el token está expirado, intentar refresh ANTES de enviar request
    if (isTokenExpired()) {
      console.log('[API] Token expirado, intentando refresh...');
      
      try {
        const response = await axios.post(`${API_URL}/refresh`, {
          refresh_token: refreshToken
        });
        
        const { access_token, expires_in } = response.data;
        
        // Guardar nuevo token
        useAuthStore.getState().setTokens(access_token, refreshToken, expires_in);
        console.log('[API] Refresh exitoso');
        
        // Usar el nuevo token
        config.headers.Authorization = `Bearer ${access_token}`;
      } catch (error) {
        console.error('[API] Refresh falló, clearing auth', error.message);
        useAuthStore.getState().clearAuth();
        
        // Emitir evento de logout (para que App.jsx se entere)
        window.dispatchEvent(new CustomEvent('auth:logout', {
          detail: { reason: 'refresh_failed' }
        }));
        
        // Rechazar el request original
        return Promise.reject(error);
      }
    } else {
      // Token válido, usarlo
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * INTERCEPTOR DE RESPONSE
 * ✅ Si 401: clearAuth + emitir evento logout
 */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;
    
    if (response?.status === 401) {
      console.error('[API] 401 Unauthorized:', response.data?.detail);
      useAuthStore.getState().clearAuth();
      
      // ✅ EVENTO DE LOGOUT (sin window.location.href)
      window.dispatchEvent(new CustomEvent('auth:logout', {
        detail: { reason: 'session_expired', message: response.data?.detail }
      }));
    }
    
    return Promise.reject(error);
  }
);

export default client;
```

**Checklist:**
- [ ] Crear archivo en `frontend/src/api/client.js`
- [ ] Request interceptor: verificar `isTokenExpired()`, hacer refresh si es necesario
- [ ] Response interceptor: manejar 401 con `clearAuth()` y evento
- [ ] **Testing**: 
  ```bash
  # Terminal 1: npm run dev (frontend)
  # Terminal 2: cd backend && python -m uvicorn main:app --reload
  
  # Abrir DevTools → Console
  import client from '@/api/client.js'
  client.get('/products')  # sin auth
  # Esperado: Network tab muestra request sin Authorization header
  ```

---

### T3.2 — Instalar `axios-retry`

```bash
npm install axios-retry
```

**Actualizar `api/client.js`:**

```javascript
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { useAuthStore } from '../stores/useAuthStore';

// ... código anterior ...

/**
 * Retry automático: 3 intentos con backoff exponencial
 * Aplica a errores de red, 5xx, timeouts
 */
axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response?.status >= 500);
  }
});

export default client;
```

**Checklist:**
- [ ] Instalar `axios-retry`
- [ ] Agregar configuración de retry en `api/client.js`
- [ ] **Testing**: Desconectar internet, intentar request → debe reintentar 3 veces

---

### T3.3 — Crear `api/auth.js`

**Archivo:** `frontend/src/api/auth.js`

```javascript
import client from './client';

/**
 * Endpoints de autenticación
 */
export const loginWithPin = async (username, pin) => {
  const response = await client.post('/login-pin', { username, pin });
  return response.data;
};

export const refreshToken = async (refreshToken) => {
  const response = await client.post('/refresh', { refresh_token: refreshToken });
  return response.data;
};

export const logout = () => {
  // En realidad, logout es solo limpiar el store
  // No hay endpoint de logout en el backend
};
```

**Checklist:**
- [ ] Crear archivo en `frontend/src/api/auth.js`
- [ ] Implementar `loginWithPin()`, `refreshToken()`, `logout()`

---

### T3.4 — Actualizar importes en otras APIs

**Buscar en `frontend/src/api/`:**

```bash
grep -r "axios.create\|axios.get\|axios.post" src/api/
```

**Reemplazar TODOS con:**

```javascript
// Antes:
import axios from 'axios'
const API_URL = 'http://localhost:8000'
const response = await axios.get(`${API_URL}/products`)

// Después:
import client from './client'
const response = await client.get('/products')
```

**Checklist:**
- [ ] Todos los archivos en `frontend/src/api/` usan `client` de `api/client.js`
- [ ] NO hay `axios.create()` duplicados
- [ ] NO hay rutas hardcodeadas (siempre relativas a baseURL)

---

## FASE 4: HOOKS & COMPONENTES (1 DÍA)

### T4.1 — Crear `hooks/useAuth.js`

**Archivo:** `frontend/src/hooks/useAuth.js`

```javascript
import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * Hook que sincroniza el estado de auth con eventos del sistema
 * ✅ Escucha evento 'auth:logout' desde el interceptor
 * ✅ Sincroniza store con localStorage
 */
export const useAuth = () => {
  const authStore = useAuthStore();
  
  useEffect(() => {
    // Listener: cuando el interceptor detecta sesión expirada
    const handleLogout = (event) => {
      console.log('[useAuth] Logout evento recibido:', event.detail);
      authStore.clearAuth();
      // App.jsx re-renderizará automáticamente
    };
    
    window.addEventListener('auth:logout', handleLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [authStore]);
  
  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated(),
    isLoading: authStore.authStatus === 'loading',
    logout: () => authStore.clearAuth()
  };
};
```

**Checklist:**
- [ ] Crear archivo en `frontend/src/hooks/useAuth.js`
- [ ] Implementar escucha de evento `auth:logout`

---

### T4.2 — Actualizar `components/Login/Login.jsx`

**Cambios principales:**

```javascript
import { useAuthStore } from '../../stores/useAuthStore';
import { loginWithPin } from '../../api/auth';
import { useNotificationStore } from '../../stores/useNotificationStore';

export default function Login() {
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);
  const addNotification = useNotificationStore((state) => state.addNotification);
  
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async () => {
    if (!username || !pin) {
      addNotification('Usuario y PIN son requeridos', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      // ✅ Usar loginWithPin del api/auth.js
      const response = await loginWithPin(username, pin);
      
      // ✅ Guardar en store (NO en localStorage)
      setUser(response.user);
      setTokens(response.access_token, response.refresh_token, response.expires_in);
      
      addNotification(`¡Bienvenido ${response.user.username}!`, 'success');
      // App.jsx detectará isAuthenticated() = true y re-renderizará
      
    } catch (error) {
      console.error('[Login] Error:', error);
      addNotification(error.response?.data?.detail || 'Error al iniciar sesión', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // ✅ IMPORTANTE: Eliminar estos
  // - localStorage.setItem('user', ...)
  // - localStorage.setItem('token', ...)
  // - window.location.reload()
  // - window.location.href
  
  return (
    // ... JSX sin cambios en estructura, solo handlers actualizados
  );
}
```

**Checklist:**
- [ ] Importar `useAuthStore`, `loginWithPin`, `useNotificationStore`
- [ ] En `handleLogin()`: usar `setUser()` y `setTokens()` del store
- [ ] Remover TODOS los `localStorage.setItem()` manuales
- [ ] Remover TODOS los `window.location.reload()` / `window.location.href`
- [ ] **Testing**: Hacer login → DevTools localStorage debe mostrar `__smoke_auth`

---

### T4.3 — Actualizar `App.jsx`

**Archivo:** `frontend/src/App.jsx`

```javascript
import { useEffect } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import { useUIStore } from './stores/useUIStore';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import POS from './components/POS/POS';
import { Toaster } from 'react-hot-toast';

export default function App() {
  // ✅ CAMBIO: Leer del store
  const { user, isAuthenticated } = useAuthStore();
  const { theme, accentColor } = useUIStore();
  
  // ✅ Debugging: verifica que el store se rehydrata
  useEffect(() => {
    console.log('[App] Auth state:', { isAuthenticated: isAuthenticated(), user });
  }, [isAuthenticated, user]);
  
  // ✅ Aplicar tema y variables CSS
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme, accentColor]);
  
  // ✅ Si no autenticado, mostrar login
  if (!isAuthenticated()) {
    return <Login />;
  }
  
  // ✅ Renderiza basado en rol
  return (
    <>
      {user?.role === 'admin' ? (
        <Dashboard />
      ) : (
        <POS />
      )}
      <Toaster />
    </>
  );
}
```

**Checklist:**
- [ ] Usar `useAuthStore()` y `useUIStore()` en lugar de localStorage directo
- [ ] Remover props drilling innecesarios
- [ ] Aplicar CSS variables para tema
- [ ] **Testing**: Abrir DevTools Console → debe ver `[App] Auth state: ...`

---

### T4.4 — Remover localStorage Hardcodeado en Toda la App

**Búsqueda:**

```bash
grep -r "localStorage\." frontend/src/ | grep -v node_modules | grep -v ".test."
```

**Por cada línea encontrada, preguntar:**
- ¿Es un token/user? → Usar `useAuthStore`
- ¿Es tema/idioma? → Usar `useUIStore`
- ¿Es otro dato? → Crear nuevo store Zustand o usar store existente

**Checklist:**
- [ ] NO hay `localStorage.setItem('user', ...)`
- [ ] NO hay `localStorage.setItem('token', ...)`
- [ ] NO hay `localStorage.getItem()` manual (solo Zustand persist lo hace)
- [ ] NO hay `localStorage.clear()` (usar `useAuthStore.clearAuth()`)

---

## FASE 5: ASSETS & BUILD (1 DÍA)

### T5.1 — Inventariar Assets

**Ejecutar:**

```bash
find frontend/src -type f \( -name "*.mp4" -o -name "*.png" -o -name "*.jpg" \) -exec ls -lh {} \;
```

**Para cada archivo > 500KB:**
- Mover a `frontend/public/`
- Actualizar import en componente

**Ejemplo:**

```javascript
// Antes:
import smokeMp4 from './assets/smoke.mp4'
<video src={smokeMp4} />

// Después:
<video src="/smoke.mp4" />
```

**Checklist:**
- [ ] Listar todos los assets > 500KB
- [ ] Mover a `frontend/public/`
- [ ] Actualizar rutas en componentes (import → url absoluta)

---

### T5.2 — Actualizar `vite.config.js`

**Archivo:** `frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  // ✅ Alias para imports más limpios
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // ✅ Build configuration
  build: {
    // Cambiar según deploy:
    // - Monolito (backend sirve frontend): outDir: '../backend/dist'
    // - Separado (Vercel): outDir: 'dist'
    outDir: 'dist',
    
    emptyOutDir: true,
    
    // ✅ Sourcemaps solo en dev
    sourcemap: false,
    
    // ✅ Minify + drop console en prod
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    },
    
    // Optimizaciones
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['framer-motion', 'react-hot-toast', 'zustand']
        }
      }
    }
  },
  
  // ✅ Variables de entorno
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'http://localhost:8000'
    )
  },
  
  // ✅ Base URL (si no está en raíz)
  base: '/'
})
```

**Checklist:**
- [ ] Agregar `@` alias para imports
- [ ] Configurar `outDir` según deploy (dist o ../backend/dist)
- [ ] Configurar sourcemaps y minify
- [ ] **Testing**: `npm run build` → debe generar `dist/` sin errores

---

### T5.3 — Crear `.env.production`

**Archivo:** `frontend/.env.production`

```env
# URL del API en producción
VITE_API_URL=https://api.smokerings.railway.app
```

**Archivo:** `frontend/.env.development`

```env
VITE_API_URL=http://localhost:8000
```

**Archivo:** `frontend/.env.example`

```env
VITE_API_URL=http://localhost:8000
```

**Checklist:**
- [ ] Crear `.env.production` con URL real de Railway
- [ ] Crear `.env.development` para local
- [ ] Agregar ambos a `.gitignore`
- [ ] **Testing**: `VITE_API_URL=http://custom npm run build` → verificar en dist/assets/*.js

---

### T5.4 — Verificar Imports de Assets

**Buscar problemas:**

```bash
grep -r "import.*from.*assets" frontend/src/ | head -20
grep -r "require(" frontend/src/
grep -r "new URL(" frontend/src/
```

**Regla:**
- Archivos en `src/assets/` → `import { file } from '@/assets/file'` o `URL dinámico de Vite`
- Archivos en `public/` → rutas absolutas `/archivo`
- Videos/audio grandes → SIEMPRE en `public/`

**Checklist:**
- [ ] No hay rutas relativas frágiles (`../../assets`)
- [ ] Videos en `public/`, referenciados como `/video.mp4`
- [ ] Imágenes pequeñas (<50KB) pueden estar en `src/assets/` importadas
- [ ] **Testing**: `npm run build && npm run preview` → assets cargan sin 404

---

## FASE 6: TESTING & DEPLOY (1-2 DÍAS)

### T6.1 — Testing Local Completo

**Checklist de verificación:**

```bash
# Terminal 1: Backend
cd backend
pip install python-dotenv slowapi  # Si no están
python -m uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Browser
# Abrir http://localhost:5173
```

**Pruebas manuales:**

- [ ] **Login**: Credenciales Geonneitor / 123456
  - Esperado: Entrada a POS/Dashboard, tokens en localStorage.__smoke_auth
  
- [ ] **Red DevTools**: Abrir DevTools → Network
  - [ ] Hacer una acción (ej: listar productos)
  - [ ] Ver request tiene header `Authorization: Bearer <token>`
  - [ ] Response OK (200)

- [ ] **Token expirando**: Esperar 15+ minutos (o mock con DevTools)
  - [ ] Hacer otro request
  - [ ] Console debe mostrar `[API] Token expirado, intentando refresh...`
  - [ ] Request es reintentado con nuevo token
  - [ ] Esperado: "success" sin page reload

- [ ] **Logout**: Botón logout en app
  - [ ] localStorage.__smoke_auth debe borrarse
  - [ ] localStorage.__smoke_ui DEBE PERMANECER
  - [ ] App vuelve a Login

- [ ] **Offline testing**:
  - [ ] DevTools → Network → set Offline
  - [ ] Intentar acción
  - [ ] Esperado: Error amigable (toast)
  - [ ] Volver Online, hacer acción nuevamente
  - [ ] Esperado: Funciona (retry funcionó)

- [ ] **Assets**: DevTools → Sources
  - [ ] Todas las rutas JS/CSS se cargan
  - [ ] NO hay 404s de assets

---

### T6.2 — Deploy Backend (Railway)

**Crear cuenta:**

1. Ir a https://railway.app
2. Sign up con GitHub
3. Conectar repo

**Crear servicio:**

```bash
# En la raíz del proyecto
npm install -g @railway/cli
railway login
railway init

# Seleccionar "Add existing project"
# Elegir carpeta: backend
```

**Configurar variables de entorno en Railway:**

Dashboard → Backend service → Variables:

```
SECRET_KEY=<generated_64_char_key>
DATABASE_URL=postgresql://...  (Railway genera automáticamente)
ENVIRONMENT=production
FRONTEND_URL=https://<vercel-domain>.vercel.app
```

**Deploy:**

```bash
railway up
# Esperado: "Deployment successful"
```

**Testing:**

```bash
curl https://api-<generated>.railway.app/
# Esperado: {"message": "Smoke Rings API is online"}

curl -X POST https://api-<generated>.railway.app/login-pin \
  -H "Content-Type: application/json" \
  -d '{"username":"Geonneitor","pin":"123456"}'
# Esperado: {"access_token": "...", "refresh_token": "...", ...}
```

**Checklist:**
- [ ] Railway service creado
- [ ] Variables de entorno configuradas
- [ ] Deploy exitoso (sin errores)
- [ ] Endpoint / responde
- [ ] Login endpoint funciona

---

### T6.3 — Deploy Frontend (Vercel)

**Crear cuenta:**

1. Ir a https://vercel.com
2. Sign up con GitHub
3. Conectar repo

**Importar proyecto:**

1. Click "New Project"
2. Seleccionar repo
3. Framework: Vite
4. Root directory: `frontend`

**Configurar variables de entorno:**

Project settings → Environment Variables:

```
VITE_API_URL=https://api-<generated>.railway.app
```

**Deploy:**

```
Click "Deploy"
# Esperado: Deployment successful
```

**Testing:**

```bash
# Abrir https://<project>.vercel.app
# Esperado: Login page carga sin errores

# Intentar login con Geonneitor / 123456
# Esperado: Funciona, comunica con Railway backend
```

**Checklist:**
- [ ] Vercel project creado
- [ ] Variables de entorno configuradas
- [ ] Build successful
- [ ] Frontend carga
- [ ] Login funciona contra Railway API

---

### T6.4 — Configurar CORS en Producción

**Backend `main.py` ya tiene esto, pero verificar:**

```python
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
origins = ["http://localhost:5173", "http://localhost:3000"]
if ENVIRONMENT == "production":
    origins = [
        "https://smokerings.app",
        "https://www.smokerings.app",
        os.getenv("FRONTEND_URL", "")  # Vercel URL
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in origins if o],
    ...
)
```

**En Railway, actualizar variable:**

```
FRONTEND_URL=https://<vercel-project>.vercel.app
```

**Re-deploy backend:**

```bash
railway up
```

**Testing:**

```bash
# Abrir Vercel URL, hacer login
# DevTools → Network → debe NO haber errores CORS
```

**Checklist:**
- [ ] CORS origins incluyen Vercel domain
- [ ] Backend re-deployado
- [ ] Login sin CORS errors

---

### T6.5 — Dominio Personalizado (Opcional)

**Comprar dominio:**

- Ir a https://namecheap.com o Google Domains
- Comprar `smokerings.app` (~$12/año)

**Configurar en Vercel:**

Project settings → Domains → Add domain

```
smokerings.app
www.smokerings.app
```

Vercel automáticamente configura DNS.

**Configurar en Railway:**

Custom domain: `api.smokerings.app`

**Testing:**

```bash
curl https://smokerings.app
curl https://api.smokerings.app/
```

**Checklist:**
- [ ] Dominio comprado (opcional)
- [ ] Verificado en Vercel
- [ ] Verificado en Railway

---

## FASE 7: LIMPIEZA & DOCUMENTACIÓN (1 DÍA)

### T7.1 — Remover Código Antiguo

**Búsquedas:**

```bash
# Remover localStorage manuales
grep -r "localStorage.setItem" frontend/src/
grep -r "localStorage.getItem" frontend/src/
grep -r "localStorage.clear" frontend/src/

# Remover window.location
grep -r "window.location" frontend/src/

# Remover console.log de debug (opcional)
grep -r "console.log" frontend/src/ | grep -v "node_modules"
```

**Para cada línea encontrada:**
- Si es genuino debug → dejar con comentario `// DEBUG`
- Si es localStorage → REMOVER (Zustand lo hace)
- Si es window.location → REMOVER (usar eventos)

**Checklist:**
- [ ] NO hay `localStorage.setItem('user', ...)`
- [ ] NO hay `localStorage.setItem('token', ...)`
- [ ] NO hay `localStorage.clear()` (usar store)
- [ ] NO hay `window.location.href = '...'` (usar eventos)
- [ ] NO hay `window.location.reload()` (usar eventos)

---

### T7.2 — Comentarios en Código

**Agregar comentarios:**

```python
# backend/main.py
# ✅ CAMBIO: Agregar comentario explicando por qué
# ✅ NUEVO: Si es código nuevo
# ✅ ACTUALIZADO: Si se modificó
```

```javascript
// frontend/src/...
// ✅ CAMBIO: ...
// ✅ NUEVO: ...
```

**Checklist:**
- [ ] Archivos críticos tienen comentarios explicativos
- [ ] No hay comentarios innecesarios

---

### T7.3 — README.md Actualizado

**Crear/Actualizar:** `README.md` en raíz del proyecto

```markdown
# 🔥 Smoke Rings — POS System

## Setup Local

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Variables de entorno (`.env`):
```env
SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_urlsafe(64))">
DATABASE_URL=sqlite:///./smokerings.db
ENVIRONMENT=development
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Testing

1. Backend: http://localhost:8000
2. Frontend: http://localhost:5173
3. Login: Geonneitor / 123456

## Troubleshooting

### "Login no funciona"
- Verificar backend está corriendo: `curl http://localhost:8000/`
- Ver console del navegador: CORS errors?
- Ver Network tab: request a /login-pin llega?

### "Assets no cargan en Vercel"
- Verificar VITE_API_URL configurado en Vercel
- Verificar archivos en `public/` existen
- Ejecutar `npm run build && npm run preview` localmente

### "Token expirando causa logout"
- Verificar /refresh endpoint funciona: `curl -X POST http://localhost:8000/refresh ...`
- Ver console: "[API] Token expirado, intentando refresh..."?

## Deployment

### Railway (Backend)

```bash
railway init
railway up
```

Configurar variables:
- SECRET_KEY
- ENVIRONMENT=production
- FRONTEND_URL=https://...vercel.app

### Vercel (Frontend)

1. Conectar repo en vercel.com
2. Root directory: `frontend`
3. Agregar variable: VITE_API_URL

## Architecture

- Auth: JWT (15 min access + 7 días refresh)
- Storage: Zustand (memory) + localStorage (persist)
- API: Axios con interceptors inteligentes
- Build: Vite + React
```

**Checklist:**
- [ ] README tiene setup instructions
- [ ] README tiene troubleshooting
- [ ] README tiene deployment steps

---

### T7.4 — Git Commit Final

```bash
git add .
git commit -m "feat: implement refresh token + Zustand auth architecture

- Change ACCESS_TOKEN_EXPIRE_MINUTES to 15 (was 30*24*60)
- Add /refresh endpoint for token renewal
- Create useAuthStore (Zustand) — single source of truth
- Add axios interceptors for automatic token refresh
- Remove window.location.href — use custom events instead
- Separate localStorage.__smoke_auth (tokens) from __smoke_ui (preferences)
- Add get_current_user() dependency — extract seller_id from JWT
- Rate limit /login-pin to 5/minute
- Configure CORS for production deployment
- Update vite.config.js for build optimization

BREAKING: App now requires VITE_API_URL environment variable
"

git push origin main
```

**Checklist:**
- [ ] Commit message descriptivo
- [ ] Todos los cambios staged
- [ ] Push a main (o PR si hay flow)

---

## TROUBLESHOOTING

### "Token keeps expiring / endless logout loop"

**Síntomas:**
- User logs in, after 15 min everything breaks
- Console shows 401 errors
- Page keeps reloading

**Causas:**
1. `/refresh` endpoint no existe → Verificar T1.2
2. `refreshToken` no se guardó → Verificar T4.2 (setTokens call)
3. Token decode falla → Verificar T1.1 (decode_token function)

**Fix:**
```bash
# Verificar refresh endpoint
curl -X POST http://localhost:8000/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<FROM_LOGIN_RESPONSE>"}'
```

---

### "localStorage keeps getting cleared"

**Síntomas:**
- localStorage.__smoke_ui desaparece after logout
- User preferences reset

**Causa:**
- `localStorage.clear()` se está llamando en lugar de `clearAuth()`

**Fix:**
```bash
grep -r "localStorage.clear" frontend/src/
# Reemplazar con:
useAuthStore.getState().clearAuth()
```

---

### "Assets 404 in production"

**Síntomas:**
- Frontend loads, pero CSS/JS no cargan
- DevTools Network: 404 en /assets/...

**Causas:**
1. Archivos no están en `dist/assets/`
2. Rutas relativas inválidas
3. Vite build no ejecutado

**Fix:**
```bash
cd frontend
npm run build
ls dist/assets/  # Verificar archivos están ahí

npm run preview  # Test build localmente
# Abrir http://localhost:4173
```

---

### "CORS error in production"

**Síntomas:**
- Vercel frontend → Railway backend: CORS blocked
- Console: "Access to XMLHttpRequest blocked by CORS"

**Causa:**
- CORS origins en backend no incluyen Vercel domain

**Fix:**
```bash
# En Railway dashboard
ENVIRONMENT=production
FRONTEND_URL=https://<vercel-project>.vercel.app
```

Redeploy backend:
```bash
railway up
```

---

### "npm run build fails"

**Síntomas:**
- `npm run build` error, dist/ no se genera

**Causas:**
- Falta importar algo
- Error en vite.config.js
- Syntax error en componente

**Fix:**
```bash
npm run build 2>&1 | head -50  # Ver primeras líneas del error

# Buscar import faltante
grep -r "import.*undefined" frontend/src/

# Verificar sintaxis
npm run build -- --debug
```

---

### "Refresh token not working"

**Síntomas:**
- [API] Token expirado, pero refresh no funciona
- 401 después

**Checklist:**
1. `/refresh` endpoint existe? → `curl http://localhost:8000/refresh`
2. refreshToken se envía correcto? → Ver Network tab
3. Backend tiene `create_refresh_token()`? → Verificar T1.1
4. `decode_token()` valida `type="refresh"`? → Verificar T1.1

---

## LISTA FINAL DE VERIFICACIÓN

Antes de considerar **DONE**:

### Backend
- [ ] `SECRET_KEY` en `.env` (no en código)
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES = 15`
- [ ] `/refresh` endpoint funciona
- [ ] `get_current_user()` usado en /sales, /inventory
- [ ] `seller_id = current_user.id` (no frontend)
- [ ] CORS restringido
- [ ] `.env` en `.gitignore`
- [ ] `slowapi` instalado y funcionando

### Frontend
- [ ] `useAuthStore` persiste SOLO tokens + user
- [ ] `useUIStore` independiente de auth
- [ ] NO hay `localStorage.setItem()` manual
- [ ] Axios interceptor hace refresh automático
- [ ] NO hay `window.location.href`
- [ ] Assets en `public/` o importados correctamente
- [ ] `VITE_API_URL` desde env, no hardcodeado
- [ ] `npm run build` sin errores

### Testing
- [ ] Login → POS/Dashboard OK
- [ ] Token expira, app refresh automático OK
- [ ] Network offline → error amigable OK
- [ ] Logout → claro __smoke_auth, pero NO __smoke_ui OK
- [ ] Refresh página → mantiene auth OK
- [ ] Vercel+Railway funciona end-to-end OK

### Deployment
- [ ] Backend en Railway (SECRET_KEY, ENVIRONMENT=production)
- [ ] Frontend en Vercel (VITE_API_URL=https://api...)
- [ ] CORS configurado para ambos dominios
- [ ] Dominio personalizado (opcional)

---

## RESUMEN DE ARCHIVOS MODIFICADOS/CREADOS

### Backend

| Archivo | Estado | Cambio |
|---------|--------|--------|
| `auth.py` | Modificado | ✅ Tokens cortos + refresh + decode |
| `main.py` | Reescrito | ✅ /refresh + get_current_user() + SPA |
| `sales.py` | Modificado | ✅ seller_id del JWT |
| `.env` | Creado | ✅ Variables de entorno |
| `.env.example` | Creado | ✅ Template sin secretos |
| `.gitignore` | Modificado | ✅ Agregar .env |

### Frontend

| Archivo | Estado | Cambio |
|---------|--------|--------|
| `stores/useAuthStore.js` | Creado | ✅ Single source of truth |
| `stores/useUIStore.js` | Creado | ✅ Tema independiente |
| `api/client.js` | Reescrito | ✅ Interceptors inteligentes |
| `api/auth.js` | Creado | ✅ Endpoints de auth |
| `hooks/useAuth.js` | Creado | ✅ Sincronización eventos |
| `Login.jsx` | Modificado | ✅ Usar useAuthStore |
| `App.jsx` | Modificado | ✅ Lógica desde store |
| `vite.config.js` | Modificado | ✅ Build optimization |
| `.env.production` | Creado | ✅ API URL producción |
| `.env.development` | Creado | ✅ API URL desarrollo |

---

## CONTACTO & APOYO

Si algo falla:

1. **Verificar orden de fases** — completar T1.1 antes de T1.2, etc.
2. **Ver console** — DevTools muestra errores específicos
3. **Buscar en codebase** — `grep -r "problema" .`
4. **Testing aislado** — `curl` backend antes de frontend

---

**Document Version:** 1.0  
**Last Updated:** Abril 2026  
**Next Review:** Después de first deploy a producción


---

## ?? ESTATUS DE EJECUCI�N T�CNICA

- **Timestamp:** 2026-04-08 13:58
- **Versi�n:** v5.4.12

| Secci�n | Tareas Completadas | Estatus |
|---------|-------------------|---------|
| Fase 1: Backend | T1.1, T1.2, T1.3, T1.4 | ? 100% |
| Fase 2: Stores | T2.1, T2.2, T2.3, T2.4 | ? 100% |
| Fase 3: Frontend API | T3.1, T3.2, T3.3, T3.4 | ? 100% |
| Fase 4: Componentes | T4.1, T4.2, T4.3 | ? 90% |
| Fase 5-7 | N/A | ? Pendiente |
