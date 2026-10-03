"""Local server for the prototype. Serves this folder like `python -m http.server`,
plus /env.js, which passes the Mapbox token from the repo's .env file to the page.

Only the keys in BROWSER_KEYS are sent. Anything else in .env (such as Grok keys)
stays on your machine.

Usage: python serve.py [port]    (default port 8765)
"""
import http.server
import json
import sys
from functools import partial
from pathlib import Path

HERE = Path(__file__).resolve().parent
ENV_FILE = HERE.parent / ".env"
# .env name -> name the page sees. Mapbox public tokens (pk.…) are meant for browsers.
BROWSER_KEYS = {"MAPBOXKEY": "MAPBOX_TOKEN"}


def read_env(path):
    values = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip("\"'")
    return values


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?")[0] != "/env.js":
            return super().do_GET()
        env = read_env(ENV_FILE)  # read on each request, so edits apply on reload
        public = {name: env[key] for key, name in BROWSER_KEYS.items() if env.get(key)}
        body = f"window.WANDERLINGS_ENV = {json.dumps(public)};\n".encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/javascript; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    if not read_env(ENV_FILE).get("MAPBOXKEY"):
        print(f"Note: no MAPBOXKEY in {ENV_FILE}. The map will ask for a token instead.")
    server = http.server.ThreadingHTTPServer(("", port), partial(Handler, directory=str(HERE)))
    print(f"Serving HuskiesPaws at http://localhost:{port} (Ctrl+C to stop)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
