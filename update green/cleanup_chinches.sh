#!/bin/bash

# ========================================
# Script de Limpieza - Chinches Finanzas
# ========================================
# Este script automatiza la limpieza y configuración del proyecto

echo "🧹 Iniciando limpieza de Chinches Finanzas..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ========================================
# PASO 1: Verificar que estamos en la raíz del proyecto
# ========================================
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}❌ Error: No estoy en la raíz del proyecto${NC}"
    echo "   Este script debe ejecutarse desde la carpeta raíz de Chinches Finanzas"
    echo "   Donde está 'requirements.txt'"
    exit 1
fi

echo -e "${GREEN}✅ Estructura correcta detectada${NC}"
echo ""

# ========================================
# PASO 2: Crear estructura de carpetas si no existe
# ========================================
echo "📁 Verificando estructura de carpetas..."

if [ ! -d "backend" ]; then
    mkdir -p backend
    echo -e "${YELLOW}⚠️  Carpeta 'backend' creada${NC}"
fi

if [ -f "backend/requirements.txt" ]; then
    echo -e "${GREEN}✅ requirements.txt en backend/ encontrado${NC}"
elif [ -f "requirements.txt" ]; then
    echo -e "${YELLOW}⚠️  requirements.txt en raíz (se recomienda en backend/)${NC}"
fi

echo ""

# ========================================
# PASO 3: Crear archivos de configuración
# ========================================
echo "📝 Creando archivos de configuración..."

# Crear .env.example
cat > .env.example << 'EOF'
# ========================================
# CHINCHES FINANZAS - VARIABLES DE ENTORNO
# ========================================

# BASE DE DATOS
# Desarrollo: SQLite
DATABASE_URL=sqlite:///./app.db

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

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://chinches-finanzas.netlify.app

# RATE LIMITING
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900

# AMBIENTE
ENVIRONMENT=development
DEBUG=False
LOG_LEVEL=INFO
EOF

echo -e "${GREEN}✅ .env.example creado${NC}"

# Crear Procfile para Railway
cat > Procfile << 'EOF'
web: gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app
EOF

echo -e "${GREEN}✅ Procfile creado${NC}"

# Crear .gitignore
cat > .gitignore << 'EOF'
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
EOF

echo -e "${GREEN}✅ .gitignore creado${NC}"

echo ""

# ========================================
# PASO 4: Crear README.md
# ========================================
echo "📄 Creando README.md..."

cat > README.md << 'EOF'
# 💰 Chinches Finanzas

Sistema de gestión de finanzas construido con FastAPI y SQLAlchemy.

## 🚀 Características

- 📊 Dashboard de análisis financiero
- 🔐 Autenticación con JWT
- 💼 Gestión de transacciones
- 📈 Reportes y análisis
- 🔒 Control de acceso basado en roles

## 📋 Requisitos Previos

- Python 3.9+
- pip o poetry
- Git
- SQLite (incluido en Python)

## 🔧 Instalación Local

### 1. Clonar repositorio

```bash
git clone https://github.com/tu-usuario/chinches-finanzas.git
cd chinches-finanzas
```

### 2. Crear entorno virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python -m venv venv
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores
```

### 5. Ejecutar en desarrollo

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

**API disponible en:** http://localhost:5000
**Documentación Swagger:** http://localhost:5000/docs
**Documentación ReDoc:** http://localhost:5000/redoc

## 📁 Estructura del Proyecto

```
chinches-finanzas/
├── backend/
│   ├── main.py              # Punto de entrada
│   ├── auth.py              # Autenticación JWT
│   ├── models.py            # Modelos de BD
│   ├── database.py          # Configuración de BD
│   ├── requirements.txt      # Dependencias
│   └── .env                 # Variables (no versionado)
├── .env.example             # Template de variables
├── .gitignore              # Archivos ignorados en Git
├── Procfile                # Para Railway
├── requirements.txt        # Dependencias globales
└── README.md               # Este archivo
```

## 🛠️ Tecnologías

- **Framework:** FastAPI
- **ORM:** SQLAlchemy
- **Auth:** JWT (python-jose + passlib)
- **Servidor:** Uvicorn + Gunicorn
- **BD:** SQLite (dev) / PostgreSQL (prod)
- **Rate Limiting:** slowapi

## 🚀 Despliegue

### Railway (Recomendado)

1. Crear proyecto en [Railway.app](https://railway.app)
2. Conectar GitHub
3. Agregar PostgreSQL
4. Configurar variables de entorno
5. Deploy automático

Ver guía completa: `RAILWAY_DEPLOYMENT_GUIDE_ES.md`

## 🧪 Testing

```bash
pytest tests/
```

## 📚 API Endpoints

### Autenticación
- `POST /auth/register` - Registrarse
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refrescar token

### Transacciones
- `GET /transacciones` - Listar todas
- `POST /transacciones` - Crear nueva
- `GET /transacciones/{id}` - Obtener detalle
- `PUT /transacciones/{id}` - Actualizar
- `DELETE /transacciones/{id}` - Eliminar

### Reportes
- `GET /reportes/resumen` - Resumen general
- `GET /reportes/gastos-por-categoria` - Gastos por categoría
- `GET /reportes/balance` - Balance mensual

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración
- Rate limiting activado
- CORS configurado
- Variables sensibles en .env

## 📝 Variables de Entorno

Ver `.env.example` para lista completa.

**Mínimas requeridas:**
```env
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ENVIRONMENT=development
```

## 🐛 Troubleshooting

### Puerto 5000 en uso
```bash
# Cambiar puerto en comando uvicorn:
uvicorn main:app --reload --port 8000
```

### Error de BD
```bash
# Verificar que app.db se creó
python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### Error de imports
```bash
# Reinstalar dependencias
pip install -r requirements.txt --force-reinstall
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama para feature: `git checkout -b feature/AmazingFeature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/AmazingFeature`
5. Abrir Pull Request

## 📞 Soporte

Para issues o preguntas:
- Abrir issue en GitHub
- Contactar al equipo de desarrollo

## 📄 Licencia

[Tu licencia aquí]

---

**¡Happy coding! 🚀**
EOF

echo -e "${GREEN}✅ README.md creado${NC}"

echo ""

# ========================================
# PASO 5: Crear CHANGELOG.md
# ========================================
echo "📋 Creando CHANGELOG.md..."

cat > CHANGELOG.md << 'EOF'
# Changelog - Chinches Finanzas

## [1.0.0] - 2026-05-16

### ✨ Agregado
- Estructura inicial del proyecto
- Autenticación con JWT
- CRUD de transacciones
- Reportes básicos
- Rate limiting
- Documentación automática (Swagger)

### 🔧 Configuración
- `.env.example` con todas las variables
- `Procfile` para Railway
- `.gitignore` completo
- README profesional
- CHANGELOG.md

### 📝 Documentación
- README.md con instalación local
- Guía de despliegue en Railway
- API documentation en `/docs`

---

**Estado:** ✅ Listo para despliegue en producción
EOF

echo -e "${GREEN}✅ CHANGELOG.md creado${NC}"

echo ""

# ========================================
# PASO 6: Resumen final
# ========================================
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ LIMPIEZA COMPLETADA EXITOSAMENTE${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "📝 Archivos creados:"
echo "   ✅ .env.example"
echo "   ✅ .gitignore"
echo "   ✅ Procfile"
echo "   ✅ README.md"
echo "   ✅ CHANGELOG.md"
echo ""
echo "🚀 Próximos pasos:"
echo "   1. Revisar y editar .env.example si es necesario"
echo "   2. git add ."
echo "   3. git commit -m 'Setup: Initial configuration and documentation'"
echo "   4. git push origin main"
echo "   5. Crear proyecto en Railway.app"
echo "   6. Conectar repositorio a Railway"
echo ""
echo "📚 Guía completa:"
echo "   Ver: RAILWAY_DEPLOYMENT_GUIDE_ES.md"
echo ""
