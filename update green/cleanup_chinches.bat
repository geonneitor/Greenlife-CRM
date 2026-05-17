@echo off
REM ========================================
REM Script de Limpieza - Chinches Finanzas
REM Para Windows PowerShell/CMD
REM ========================================

echo.
echo 🧹 Iniciando limpieza de Chinches Finanzas...
echo.

REM Verificar que estamos en la raíz del proyecto
if not exist "requirements.txt" (
    echo ❌ Error: No estoy en la raíz del proyecto
    echo    Este script debe ejecutarse desde la carpeta raíz de Chinches Finanzas
    echo    Donde está 'requirements.txt'
    pause
    exit /b 1
)

echo ✅ Estructura correcta detectada
echo.

REM ========================================
REM PASO 1: Verificar estructura de carpetas
REM ========================================
echo 📁 Verificando estructura de carpetas...

if not exist "backend" (
    mkdir backend
    echo ⚠️  Carpeta 'backend' creada
)

echo.

REM ========================================
REM PASO 2: Crear .env.example
REM ========================================
echo 📝 Creando archivos de configuración...

(
echo # ========================================
echo # CHINCHES FINANZAS - VARIABLES DE ENTORNO
echo # ========================================
echo.
echo # BASE DE DATOS
echo # Desarrollo: SQLite
echo DATABASE_URL=sqlite:///./app.db
echo.
echo # SEGURIDAD - JWT
echo SECRET_KEY=your_super_secret_key_change_in_production
echo ALGORITHM=HS256
echo ACCESS_TOKEN_EXPIRE_MINUTES=30
echo.
echo # SEGURIDAD - BCRYPT
echo BCRYPT_LOG_ROUNDS=12
echo.
echo # API
echo API_TITLE=Chinches Finanzas API
echo API_VERSION=1.0.0
echo API_DESCRIPTION=Sistema de gestión de finanzas
echo.
echo # CORS
echo ALLOWED_ORIGINS=http://localhost:3000,https://chinches-finanzas.netlify.app
echo.
echo # RATE LIMITING
echo RATE_LIMIT_REQUESTS=100
echo RATE_LIMIT_WINDOW=900
echo.
echo # AMBIENTE
echo ENVIRONMENT=development
echo DEBUG=False
echo LOG_LEVEL=INFO
) > .env.example

echo ✅ .env.example creado

REM ========================================
REM PASO 3: Crear Procfile
REM ========================================
(
echo web: gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app
) > Procfile

echo ✅ Procfile creado

REM ========================================
REM PASO 4: Crear .gitignore
REM ========================================
(
echo # Entorno Virtual
echo venv/
echo env/
echo ENV/
echo .venv
echo.
echo # Base de datos local
echo *.db
echo *.sqlite
echo *.sqlite3
echo app.db
echo.
echo # Variables de entorno
echo .env
echo .env.local
echo .env.*.local
echo.
echo # Python
echo __pycache__/
echo *.py[cod]
echo *$py.class
echo *.so
echo .Python
echo build/
echo develop-eggs/
echo dist/
echo downloads/
echo eggs/
echo .eggs/
echo lib/
echo lib64/
echo parts/
echo sdist/
echo var/
echo wheels/
echo *.egg-info/
echo .installed.cfg
echo *.egg
echo.
echo # IDEs
echo .vscode/
echo .idea/
echo *.swp
echo *.swo
echo *~
echo.
echo # Sistema
echo .DS_Store
echo Thumbs.db
echo.
echo # Testing
echo .pytest_cache/
echo .coverage
echo htmlcov/
echo.
echo # Logs
echo *.log
) > .gitignore

echo ✅ .gitignore creado

echo.

REM ========================================
REM PASO 5: Crear README.md
REM ========================================
echo 📄 Creando README.md...

(
echo # 💰 Chinches Finanzas
echo.
echo Sistema de gestión de finanzas construido con FastAPI y SQLAlchemy.
echo.
echo ## 🚀 Características
echo.
echo - 📊 Dashboard de análisis financiero
echo - 🔐 Autenticación con JWT
echo - 💼 Gestión de transacciones
echo - 📈 Reportes y análisis
echo - 🔒 Control de acceso basado en roles
echo.
echo ## 📋 Requisitos Previos
echo.
echo - Python 3.9+
echo - pip o poetry
echo - Git
echo - SQLite (incluido en Python)
echo.
echo ## 🔧 Instalación Local
echo.
echo ### 1. Clonar repositorio
echo.
echo ```bash
echo git clone https://github.com/tu-usuario/chinches-finanzas.git
echo cd chinches-finanzas
echo ```
echo.
echo ### 2. Crear entorno virtual
echo.
echo ```bash
echo # Windows
echo python -m venv venv
echo venv\Scripts\activate
echo.
echo # macOS/Linux
echo python -m venv venv
echo source venv/bin/activate
echo ```
echo.
echo ### 3. Instalar dependencias
echo.
echo ```bash
echo pip install -r requirements.txt
echo ```
echo.
echo ### 4. Configurar variables de entorno
echo.
echo ```bash
echo cp .env.example .env
echo # Editar .env con tus valores
echo ```
echo.
echo ### 5. Ejecutar en desarrollo
echo.
echo ```bash
echo cd backend
echo uvicorn main:app --reload --host 0.0.0.0 --port 5000
echo ```
echo.
echo **API disponible en:** http://localhost:5000
echo **Documentación Swagger:** http://localhost:5000/docs
echo.
echo ## 🛠️ Tecnologías
echo.
echo - **Framework:** FastAPI
echo - **ORM:** SQLAlchemy
echo - **Auth:** JWT (python-jose + passlib)
echo - **Servidor:** Uvicorn + Gunicorn
echo - **BD:** SQLite (dev) / PostgreSQL (prod)
echo.
echo ## 🚀 Despliegue en Railway
echo.
echo Ver guía completa: RAILWAY_DEPLOYMENT_GUIDE_ES.md
echo.
echo ---
echo.
echo **¡Happy coding! 🚀**
) > README.md

echo ✅ README.md creado

REM ========================================
REM PASO 6: Crear CHANGELOG.md
REM ========================================
echo 📋 Creando CHANGELOG.md...

(
echo # Changelog - Chinches Finanzas
echo.
echo ## [1.0.0] - 2026-05-16
echo.
echo ### ✨ Agregado
echo - Estructura inicial del proyecto
echo - Autenticación con JWT
echo - CRUD de transacciones
echo - Reportes básicos
echo - Rate limiting
echo - Documentación automática (Swagger)
echo.
echo ### 🔧 Configuración
echo - `.env.example` con todas las variables
echo - `Procfile` para Railway
echo - `.gitignore` completo
echo - README profesional
echo - CHANGELOG.md
echo.
echo ---
echo.
echo **Estado:** ✅ Listo para despliegue en producción
) > CHANGELOG.md

echo ✅ CHANGELOG.md creado

echo.

REM ========================================
REM RESUMEN FINAL
REM ========================================
echo.
echo ════════════════════════════════════════
echo ✅ LIMPIEZA COMPLETADA EXITOSAMENTE
echo ════════════════════════════════════════
echo.
echo 📝 Archivos creados:
echo    ✅ .env.example
echo    ✅ .gitignore
echo    ✅ Procfile
echo    ✅ README.md
echo    ✅ CHANGELOG.md
echo.
echo 🚀 Próximos pasos:
echo    1. Revisar archivos creados
echo    2. Ejecutar: git add .
echo    3. Ejecutar: git commit -m "Setup: Initial configuration and documentation"
echo    4. Ejecutar: git push origin main
echo    5. Crear proyecto en Railway.app
echo    6. Conectar repositorio a Railway
echo.
echo 📚 Guía completa:
echo    Ver: RAILWAY_DEPLOYMENT_GUIDE_ES.md
echo.

pause
