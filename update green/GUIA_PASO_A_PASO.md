# 🎯 GUÍA PASO A PASO: Limpieza y Despliegue de Chinches Finanzas

## 📌 RESUMEN RÁPIDO

```
PASO 1: Ejecutar script de limpieza (5 min)
        ↓
PASO 2: Revisar archivos creados (5 min)
        ↓
PASO 3: Hacer push a GitHub (5 min)
        ↓
PASO 4: Conectar a Railway (10 min)
        ↓
PASO 5: Configurar variables y BD (5 min)
        ↓
PASO 6: Deploy y pruebas (10 min)

⏱️ TIEMPO TOTAL: ~45 minutos
```

---

## ✅ PASO 1: EJECUTAR SCRIPT DE LIMPIEZA

### Si usas Windows (Recomendado)

**Opción A: Ejecución rápida**
```bash
# 1. Abre PowerShell como Administrador
# 2. Navega a tu proyecto:
cd "C:\Users\USER END\Desktop\Chinches Finanzas"

# 3. Descarga el script (lo tengo aquí: cleanup_chinches.bat)
# O cópialo y pégalo en un archivo llamado cleanup.bat en la carpeta raíz

# 4. Ejecuta:
.\cleanup.bat
```

**Opción B: Paso a paso manual**

Si prefieres hacerlo manualmente, ve a **SECCIÓN MANUAL** más abajo.

### Si usas macOS/Linux

```bash
# 1. Navega a tu proyecto
cd /ruta/a/chinches-finanzas

# 2. Descarga el script (cleanup_chinches.sh)
# O cópialo manualmente

# 3. Dale permisos de ejecución
chmod +x cleanup_chinches.sh

# 4. Ejecuta
./cleanup_chinches.sh
```

---

## ✅ PASO 2: VERIFICAR QUE FUNCIONÓ

El script crea estos archivos:

```
Chinches Finanzas/
├── .env.example      ✅ NUEVO
├── .gitignore        ✅ NUEVO
├── Procfile          ✅ NUEVO
├── README.md         ✅ NUEVO (actualizado)
├── CHANGELOG.md      ✅ NUEVO
├── requirements.txt  ✅ SIN CAMBIOS
├── backend/
│   └── main.py       ✅ SIN CAMBIOS
└── ... (resto del proyecto)
```

**Verifica que todos estos archivos existan:**

```bash
ls -la .env.example
ls -la .gitignore
ls -la Procfile
ls -la README.md
ls -la CHANGELOG.md
```

---

## ✅ PASO 3: ACTUALIZAR .env.example CON TUS VALORES

**Importante:** El script creo un `.env.example` genérico. Ahora debes personalizarlo:

```bash
# Abre el archivo .env.example
cat .env.example
# O ábrelo en tu editor: code .env.example
```

**Revisa y ajusta:**

```env
# Si tu archivo principal es app.py en lugar de main.py:
# Cambia en Procfile:
# web: gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.app:app

# Si tienes requirements.txt en backend/, debe estar en raíz
# Si tienes dependencias adicionales, agrégalas

# Si usas CORS con otro dominio:
ALLOWED_ORIGINS=tu_dominio.netlify.app

# Si tu API tiene otro título:
API_TITLE=Mi API Custom
```

---

## ✅ PASO 4: CREAR REPOSITORIO EN GITHUB

**Si TIENES repositorio remoto:**
```bash
git status  # Verificar que hay cambios
git add .
git commit -m "setup: Add configuration and deployment files"
git push origin main
```

**Si NO tienes repositorio remoto:**

1. Ir a https://github.com/new
2. Crear repositorio: `chinches-finanzas`
3. Ejecutar en tu terminal:

```bash
git init
git add .
git commit -m "Initial commit: FastAPI backend with JWT auth"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/chinches-finanzas.git
git push -u origin main
```

**Reemplaza:**
- `TU_USUARIO` por tu usuario de GitHub
- `chinches-finanzas` por el nombre que pusiste

---

## ✅ PASO 5: CREAR PROYECTO EN RAILWAY

### 5.1 Ir a Railway

```
https://railway.app
```

### 5.2 Crear proyecto

1. Click en **"New Project"**
2. Seleccionar **"Deploy from GitHub"**
3. Conectar tu cuenta GitHub (si es la primera vez)
4. Seleccionar el repositorio `chinches-finanzas`
5. Click en **"Create"**

**Railway detecta automáticamente que es Python**

### 5.3 Configurar el Servicio

En Railway dashboard:

1. **Pestaña "Variables"**
   - Click en "Add Variable"
   - Agregar estas variables:

```
SECRET_KEY=xyz123abc456...   (generar abajo ↓)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
API_TITLE=Chinches Finanzas API
API_VERSION=1.0.0
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=INFO
ALLOWED_ORIGINS=https://tu-frontend.netlify.app
```

**Para generar SECRET_KEY fuerte:**

```bash
# En tu terminal:
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Ejemplo de output:
# aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5z

# Copia ese valor a RAILWAY en SECRET_KEY
```

### 5.4 Agregar Base de Datos PostgreSQL

1. En Railway, click en **"Add Service"**
2. Seleccionar **"PostgreSQL"**
3. **Esperar** a que se cree (2-3 minutos)
4. Railway **automáticamente** genera `DATABASE_URL`

**No necesitas hacer nada más - Railway añade automáticamente la variable**

---

## ✅ PASO 6: VERIFICAR QUE TODO FUNCIONA

### 6.1 Esperar el Deploy

En Railway:
- Pestaña "Deployments"
- Esperar a que cambie de "Deploying..." a "Success" ✅
- Toma 3-5 minutos

### 6.2 Obtener URL de tu API

En Railway:
1. Click en el servicio (backend)
2. Pestaña "Settings"
3. Buscar **"Networking"**
4. Copiar **"Public URL"** (ejemplo: `https://chinches-finanzas-production.up.railway.app`)

### 6.3 Probar que funciona

```bash
# Reemplaza URL por la tuya
curl https://chinches-finanzas-production.up.railway.app/health

# Deberías ver:
# {"status":"healthy","environment":"production","version":"1.0.0"}
```

### 6.4 Ver Documentación Interactiva

Ir a: `https://tu-url-railway.app/docs`

Deberías ver Swagger UI con todos tus endpoints.

### 6.5 Revisar Logs

En Railway:
1. Click en el servicio
2. Pestaña "Logs"
3. Scroll down para ver los logs más recientes
4. **Si NO hay errores en rojo, ¡todo está bien!** ✅

---

## ✅ PASO 7: CONECTAR FRONTEND (SI LO TIENES)

Si tienes una aplicación React/Vue:

### 7.1 Actualizar .env del Frontend

```env
REACT_APP_API_URL=https://tu-url-railway.app
```

### 7.2 Actualizar llamadas a API

Ejemplo con Fetch:

```javascript
// Antes
const response = await fetch('http://localhost:5000/usuarios');

// Después
const API_URL = process.env.REACT_APP_API_URL;
const response = await fetch(`${API_URL}/usuarios`);
```

### 7.3 Ejemplo con Login (usando JWT)

```javascript
// Login
const loginResponse = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'user', password: 'pass' })
});

const { access_token } = await loginResponse.json();
localStorage.setItem('token', access_token);

// Usar token en requests
const response = await fetch(`${API_URL}/usuarios`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

## ❌ TROUBLESHOOTING: PROBLEMAS COMUNES

### Problema 1: Error "ModuleNotFoundError"

**Síntoma:** En los logs de Railway ves `ImportError` o `ModuleNotFoundError`

**Solución:**
```bash
# 1. Verificar que requirements.txt tiene todas las dependencias:
cat requirements.txt

# 2. Agregar si falta algo:
pip install dependencia-faltante
pip freeze > requirements.txt

# 3. Hacer push:
git add requirements.txt
git commit -m "Update requirements"
git push
```

### Problema 2: Error "Port already in use"

**Síntoma:** "Address already in use" en logs

**Solución:** Tu código ya usa port dinámico, no es problema de Railway.

### Problema 3: Error de Base de Datos

**Síntoma:** `OperationalError: database is locked` o conexión rechazada

**Solución 1 - Si es SQLite:**
```bash
# Cambiar DATABASE_URL en Railway a:
DATABASE_URL=sqlite:///./app.db
```

**Solución 2 - Si es PostgreSQL:**
```bash
# Verificar que PostgreSQL está agregado en Railway
# Railway debe mostrar una variable DATABASE_URL automáticamente
# Si no, volver a agregar PostgreSQL
```

### Problema 4: Error CORS

**Síntoma:** "Access to XMLHttpRequest has been blocked by CORS policy"

**Solución:** En Railway, actualizar variable:
```
ALLOWED_ORIGINS=https://tu-frontend.netlify.app,https://otra-url.com
```

### Problema 5: 401 Unauthorized en requests

**Síntoma:** Requests a `/usuarios` devuelven 401

**Solución:** Falta agregar Bearer token:
```javascript
headers: {
  'Authorization': `Bearer ${tuToken}`
}
```

---

## 📋 SECCIÓN MANUAL: Si el Script No Funciona

Si el script no funcionó, aquí cómo hacerlo manualmente:

### Crear .env.example

```bash
# Windows
echo DATABASE_URL=sqlite:///./app.db > .env.example
echo SECRET_KEY=your_secret_key >> .env.example
echo ALGORITHM=HS256 >> .env.example
echo ENVIRONMENT=development >> .env.example
```

### Crear Procfile

```bash
echo web: gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app > Procfile
```

### Crear .gitignore (copy-paste)

Copia el contenido de `.gitignore` de mi guía anterior a un archivo.

---

## ✅ CHECKLIST FINAL

Antes de dar por terminado, verifica:

- [ ] Script ejecutado (o manual completado)
- [ ] `.env.example` creado ✅
- [ ] `Procfile` creado ✅
- [ ] `.gitignore` creado ✅
- [ ] `README.md` actualizado ✅
- [ ] `CHANGELOG.md` creado ✅
- [ ] Push a GitHub completado ✅
- [ ] Proyecto creado en Railway ✅
- [ ] PostgreSQL agregada en Railway ✅
- [ ] Variables de entorno configuradas ✅
- [ ] Deploy completado (Status: Success) ✅
- [ ] Health check funciona: `/health` ✅
- [ ] Docs disponibles: `/docs` ✅
- [ ] Logs sin errores ✅
- [ ] Frontend conectado (si lo tienes) ✅

---

## 🎓 SIGUIENTES PASOS (Opcionales)

1. **Agregar dominio personalizado:** `chinches-finanzas.tu-dominio.com`
2. **Configurar CI/CD:** Tests automáticos antes de deploy
3. **Backup automático:** Base de datos en Railway
4. **Monitoreo:** Sentry para errores, Datadog para logs
5. **API versioning:** `/api/v1/usuarios`, `/api/v2/usuarios`

---

## 📞 PREGUNTAS FRECUENTES

**P: ¿Por qué usar PostgreSQL en producción y no SQLite?**
R: SQLite solo funciona bien para una conexión. Railway puede tener múltiples instancias.

**P: ¿Puedo cambiar de Railway a Heroku después?**
R: Sí, el código es agnóstico. Railway es mejor ahora.

**P: ¿Cómo agrego más variables de entorno?**
R: Railway → Variables → "Add Variable" → Nombre y valor → Save

**P: ¿Mi base de datos se borra al redeploy?**
R: No. PostgreSQL está separada. SQLite sí se resetea.

**P: ¿Cómo veo los logs en tiempo real?**
R: Railway Dashboard → Logs (tab) → Scroll down

---

## 🎉 ¡LO HICISTE!

Una vez completado todo, tienes:

✅ **API en producción** en Railway
✅ **Base de datos PostgreSQL** administrada
✅ **Autenticación JWT** funcionando
✅ **Documentación automática** en Swagger
✅ **Rate limiting** activo
✅ **CORS** configurado
✅ **Logs y monitoreo** de Railway

**Tu Chinches Finanzas está VIVA en internet.** 🚀

---

**¿Dudas en algún paso? Pregúntame cualquier cosa.**
