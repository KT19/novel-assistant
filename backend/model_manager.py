"""Download state for local language models.

The app never redistributes model weights. When the user asks to prepare AI, the
backend downloads the model directly from the upstream hosting URL into the
local `models/` directory.
"""

from __future__ import annotations

import threading
import os
import urllib.request
from pathlib import Path
from typing import Any

from backend.database import load_app_state_value, save_app_state_value

MODEL_DIR = Path(os.environ.get("NOVEL_ASSISTANT_MODEL_DIR", "models"))
ACTIVE_MODEL_STATE_KEY = "active_model_key"

MODEL_CATALOG: dict[str, dict[str, str]] = {
    "lightweight": {
        "name": "Gemma 4 E2B-it Q4_K_M",
        "file": "gemma-4-E2B-it-Q4_K_M.gguf",
        "url": (
            "https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/resolve/main/"
            "gemma-4-E2B-it-Q4_K_M.gguf"
        ),
        "source_url": "https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF",
        "license": "gemma (Apache-2.0 based)",
        "description": "軽量版（約3GB / メモリ4GB〜）",
    },
    "standard": {
        "name": "Gemma 4 E4B-it Q4_K_M",
        "file": "gemma-4-E4B-it-Q4_K_M.gguf",
        "url": (
            "https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF/resolve/main/"
            "gemma-4-E4B-it-Q4_K_M.gguf"
        ),
        "source_url": "https://huggingface.co/unsloth/gemma-4-E4B-it-GGUF",
        "license": "gemma (Apache-2.0 based)",
        "description": "標準版（約3.5GB / メモリ8GB〜）",
    },
    "high_quality": {
        "name": "Gemma 4 26B-A4B-it UD-Q4_K_M",
        "file": "gemma-4-26B-A4B-it-UD-Q4_K_M.gguf",
        "url": (
            "https://huggingface.co/unsloth/gemma-4-26B-A4B-it-GGUF/resolve/main/"
            "gemma-4-26B-A4B-it-UD-Q4_K_M.gguf"
        ),
        "source_url": "https://huggingface.co/unsloth/gemma-4-26B-A4B-it-GGUF",
        "license": "gemma (Apache-2.0 based)",
        "description": "高品質版 MoE（約16GB / メモリ16GB〜）",
    },
}

DEFAULT_MODEL_KEY = "lightweight"

_download_lock = threading.Lock()
_download_thread: threading.Thread | None = None
_download_state: dict[str, Any] = {
    "state": "missing",
    "downloadedBytes": 0,
    "totalBytes": None,
    "error": None,
    "modelKey": None,
}

_active_model_key: str | None = None


def _find_ready_model() -> str | None:
    """Return the key of the first model file that already exists on disk."""
    for key, entry in MODEL_CATALOG.items():
        if (MODEL_DIR / entry["file"]).exists():
            return key
    return None


def active_model_path() -> Path | None:
    """Return the path to the currently active model file, if any."""
    global _active_model_key
    if _active_model_key is None:
        _active_model_key = _load_saved_model_key() or _find_ready_model()
    if _active_model_key is None:
        return None
    model_path = MODEL_DIR / MODEL_CATALOG[_active_model_key]["file"]
    if model_path.exists():
        return model_path
    return None


def model_catalog_list() -> list[dict[str, Any]]:
    """Return the model catalog with availability status."""
    return [
        {
            "key": key,
            "name": entry["name"],
            "description": entry["description"],
            "license": entry["license"],
            "sourceUrl": entry["source_url"],
            "ready": (MODEL_DIR / entry["file"]).exists(),
        }
        for key, entry in MODEL_CATALOG.items()
    ]


def model_status() -> dict[str, Any]:
    """Return the current model availability and download progress."""
    ready_key = _find_ready_model()
    active_key = _active_model_key or _load_saved_model_key() or ready_key

    if active_key and (MODEL_DIR / MODEL_CATALOG[active_key]["file"]).exists():
        entry = MODEL_CATALOG[active_key]
        file_path = MODEL_DIR / entry["file"]
        return {
            "ready": True,
            "state": "ready",
            "engine": entry["name"],
            "message": "ローカルモデルを利用できます。",
            "downloadedBytes": file_path.stat().st_size,
            "totalBytes": file_path.stat().st_size,
            "model": _model_metadata(active_key),
            "models": model_catalog_list(),
        }

    with _download_lock:
        state = dict(_download_state)

    selected_key = state["modelKey"] if state["modelKey"] in MODEL_CATALOG else DEFAULT_MODEL_KEY

    if state["state"] == "downloading":
        message = "モデルをバックグラウンドでダウンロードしています…"
    elif state["state"] == "error":
        message = "モデルのダウンロードに失敗しました。"
    else:
        message = "AIを準備すると、公式配布元からモデルを取得します。"

    return {
        "ready": False,
        "state": state["state"],
        "engine": "未準備",
        "message": message,
        "downloadedBytes": state["downloadedBytes"],
        "totalBytes": state["totalBytes"],
        "error": state["error"],
        "model": _model_metadata(selected_key),
        "models": model_catalog_list(),
    }


def start_model_download(model_key: str | None = None) -> dict[str, Any]:
    """Start a background model download if the model is not present."""
    global _download_thread, _active_model_key

    key = model_key or DEFAULT_MODEL_KEY
    entry = MODEL_CATALOG.get(key)
    if entry is None:
        key = DEFAULT_MODEL_KEY
        entry = MODEL_CATALOG[key]

    file_path = MODEL_DIR / entry["file"]
    if file_path.exists():
        _active_model_key = key
        save_app_state_value(ACTIVE_MODEL_STATE_KEY, key)
        return model_status()

    with _download_lock:
        if _download_thread and _download_thread.is_alive():
            return model_status()

        _download_state.update(
            {
                "state": "downloading",
                "downloadedBytes": 0,
                "totalBytes": None,
                "error": None,
                "modelKey": key,
            }
        )
        _active_model_key = key
        save_app_state_value(ACTIVE_MODEL_STATE_KEY, key)
        _download_thread = threading.Thread(
            target=_download_model,
            args=(key,),
            daemon=True,
        )
        _download_thread.start()

    return model_status()


def _model_metadata(key: str) -> dict[str, str]:
    """Return public metadata for the selected model."""
    entry = MODEL_CATALOG.get(key, MODEL_CATALOG[DEFAULT_MODEL_KEY])
    return {
        "name": entry["name"],
        "license": entry["license"],
        "sourceUrl": entry["source_url"],
        "downloadUrl": entry["url"],
    }


def _load_saved_model_key() -> str | None:
    """Return the persisted model key if it still exists in the catalog."""
    saved_key = load_app_state_value(ACTIVE_MODEL_STATE_KEY)
    return saved_key if saved_key in MODEL_CATALOG else None


def _download_model(key: str) -> None:
    global _active_model_key
    entry = MODEL_CATALOG[key]
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    target = MODEL_DIR / entry["file"]
    temporary_file = target.with_suffix(".gguf.part")

    try:
        request = urllib.request.Request(
            entry["url"],
            headers={"User-Agent": "novel-assistant/0.1"},
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            total = response.headers.get("Content-Length")
            with _download_lock:
                _download_state["totalBytes"] = int(total) if total else None

            with temporary_file.open("wb") as file:
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    file.write(chunk)
                    with _download_lock:
                        _download_state["downloadedBytes"] += len(chunk)

        temporary_file.replace(target)
        _active_model_key = key
        save_app_state_value(ACTIVE_MODEL_STATE_KEY, key)
        with _download_lock:
            _download_state.update(
                {
                    "state": "ready",
                    "downloadedBytes": target.stat().st_size,
                    "totalBytes": target.stat().st_size,
                    "error": None,
                }
            )
    except Exception as exc:
        if temporary_file.exists():
            temporary_file.unlink()
        with _download_lock:
            _download_state.update(
                {
                    "state": "error",
                    "error": str(exc),
                }
            )
