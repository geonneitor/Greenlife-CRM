@echo off
TITLE Greenlife Enterprise - CRM Control Center
color 0a

echo.
echo ==================================================
echo       GREENLIFE ENTERPRISE - CONTROL CENTER
echo ==================================================
echo.

:: 1. Iniciar el Backend
echo [1/2] Lanzando Servidor Backend (FastAPI)...
start "GLE_BACKEND" cmd /k "cd backend && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

:: Esperar un momento para el backend
timeout /t 3 >nul

:: 2. Iniciar el Frontend
echo [2/2] Lanzando Servidor Frontend (Vite/React)...
start "GLE_FRONTEND" cmd /k "cd frontend && npx vite --host 127.0.0.1"

echo.
echo --------------------------------------------------
echo ACCESOS DIRECTOS:
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo --------------------------------------------------
echo.
echo Presiona cualquier tecla para cerrar este panel...
pause >nul
