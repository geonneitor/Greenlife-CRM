# 🌱 Greenlife CRM

**Sistema de Gestión de Relaciones con Clientes (CRM) para empresas de servicios ambientales y sostenibilidad.**

[![Netlify Status](https://api.netlify.com/api/v1/badges/[YOUR-BADGE-ID]/deploy-status)](https://greenlife-crm.netlify.app)

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos Previos](#requisitos-previos)
- [Instalación Local](#instalación-local)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [Despliegue](#despliegue)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Tecnologías](#tecnologías)
- [Contribuir](#contribuir)

---

## ✨ Características

- 📊 Dashboard de cliente centralizado
- 👥 Gestión de contactos y leads
- 📅 Sistema de tareas y seguimiento
- 💼 Gestión de proyectos
- 📈 Reportes y análisis
- 🔐 Autenticación y control de acceso
- 📱 Interfaz responsiva

---

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

| Requisito | Versión |
|-----------|---------|
| Node.js   | v16.0 o superior |
| npm / yarn | Última versión |
| Python    | 3.9 o superior |
| Git       | Última versión |

### Base de Datos (Elige una)
- PostgreSQL 12+
- MongoDB 4.4+

### Herramientas Opcionales
- Postman (para testing de API)
- VS Code + extensiones recomendadas
- Docker (para containerización)

---

## 🚀 Instalación Local

### 1. Clonar el Repositorio

```bash
git clone https://github.com/geonneitor/Greenlife-CRM.git
cd Greenlife-CRM
```

### 2. Configurar Variables de Entorno

```bash
# Copiar template de variables
cp .env.example .env

# Editar con tus valores reales
# Usa tu editor favorito:
# nano .env
# code .env
# vim .env
```

**Variables mínimas requeridas:**
- `DATABASE_URL`: Conexión a tu base de datos
- `JWT_SECRET`: Clave para autenticación
- `REACT_APP_API_URL`: URL de la API

### 3. Instalar Dependencias - Frontend

```bash
cd frontend

# Con npm
npm install

# O con yarn
yarn install
```

### 4. Instalar Dependencias - Backend

```bash
cd ../backend

# Crear entorno virtual (recomendado)
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate

# Instalar dependencias Python
pip install -r requirements.txt
```

### 5. Configurar Base de Datos

```bash
# En el backend, ejecutar migraciones (si usas)
python manage.py migrate  # Si usas Django
# O tu comando específico según el framework
```

---

## ⚙️ Configuración

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development
```

### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/greenlife_db
JWT_SECRET=your_super_secret_key_here
DEBUG=True  # Solo en desarrollo
```

### Verificación de Configuración

```bash
# Frontend - Verificar que React puede cargar
cd frontend && npm run build

# Backend - Verificar que Python puede importar módulos
cd backend && python -c "import flask" # O tu framework
```

---

## ▶️ Ejecución

### Modo Desarrollo (Recomendado)

Abre **DOS terminales** en la raíz del proyecto:

**Terminal 1 - Frontend:**
```bash
cd frontend
npm start
```
- Acceder en: http://localhost:3000
- Hot reload activado

**Terminal 2 - Backend:**
```bash
cd backend

# Activar entorno virtual (si no está activado)
source venv/bin/activate  # macOS/Linux
# o
venv\Scripts\activate     # Windows

# Ejecutar servidor
python app.py
# o según tu framework
flask run
gunicorn app:app
```
- API disponible en: http://localhost:5000
- Documentación interactiva (si usas Swagger): http://localhost:5000/docs

### Verificación Rápida

```bash
# Frontend está corriendo si ves el logo de React en http://localhost:3000
# Backend está corriendo si esto devuelve datos:
curl http://localhost:5000/api/health
```

---

## 🌐 Despliegue

### Opción 1: Netlify (Recomendado para Frontend)

#### Frontend en Netlify

1. **Conectar repositorio:**
   - Ir a [Netlify](https://app.netlify.com)
   - Click en "New site from Git"
   - Seleccionar repositorio

2. **Configurar build:**
   ```
   Build command: cd frontend && npm run build
   Publish directory: frontend/build
   ```

3. **Configurar variables de entorno:**
   - Site settings → Build & Deploy → Environment
   - Agregar:
     ```
     REACT_APP_API_URL=https://tu-api-backend.com
     REACT_APP_ENVIRONMENT=production
     ```

4. **Desplegar:**
   - Click en "Deploy"
   - Esperar a que termine el build

#### Backend en Netlify Functions (Para APIs simples)

```bash
# Convertir funciones a Netlify Functions
# Sitio: https://docs.netlify.com/functions/overview/
```

### Opción 2: Railway (Recomendado para Backend)

1. **Crear proyecto en Railway:**
   - Ir a [Railway](https://railway.app)
   - Conectar GitHub

2. **Configurar servicio Python:**
   ```
   Start command: python app.py
   Environment variables: Agregar desde tu .env
   ```

3. **Conectar base de datos:**
   - Agregar PostgreSQL o MongoDB
   - Railway genera `DATABASE_URL` automáticamente

### Opción 3: Heroku (Alternativa)

```bash
# Instalar Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

heroku login
heroku create greenlife-crm
git push heroku main
heroku config:set JWT_SECRET=your_secret
heroku open
```

### Opción 4: Docker (Producción avanzada)

Crea `Dockerfile` y `docker-compose.yml` para containerizar.

---

## 📁 Estructura del Proyecto

```
Greenlife-CRM/
│
├── 📁 frontend/                    # Aplicación React
│   ├── public/                     # Assets estáticos
│   ├── src/
│   │   ├── components/             # Componentes React
│   │   ├── pages/                  # Páginas principales
│   │   ├── services/               # Llamadas a API
│   │   ├── hooks/                  # Custom hooks
│   │   ├── utils/                  # Funciones útiles
│   │   ├── App.js                  # Componente raíz
│   │   └── index.js                # Entry point
│   ├── package.json                # Dependencias Node
│   └── .env                        # Variables de entorno
│
├── 📁 backend/                     # API Python
│   ├── app.py                      # Punto de entrada
│   ├── config.py                   # Configuración
│   ├── routes/                     # Endpoints API
│   ├── models/                     # Modelos de datos
│   ├── controllers/                # Lógica de negocio
│   ├── middleware/                 # Middleware personalizado
│   ├── requirements.txt            # Dependencias Python
│   └── .env                        # Variables de entorno
│
├── 📁 netlify/functions/           # Funciones serverless
│   └── api.js                      # APIs en Netlify
│
├── 📄 .env.example                 # Template de variables
├── 📄 .gitignore                   # Archivos ignorados en Git
├── 📄 netlify.toml                 # Configuración Netlify
├── 📄 package.json                 # Dependencias raíz (opcional)
├── 📄 README.md                    # Este archivo
└── 📄 CHANGELOG.md                 # Historial de cambios
```

---

## 🛠️ Tecnologías

### Frontend
- **Framework:** React 18.x
- **Build Tool:** Create React App / Vite
- **Styling:** [CSS Modules / Tailwind / Material-UI]
- **State Management:** [Context API / Redux / Zustand]
- **HTTP Client:** Axios / Fetch API
- **Routing:** React Router v6

### Backend
- **Framework:** Flask / FastAPI / Django
- **ORM:** SQLAlchemy / Django ORM / Mongoengine
- **Authentication:** JWT / OAuth2
- **Database:** PostgreSQL / MongoDB
- **Documentation:** Swagger / OpenAPI

### Deployment
- **Frontend:** Netlify
- **Backend:** Railway / Heroku / AWS
- **Base de Datos:** Managed Database Service
- **CDN:** Cloudflare (opcional)

---

## 📊 Variables de Entorno Necesarias

Ver **[.env.example](.env.example)** para lista completa.

Mínimas para desarrollo:
```env
# Frontend
REACT_APP_API_URL=http://localhost:5000

# Backend
DATABASE_URL=postgresql://localhost/greenlife_db
JWT_SECRET=your_secret_key_here
```

---

## 🧪 Testing

```bash
# Frontend - Unit tests
cd frontend
npm test

# Frontend - Build test
npm run build

# Backend - Tests
cd backend
pytest tests/
# O según tu framework de testing
```

---

## 📚 Documentación Adicional

- **API Reference:** `/docs` (Swagger) o `/api-docs`
- **Frontend Setup:** `frontend/README.md`
- **Backend Setup:** `backend/README.md`

---

## 🐛 Troubleshooting

### Puerto 3000/5000 ya en uso

```bash
# En Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# En macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Error de conexión a BD

```bash
# Verificar que la BD está corriendo
# PostgreSQL:
psql -U postgres
# MongoDB:
mongosh
```

### Module not found errors

```bash
# Frontend
cd frontend && rm -rf node_modules package-lock.json
npm install

# Backend
cd backend && rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature: `git checkout -b feature/AmazingFeature`
3. Commit tus cambios: `git commit -m 'Add some AmazingFeature'`
4. Push a la rama: `git push origin feature/AmazingFeature`
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la licencia [MIT / Otra].

---

## 📞 Soporte

Para preguntas o issues:
- Abrir un [Issue en GitHub](https://github.com/geonneitor/Greenlife-CRM/issues)
- Contactar al equipo de desarrollo

---

## 🎯 Roadmap

- [ ] Autenticación con Google/Microsoft
- [ ] Exportar reportes a PDF
- [ ] Integración con Slack
- [ ] App móvil nativa
- [ ] Analytics avanzado

---

**Última actualización:** Mayo 2026

Happy coding! 🚀
