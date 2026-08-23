import http.server
import socketserver
import os
import sys

DIRECTORY = r"c:\Users\User\barracuda\web_preview"
PORT = 8088

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

class ReusableServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True

if __name__ == '__main__':
    try:
        with ReusableServer(("", PORT), Handler) as httpd:
            print(f"SERVING_ON_PORT_{PORT}", flush=True)
            httpd.serve_forever()
    except Exception as e:
        print(f"SERVER_ERROR: {e}", flush=True)
