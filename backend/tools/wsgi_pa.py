from a2wsgi import ASGIMiddleware
from main import app

# Este es el adaptador para convertir FastAPI (ASGI) en WSGI
# PythonAnywhere usará este objeto 'application'
application = ASGIMiddleware(app)
