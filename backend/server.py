"""Small local HTTP API backed by SQLite."""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import urlparse

from backend.ai import generate_ai_response, load_ai_status, load_model_list, setup_ai
from backend.database import load_workspace, save_workspace

HOST = "127.0.0.1"
PORT = 8765


class LocalThreadingHTTPServer(ThreadingHTTPServer):
    """Threading HTTP server tuned for quick local restarts."""

    allow_reuse_address = True


class ApiHandler(BaseHTTPRequestHandler):
    """Handle project persistence requests from the Vite app."""

    def do_OPTIONS(self) -> None:
        self.send_empty(204)

    def do_GET(self) -> None:
        if self.path_name == "/api/health":
            self.send_json({"ok": True})
            return

        if self.path_name == "/api/projects":
            self.send_json(load_workspace())
            return

        if self.path_name == "/api/ai/status":
            self.send_json(load_ai_status())
            return

        if self.path_name == "/api/ai/models":
            self.send_json({"models": load_model_list()})
            return

        self.send_json({"error": "not found"}, status=404)

    def do_POST(self) -> None:
        if self.path_name == "/api/ai/setup":
            body = self.read_json()
            model_key = body.get("modelKey") if body else None
            self.send_json(setup_ai(model_key))
            return

        if self.path_name == "/api/ai/generate":
            self.send_json(generate_ai_response(self.read_json()))
            return

        self.send_json({"error": "not found"}, status=404)

    def do_PUT(self) -> None:
        if self.path_name != "/api/projects":
            self.send_json({"error": "not found"}, status=404)
            return

        body = self.read_json()
        save_workspace(body["projects"], body.get("activeProjectId"))
        self.send_json({"ok": True})

    @property
    def path_name(self) -> str:
        return urlparse(self.path).path

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        raw_body = self.rfile.read(length).decode("utf-8")
        return json.loads(raw_body)

    def send_json(self, payload: dict[str, Any] | list[Any], status: int = 200) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_common_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def send_empty(self, status: int) -> None:
        self.send_response(status)
        self.send_common_headers()
        self.end_headers()

    def send_common_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format: str, *args: Any) -> None:
        return


def main() -> None:
    """Run the local API server."""
    server = LocalThreadingHTTPServer((HOST, PORT), ApiHandler)
    print(f"SQLite API listening on http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
