"""Local AI orchestration for writing assistance."""

from __future__ import annotations

from typing import Any

from backend.llm_runner import generate_text
from backend.model_manager import model_status, start_model_download, model_catalog_list
from backend.prompts import build_prompt


def load_ai_status() -> dict[str, Any]:
    """Return whether the local AI assistant has been prepared."""
    return model_status()


def load_model_list() -> list[dict[str, Any]]:
    """Return the available model catalog."""
    return model_catalog_list()


def setup_ai(model_key: str | None = None) -> dict[str, Any]:
    """Prepare the local model, downloading it in the background if needed."""
    return start_model_download(model_key)


def generate_ai_response(request: dict[str, Any]) -> dict[str, str]:
    """Generate a writing-assistance response for the selected section."""
    status = load_ai_status()
    if not status["ready"]:
        if status["state"] == "missing":
            start_model_download()
        return {"text": status["message"]}

    mode = request["mode"]
    section = request["section"]
    if mode in {"reader", "consistency", "chapter_summary"}:
        body = "\n".join(item["body"] for item in request["chapter"]["sections"]).strip()
    else:
        body = section["body"].strip()

    if not body:
        return {"text": "本文を書き始めると、ここにAIの提案が表示されます。"}

    prompt = build_prompt(request)
    return {"text": generate_text(prompt, max_tokens=max_tokens_for_mode(mode))}


def max_tokens_for_mode(mode: str) -> int:
    """Return an output budget suited to the selected AI mode."""
    if mode in {"reader", "consistency", "chapter_summary"}:
        return 1400
    return 700
