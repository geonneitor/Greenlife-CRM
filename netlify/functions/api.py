import sys
import os
from mangum import Mangum

# Añadir la carpeta 'backend' al path para poder importar sus módulos
current_dir = os.path.dirname(os.path.abspath(__file__)) # root/netlify/functions
project_root = os.path.dirname(os.path.dirname(current_dir)) # root
backend_path = os.path.join(project_root, "backend")

sys.path.insert(0, backend_path)
sys.path.insert(0, project_root)

# Importar la app de FastAPI
try:
    from main import app
    handler = Mangum(app)
except ImportError as e:
    print(f"Error importando la app: {e}")
    # Fallback o error más descriptivo
    raise e
