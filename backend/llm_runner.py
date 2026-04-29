"""Runtime wrapper for the downloaded GGUF model."""

from __future__ import annotations

import re
import threading

from backend.model_manager import active_model_path

_llm_lock = threading.Lock()
_llm: object | None = None
_loaded_path: str | None = None


def generate_text(prompt: str, max_tokens: int = 700) -> str:
    """Generate text from the local GGUF model."""
    llm = load_model()
    with _llm_lock:
        output = llm(
            prompt,
            max_tokens=max_tokens,
            temperature=1.0,
            top_p=0.95,
            top_k=64,
            repeat_penalty=1.12,
            stop=["<end_of_turn>", "<eos>"],
        )

    text = output["choices"][0]["text"].strip()
    return remove_thinking_block(text)


def load_model() -> object:
    """Load the GGUF model once and keep it warm for future requests."""
    global _llm, _loaded_path

    model_path = active_model_path()
    if model_path is None:
        raise RuntimeError("モデルファイルが見つかりません。")

    path_str = str(model_path)

    if _llm is not None and _loaded_path == path_str:
        return _llm

    from llama_cpp import Llama

    with _llm_lock:
        _llm = Llama(
            model_path=path_str,
            n_ctx=8192,
            n_threads=None,
            verbose=False,
        )
        _loaded_path = path_str

    return _llm


def remove_thinking_block(text: str) -> str:
    """Hide Gemma 4 thinking channel tags if the model emits them."""
    text = re.sub(
        r"<\|channel>thought.*?<channel\|>",
        "",
        text,
        flags=re.DOTALL,
    ).strip()
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
    return text
