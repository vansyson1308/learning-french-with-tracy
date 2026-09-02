"""Static server for the Expo web export with the rewrites Expo Router's
static output needs: extensionless routes map to `<route>.html`, and an
unknown segment falls back to the sibling `[param].html` dynamic page.

    python3 e2e/serve-static.py <export-dir> <port>
"""

import http.server
import os
import sys

ROOT = sys.argv[1]
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8099


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        full = super().translate_path(path)
        if not os.path.exists(full):
            candidate = full.rstrip("/") + ".html"
            if os.path.exists(candidate):
                return candidate
            parent = os.path.dirname(full)
            if os.path.isdir(parent):
                for entry in os.listdir(parent):
                    if entry.startswith("[") and entry.endswith("].html"):
                        return os.path.join(parent, entry)
        return full

    def log_message(self, *args):
        pass


http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
