import http.server
import socketserver
import os
import sys

DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def run():
    ports = [8080, 8000, 3000, 5500, 8888]
    for port in ports:
        try:
            httpd = socketserver.TCPServer(('127.0.0.1', port), Handler)
            print(f"ONLINE: http://127.0.0.1:{port}", flush=True)
            httpd.serve_forever()
            break
        except OSError:
            continue

if __name__ == '__main__':
    run()
