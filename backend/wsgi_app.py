import sys
import os
import asyncio

# Add backend folder to Python path
path = '/home/SmokeRings710/smoke-rings-official/backend'
if path not in sys.path:
    sys.path.insert(0, path)

# Load environment variables BEFORE importing the app
from dotenv import load_dotenv
load_dotenv(os.path.join(path, '.env'))

from main import app


def application(environ, start_response):
    """
    Pure custom WSGI-to-ASGI bridge.
    Replaces a2wsgi which deadlocks on PythonAnywhere's uWSGI.
    Uses a fresh asyncio event loop per request — guaranteed to work.
    """
    # Build headers list from WSGI environ
    headers = []
    for key, value in environ.items():
        if key.startswith('HTTP_'):
            name = key[5:].lower().replace('_', '-').encode('latin-1')
            headers.append((name, value.encode('latin-1')))
    if environ.get('CONTENT_TYPE'):
        headers.append((b'content-type', environ['CONTENT_TYPE'].encode('latin-1')))
    if environ.get('CONTENT_LENGTH'):
        headers.append((b'content-length', environ['CONTENT_LENGTH'].encode('latin-1')))

    # Build ASGI scope
    scope = {
        'type': 'http',
        'asgi': {'version': '3.0'},
        'http_version': '1.1',
        'method': environ['REQUEST_METHOD'].upper(),
        'headers': headers,
        'path': environ.get('PATH_INFO', '/'),
        'query_string': environ.get('QUERY_STRING', '').encode('latin-1'),
        'root_path': environ.get('SCRIPT_NAME', ''),
        'scheme': environ.get('wsgi.url_scheme', 'http'),
        'server': (
            environ.get('SERVER_NAME', 'localhost'),
            int(environ.get('SERVER_PORT', 80))
        ),
    }

    # Read request body
    try:
        content_length = int(environ.get('CONTENT_LENGTH') or 0)
    except (ValueError, TypeError):
        content_length = 0
    body = environ['wsgi.input'].read(content_length)

    # State containers
    body_consumed = False
    response_started = {}
    response_body_parts = []

    async def receive():
        nonlocal body_consumed
        if not body_consumed:
            body_consumed = True
            return {'type': 'http.request', 'body': body, 'more_body': False}
        return {'type': 'http.disconnect'}

    async def send(message):
        if message['type'] == 'http.response.start':
            response_started['status'] = message['status']
            response_started['headers'] = message.get('headers', [])
        elif message['type'] == 'http.response.body':
            response_body_parts.append(message.get('body', b''))

    # Run ASGI app in a fresh event loop (avoids deadlocks)
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(app(scope, receive, send))
    finally:
        loop.close()

    # Build WSGI response
    status_code = response_started.get('status', 500)
    reasons = {
        200: 'OK', 201: 'Created', 204: 'No Content',
        400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
        404: 'Not Found', 405: 'Method Not Allowed',
        422: 'Unprocessable Entity', 429: 'Too Many Requests',
        500: 'Internal Server Error',
    }
    reason = reasons.get(status_code, 'Unknown')
    headers_out = [
        (k.decode('latin-1'), v.decode('latin-1'))
        for k, v in response_started.get('headers', [])
    ]

    start_response(f'{status_code} {reason}', headers_out)
    return [b''.join(response_body_parts)]
