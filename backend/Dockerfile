FROM python:3.10-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar requerimientos e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código
COPY . .

# Puerto por defecto de Railway/Render
EXPOSE 8080

# Comando para ejecutar la app
# Usamos uvicorn directamente o gunicorn para producción
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
