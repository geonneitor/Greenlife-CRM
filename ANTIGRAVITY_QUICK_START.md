# ⚡ SMOKE RINGS — ANTIGRAVITY QUICK START
## Checklist Visual & Referencia Rápida

---

## 🎯 OBJETIVO FINAL

```
ANTES:                          DESPUÉS:
Token → Error 401            Token → Auto-refresh → OK
localStorage.clear() TODO    localStorage solo auth tokens
window.location.reload()     Events + Zustand store
seller_id = frontend ❌      seller_id = JWT ✅
```

**Tiempo:** 4-5 días | **Complejidad:** Media | **Riesgo:** Bajo

---

## 📊 ROADMAP VISUAL

```
FASE 1: Backend (1-2 días)
├─ T1.1: auth.py — Tokens cortos + refresh
├─ T1.2: main.py — Reescribir completamente
├─ T1.3: sales.py — seller_id desde JWT
├─ T1.4: .env — Variables de entorno
└─ T1.5: Rate limiting (opcional)

FASE 2: Frontend Stores (1 día)
├─ T2.1: Instalar Zustand
├─ T2.2: useAuthStore.js — Single source of truth
├─ T2.3: useUIStore.js — Tema independiente
└─ T2.4: useNotificationStore.js

FASE 3: Frontend API (1 día)
├─ T3.1: api/client.js — Interceptors mágicos
├─ T3.2: axios-retry — 3 intentos automáticos
└─ T3.3: api/auth.js — Endpoints centralizados

FASE 4: Componentes (1 día)
├─ T4.1: useAuth.js — Hook de sincronización
├─ T4.2: Login.jsx — Usar useAuthStore
├─ T4.3: App.jsx — Lógica desde store
└─ T4.4: Remover localStorage manuales

FASE 5: Assets & Build (1 día)
├─ T5.1: Mover assets > 500KB a public/
├─ T5.2: vite.config.js — Optimización
├─ T5.3: .env.production — API URL real
└─ T5.4: Verificar imports

FASE 6: Testing & Deploy (1-2 días)
├─ T6.1: Testing local completo
├─ T6.2: Deploy backend (Railway)
├─ T6.3: Deploy frontend (Vercel)
├─ T6.4: CORS en producción
└─ T6.5: Dominio personalizado (opt)

FASE 7: Limpieza (1 día)
├─ T7.1: Remover código antiguo
├─ T7.2: Comentarios en código
├─ T7.3: README.md actualizado
└─ T7.4: Git commit final
```

---

## 🔧 TAREAS CRÍTICAS (DO NOT SKIP)

### ❌ CRÍTICO #1: Backend `auth.py`

```python
# CAMBIO 1: Duración del token
- ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  ❌
+ ACCESS_TOKEN_EXPIRE_MINUTES = 15             ✅

# CAMBIO 2: Nueva función
+ def create_refresh_token(data, expires_delta=None):
+     # ... (copiar exactamente del blueprint)

# CAMBIO 3: Nueva clase
+ class TokenData(BaseModel):
+     user_id: int
+     username: str
+     role: str

# CAMBIO 4: Nueva función
+ def decode_token(token: str) -> Optional[TokenData]:
+     # ... (copiar exactamente del blueprint)
```

**Testing:**
```bash
python -c "from auth import create_refresh_token; print(len(create_refresh_token({'sub': 'test', 'user_id': 1})) > 50)"
# Esperado: True
```

---

### ❌ CRÍTICO #2: Backend `main.py`

**REESCRIBIR COMPLETAMENTE** — no es un patch, es un rewrite.

```python
# NUEVO: Dependencia
+ def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
+     # Extrae user_id del JWT

# MODIFICADO: /login-pin
- return {"access_token": ..., "user": ...}
+ return {"access_token": ..., "refresh_token": ..., "expires_in": ..., "user": ...}

# NUEVO: /refresh endpoint
+ @app.post("/refresh")
+ async def refresh_access_token(data: dict, db: Session = Depends(get_db)):
+     # Valida refreshToken, emite nuevo accessToken

# NUEVO: SPA fallback
+ @app.get("/{full_path:path}")
+ async def serve_spa(full_path: str):
+     # Si no es /api/*, devuelve index.html
```

**Testing:**
```bash
# Terminal 1: cd backend && python -m uvicorn main:app --reload

# Terminal 2: Test login
curl -X POST http://localhost:8000/login-pin \
  -H "Content-Type: application/json" \
  -d '{"username":"Geonneitor","pin":"123456"}'

# Esperado: {"access_token": "...", "refresh_token": "...", "expires_in": 900, ...}
```

---

### ❌ CRÍTICO #3: Frontend `stores/useAuthStore.js`

```javascript
// IMPORTS
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// STORE
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      authStatus: 'idle',
      
      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken, expiresIn) => {
        const expiresAt = Date.now() + expiresIn * 1000;
        set({ accessToken, refreshToken, expiresAt, authStatus: 'authenticated' });
      },
      clearAuth: () => set({ ... reset all ...}),
      isTokenExpired: () => { ... },
      isAuthenticated: () => { ... }
    }),
    {
      name: '__smoke_auth',
      storage: createJSONStorage(() => localStorage),
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

**Testing:**
```javascript
// DevTools Console
import { useAuthStore } from '@/stores/useAuthStore.js'
const store = useAuthStore()
console.log(store.isAuthenticated())  // false
console.log(localStorage.__smoke_auth)  // null
```

---

### ❌ CRÍTICO #4: Frontend `api/client.js` Interceptor

```javascript
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

const client = axios.create({ baseURL: API_URL, timeout: 10000 });

// REQUEST INTERCEPTOR
client.interceptors.request.use(async (config) => {
  const { accessToken, isTokenExpired, refreshToken } = useAuthStore.getState();
  
  if (!accessToken) return config;
  
  if (isTokenExpired()) {
    try {
      const response = await axios.post(`${API_URL}/refresh`, {
        refresh_token: refreshToken
      });
      useAuthStore.getState().setTokens(
        response.data.access_token,
        refreshToken,
        response.data.expires_in
      );
      config.headers.Authorization = `Bearer ${response.data.access_token}`;
    } catch (error) {
      useAuthStore.getState().clearAuth();
      window.dispatchEvent(new CustomEvent('auth:logout', {
        detail: { reason: 'refresh_failed' }
      }));
      return Promise.reject(error);
    }
  } else {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  
  return config;
});

// RESPONSE INTERCEPTOR
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.dispatchEvent(new CustomEvent('auth:logout', {
        detail: { reason: 'session_expired' }
      }));
    }
    return Promise.reject(error);
  }
);

export default client;
```

**Testing:**
```bash
# Abrir DevTools → Network
# Hacer request (ej: GET /products)
# Ver Authorization header: "Bearer <token>"
```

---

## 📋 CHECKLIST POR DÍA

### DÍA 1 (Mañana): Backend

```
[ ] T1.1: auth.py actualizado
    - [ ] ACCESS_TOKEN = 15
    - [ ] create_refresh_token() existe
    - [ ] TokenData clase
    - [ ] decode_token() función
    - [ ] Testing con curl login

[ ] T1.2: main.py reescrito
    - [ ] get_current_user() dependencia
    - [ ] /login-pin devuelve refresh_token
    - [ ] /refresh endpoint funciona
    - [ ] SPA fallback existe
    - [ ] Testing con curl refresh

[ ] T1.3: sales.py actualizado
    - [ ] create_sale() usa current_user
    - [ ] seller_id = current_user.id
    - [ ] get_sales() filtra por usuario
    - [ ] Testing: POST /sales/ sin seller_id param

[ ] T1.4: .env creado
    - [ ] SECRET_KEY generado y guardado
    - [ ] ENVIRONMENT=development
    - [ ] .gitignore actualizado
    - [ ] .env.example sin secretos

[ ] T1.5: Rate limiting (opcional)
    - [ ] slowapi instalado
    - [ ] /login-pin decorado con @limiter.limit()
    - [ ] Testing: 6 requests rápidos → 429
```

**Fin del día 1 esperado:**
- ✅ Backend completamente refactrizado
- ✅ Login devuelve refresh_token
- ✅ /refresh endpoint funciona
- ✅ seller_id extraído del JWT

---

### DÍA 2 (Mañana): Frontend Stores

```
[ ] T2.1: Zustand instalado
    - [ ] npm install zustand
    - [ ] npm list zustand → debe mostrar versión

[ ] T2.2: useAuthStore.js creado
    - [ ] Archivo en frontend/src/stores/
    - [ ] persist() + partialize configurado
    - [ ] Métodos: setUser, setTokens, clearAuth, isTokenExpired, isAuthenticated
    - [ ] Testing en console: store.isAuthenticated() === false

[ ] T2.3: useUIStore.js creado
    - [ ] Archivo en frontend/src/stores/
    - [ ] NO tiene partialize (persiste TODO)
    - [ ] Métodos: setTheme, setAccentColor, setLanguage, toggleSidebar
    - [ ] Testing: store.setAccentColor(), localStorage contiene value

[ ] T2.4: useNotificationStore.js creado
    - [ ] Archivo en frontend/src/stores/
    - [ ] Métodos: addNotification, removeNotification, clearAll
    - [ ] No persiste (solo memory)
```

**Fin del día 2 esperado:**
- ✅ 3 stores Zustand funcionando
- ✅ localStorage tiene __smoke_auth y __smoke_ui

---

### DÍA 3 (Mañana & Tarde): Frontend API

```
[ ] T3.1: client.js reescrito
    - [ ] Archivo en frontend/src/api/
    - [ ] axios.create() con baseURL
    - [ ] Request interceptor: refresh automático
    - [ ] Response interceptor: 401 handling
    - [ ] Emite evento auth:logout
    - [ ] Testing: Network headers tienen Authorization

[ ] T3.2: axios-retry instalado
    - [ ] npm install axios-retry
    - [ ] axiosRetry() configurado en client.js
    - [ ] 3 intentos con backoff exponencial
    - [ ] Testing: desconectar internet, reintentar

[ ] T3.3: auth.js creado
    - [ ] Archivo en frontend/src/api/
    - [ ] loginWithPin(username, pin)
    - [ ] refreshToken(refreshToken)
    - [ ] logout()

[ ] T3.4: Otros APIs actualizados
    - [ ] Todos usan `import client from './client'`
    - [ ] NO hay axios.create() duplicados
    - [ ] NO hay rutas hardcodeadas
```

**Fin del día 3 esperado:**
- ✅ API client con interceptors funcionando
- ✅ Todas las requests incluyen Authorization header
- ✅ Token expira automáticamente y se refresca

---

### DÍA 4 (Mañana & Tarde): Componentes

```
[ ] T4.1: useAuth.js hook creado
    - [ ] Archivo en frontend/src/hooks/
    - [ ] Escucha evento 'auth:logout' de window
    - [ ] Retorna { user, isAuthenticated, isLoading, logout }

[ ] T4.2: Login.jsx actualizado
    - [ ] Importa useAuthStore, loginWithPin, useNotificationStore
    - [ ] handleLogin() llama setUser() y setTokens()
    - [ ] NO hay localStorage.setItem()
    - [ ] NO hay window.location.reload()
    - [ ] Testing: Login → tokens en store

[ ] T4.3: App.jsx actualizado
    - [ ] Importa useAuthStore, useUIStore
    - [ ] Lógica: isAuthenticated() ? Dashboard : Login
    - [ ] useEffect para aplicar tema (CSS variables)
    - [ ] Testing: Abrir app → debe elegir Screen basado en auth

[ ] T4.4: Remover localStorage manuales
    - [ ] grep -r "localStorage.setItem" frontend/src/
    - [ ] grep -r "localStorage.clear" frontend/src/
    - [ ] grep -r "window.location" frontend/src/
    - [ ] Reemplazar TODO con store methods o eventos
    - [ ] Testing: Ninguno de estos strings encontrado
```

**Fin del día 4 esperado:**
- ✅ Login funciona, guarda en store
- ✅ App decide qué mostrar basado en store
- ✅ Logout funciona sin page reload
- ✅ NO hay localStorage manuales

---

### DÍA 5 (Mañana & Tarde): Assets & Deploy

```
[ ] T5.1: Assets inventariados
    - [ ] find frontend/src -type f -name "*.mp4" -o -name "*.mp3"
    - [ ] Archivos > 500KB → mover a public/
    - [ ] Actualizar componentes: import → /archivo

[ ] T5.2: vite.config.js actualizado
    - [ ] Alias @: path.resolve __dirname ./src
    - [ ] build.outDir, minify, terserOptions
    - [ ] define: VITE_API_URL desde env
    - [ ] base: '/'
    - [ ] Testing: npm run build → dist/ sin errores

[ ] T5.3: .env.production creado
    - [ ] VITE_API_URL=https://api-railway...
    - [ ] En .gitignore

[ ] T5.4: Verificar imports
    - [ ] grep -r "import.*assets" frontend/src/
    - [ ] Revisar manualmente
    - [ ] Testing: npm run build && npm run preview

[ ] T6.1: Testing local COMPLETO
    - [ ] Backend corriendo
    - [ ] Frontend corriendo
    - [ ] Login → OK
    - [ ] Hacer venta → OK
    - [ ] Token expira → refresh automático → OK
    - [ ] Logout → OK
    - [ ] Offline → error amigable → OK

[ ] T6.2: Deploy Railway backend
    - [ ] railway login
    - [ ] railway init
    - [ ] SECRET_KEY, ENVIRONMENT=production configurados
    - [ ] railway up
    - [ ] Testing: curl https://api-xxx.railway.app/

[ ] T6.3: Deploy Vercel frontend
    - [ ] Conectar repo en vercel.com
    - [ ] Root directory: frontend
    - [ ] VITE_API_URL=https://api-xxx.railway.app
    - [ ] Vercel deploy
    - [ ] Testing: https://xxx.vercel.app/ → login funciona

[ ] T6.4: CORS configurado
    - [ ] Railway: FRONTEND_URL=https://xxx.vercel.app
    - [ ] railway up (redeploy)
    - [ ] Testing: Vercel → Railway sin CORS errors

[ ] T7.1 through T7.4: Cleanup & Docs
    - [ ] Remover código antiguo
    - [ ] Comentarios en código
    - [ ] README.md actualizado
    - [ ] Git commit final
```

**Fin del día 5 esperado:**
- ✅ Backend en Railway
- ✅ Frontend en Vercel
- ✅ Login end-to-end funciona
- ✅ Producción lista

---

## 🚨 PROBLEMAS FRECUENTES & FIXES

| Problema | Check | Fix |
|----------|-------|-----|
| Login falla | 401 error | `/refresh` endpoint existe? Verificar T1.2 |
| Assets 404 | Network tab | Archivos en `public/`? Verificar T5.1 |
| CORS error | Network headers | Railway CORS origins configurados? T6.4 |
| Token no refresh | Console log | Request interceptor activo? T3.1 |
| Store vacío | localStorage | Zustand persist configurado? T2.2 |
| Build error | npm run build | Syntax error? Falta import? Ver stderr |

---

## ✅ CRITERIOS DE ACEPTACIÓN

```
ANTES ❌                        DESPUÉS ✅
─────────────────────────────────────────────────────
Token expire → logout          Token expire → auto-refresh
localStorage.clear() TODO      localStorage.__smoke_auth + __smoke_ui
window.location.reload()       Custom events
seller_id = frontend param     seller_id = JWT extracted
No refresh endpoint            /refresh endpoint + interceptor
localStorage.setItem() manual  Zustand persist automatic
localStorage.getItem()         useAuthStore hooks
No retry logic                 axios-retry 3 intentos
SQLite only                    Railway + Vercel ready
```

---

## 📞 SOPORTE RÁPIDO

**Si algo falla en T1.1:**
- Verificar `python -c "from auth import create_refresh_token"`
- Error? → Copiar código exactamente del blueprint

**Si algo falla en T1.2:**
- Verificar `curl http://localhost:8000/` responde
- Error 404? → Backend no está corriendo

**Si algo falla en T2.2:**
- Verificar `npm list zustand` muestra versión
- No? → `npm install zustand`

**Si algo falla en T3.1:**
- Verificar Network tab Authorization header existe
- No? → Request interceptor no se ejecutó

**Si algo falla en T6.1:**
- DevTools Console: `[App] Auth state: ...` debe estar
- No? → App.jsx no importa useAuthStore

---

## 📊 PROGRESS TRACKER

```
Día 1: ████░░░░░░░░░░░░ 25% (Backend)
Día 2: ████████░░░░░░░░ 50% (Stores)
Día 3: ████████████░░░░ 75% (API)
Día 4: ████████████████ 100% (Componentes)
Día 5: ████████████████ 100% (Deploy + Tests)
```

**Total:** ~30 horas de trabajo

---

## 🎓 CONCEPTOS CLAVE

### Zustand vs localStorage
```javascript
// ❌ ANTES
localStorage.setItem('user', JSON.stringify(user))
const user = JSON.parse(localStorage.getItem('user'))

// ✅ DESPUÉS
const { setUser, user } = useAuthStore()  // Memory
// persist middleware automaticamente guarda en localStorage
```

### Tokens cortos + Refresh
```javascript
// ❌ ANTES
1 token de 30 días = si se filtra, hacked por 30 días

// ✅ DESPUÉS
access token: 15 min (corto, poco riesgo)
refresh token: 7 días (guardado seguro)
Si access expira, pedir nuevo sin re-login
Si refresh expira, login de nuevo
```

### Interceptor Inteligente
```javascript
// ❌ ANTES
Request sin token → 401 → logout

// ✅ DESPUÉS
Request sin token → OK (ej: login)
Request con token expirado → auto-refresh → OK
Request realmente sin permisos → 401 → logout
```

---

## 🏁 FINISH LINE

```
Cuando TERMINES:

1. ✅ Backend: 8 archivos modificados/creados
2. ✅ Frontend: 12 archivos modificados/creados
3. ✅ Testing: Todos los scenarios pasados
4. ✅ Deploy: Railway + Vercel funcionando
5. ✅ Docs: README.md actualizado
6. ✅ Git: Commit con mensaje descriptivo

RESULTADO:
→ Sistema "indestructible" ante fallos de red
→ Tokens se renuevan automáticamente
→ No hay reloads innecesarios
→ Storage separado (auth vs preferences)
→ Listo para producción
```

---

**Blueprint Version:** 1.0  
**Est. Time:** 4-5 días (40 horas)  
**Complexity:** ⭐⭐⭐ Medium  
**Risk:** ⭐ Low

**¡Suerte, Antigravity!** 🚀


---

## ?? REPORTE DE AVANCE - ANTIGRAVITY

- **Fecha y Hora:** 08 de Abril, 2026 - 13:55
- **Versi�n del Sistema:** v5.4.12
- **Estatus:** 80% General

### ?? HITOS COMPLETADOS
- [x] **Backend (Fase 1):** Auth funcional con refresh tokens y JWT re-estructurado.
- [x] **Stores (Fase 2):** Implementaci�n de Zustand (Auth, UI, Notifications) con persistencia.
- [x] **API Client (Fase 3):** Cliente Axios con robustez, interceptores y reintentos (v�a client.js).
- [x] **Componentes (Fase 4):** Hook useAuth integrado; Login.jsx din�mico; App.jsx migrado a stores.

### ?? POR EJECUTAR
- [ ] **Assets & Build (Fase 5):** Limpieza de archivos pesados y optimizaci�n de build.
- [ ] **Deploy (Fase 6):** Despliegue oficial en Railway y Vercel.
- [ ] **Limpieza Final (Fase 7):** Auditor�a de c�digo legacy y comentarios.
