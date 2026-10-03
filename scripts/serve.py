#!/usr/bin/env python3
"""Serve the bundled game locally, without installing Node or Manim."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser

parser = argparse.ArgumentParser()
parser.add_argument('--no-browser', action='store_true')
parser.add_argument('--port', type=int, default=8877)
args = parser.parse_args()
directory = Path(__file__).resolve().parents[1] / 'dist'
if not (directory / 'index.html').exists():
    raise SystemExit('No se encontró la versión compilada. Ejecuta npm run build en app/.')

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    def log_message(self, fmt, *values):
        if values and str(values[1] if len(values) > 1 else '').startswith('4'):
            super().log_message(fmt, *values)

server = None
for port in range(args.port, args.port + 10):
    try:
        server = ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory=str(directory)))
        break
    except OSError:
        continue
if server is None:
    raise SystemExit('No hay un puerto local disponible. Cierra una instancia anterior e inténtalo de nuevo.')
url = f'http://127.0.0.1:{server.server_port}/#map'
print('NÓESIS · base de campaña para revisión', flush=True)
print(url, flush=True)
print('Mantén esta ventana abierta. Ctrl+C detiene el servidor.', flush=True)
if not args.no_browser:
    webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    print('\nServidor cerrado.')
finally:
    server.server_close()
