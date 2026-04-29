"""Prompt builders for the local novel-writing assistant."""

from __future__ import annotations

from typing import Any

SYSTEM_PROMPT = (
    "あなたは日本語小説の執筆を支援する編集者AIです。"
    "回答は日本語で、具体的かつ短く、作者が次に直せる形で返してください。"
    "本文の創作意図を尊重し、断定しすぎず、改善候補として提案してください。"
    "回答にはマークダウン記法（見出し・箇条書き・太字など）を使い、読みやすく整形してください。"
)


def build_prompt(request: dict[str, Any]) -> str:
    """Build an instruction prompt for the selected AI mode."""
    mode = request["mode"]
    project = request["project"]
    chapter = request["chapter"]
    section = request["section"]
    persona = request.get("readerPersona", "")

    task = mode_instruction(mode, persona)
    reference_context = build_reference_context(project)
    previous_context = build_previous_chapters_context(project, chapter["id"])
    chapter_context = build_chapter_context(chapter, include_body=False)
    target_body = build_current_chapter_body(chapter) if uses_chapter_body(mode) else section["body"]
    target_label = "現在の章全体" if uses_chapter_body(mode) else "現在の節"
    context = (
        f"作品名: {project['title']}\n"
        f"現在の章: {chapter['title']}\n"
        f"現在表示中の節: {section['title']}\n"
        f"\n設定資料:\n{reference_context}\n"
        f"\n前章までの情報:\n{previous_context}\n"
        f"\n現在の章内情報:\n{chapter_context}\n"
        f"\n対象範囲: {target_label}\n"
        f"\n対象本文:\n{target_body}"
    )

    return (
        "<start_of_turn>user\n"
        f"{SYSTEM_PROMPT}\n\n"
        f"{task}\n\n{context}<end_of_turn>\n"
        "<start_of_turn>model\n"
    )


def build_reference_context(project: dict[str, Any]) -> str:
    """Format project-level notes, characters, and locations for the prompt."""
    notes = project["storyNotes"].strip() or "なし"
    characters = "\n".join(
        f"- {character['name']}: {character['description'] or '説明なし'}"
        for character in project["characters"]
    )
    locations = "\n".join(
        f"- {location['name']}: {location['description'] or '説明なし'}"
        for location in project["locations"]
    )
    return (
        f"作品メモ:\n{notes}\n\n"
        f"キャラクター:\n{characters or 'なし'}\n\n"
        f"街・場所:\n{locations or 'なし'}"
    )


def build_chapter_context(chapter: dict[str, Any], include_body: bool) -> str:
    """Format chapter section titles and saved summaries for the prompt."""
    lines: list[str] = []
    for index, section in enumerate(chapter["sections"], start=1):
        summary = section.get("summary") or "要約なし"
        lines.append(f"{index}. {section['title']} / 要約: {summary}")
        if include_body:
            lines.append(section["body"])
    return "\n".join(lines)


def build_previous_chapters_context(project: dict[str, Any], current_chapter_id: str) -> str:
    """Format summaries and section titles before the current chapter."""
    lines: list[str] = []
    for chapter_index, chapter in enumerate(project["chapters"], start=1):
        if chapter["id"] == current_chapter_id:
            break
        chapter_summary = chapter.get("summary") or "章要約なし"
        lines.append(f"第{chapter_index}章: {chapter['title']} / 要約: {chapter_summary}")
        for section_index, section in enumerate(chapter["sections"], start=1):
            section_summary = section.get("summary") or "要約なし"
            lines.append(f"  {chapter_index}-{section_index}. {section['title']} / 要約: {section_summary}")
    return "\n".join(lines) or "なし"


def build_current_chapter_body(chapter: dict[str, Any]) -> str:
    """Format all section bodies in the current chapter."""
    lines: list[str] = []
    for index, section in enumerate(chapter["sections"], start=1):
        lines.append(f"## {index}. {section['title']}")
        lines.append(section["body"])
    return "\n\n".join(lines)


def uses_chapter_body(mode: str) -> bool:
    """Return whether the mode should read the whole current chapter."""
    return mode in {"reader", "consistency", "chapter_summary"}


def mode_instruction(mode: str, persona: str) -> str:
    """Return the task instruction for a mode."""
    if mode == "reader":
        return (
            f"次の読者ペルソナになりきり、現在の章全体を読んだ感想と評価をしてください: {persona}\n"
            "前章までの情報は文脈把握のために参照し、評価対象は現在の章に限定してください。\n"
            "全体で1200字以内に収め、最後に文字数は書かないでください。\n"
            "## 良い点\n## 気になった点\n## 続きを読みたくなる度合い\n## 改善提案\n"
            "の形式で回答してください。"
        )
    if mode == "consistency":
        return (
            "現在の章全体について、本文内の矛盾、時系列の混乱、人物設定・場所設定との食い違い候補を指摘してください。\n"
            "前章までの情報は照合材料として参照してください。\n"
            "全体で1200字以内に収め、最後に文字数は書かないでください。\n"
            "箇条書きで、該当箇所の引用、矛盾する相手、理由を添えてください。"
        )
    if mode == "typo":
        return (
            "誤字脱字、助詞の抜け、変換ミス候補を指摘してください。"
            "各項目は必ず次の3行形式にしてください。\n"
            "- 原文: 本文から抜き出した完全一致の文字列\n"
            "  修正案: 置き換える文字列\n"
            "  理由: 短い理由\n"
            "本文に存在しない原文は書かないでください。"
        )
    if mode == "proof":
        return (
            "文章の流れ、表現の重複、読みづらい文、文末の単調さを校正してください。"
            "各項目は必ず次の3行形式にしてください。\n"
            "- 原文: 本文から抜き出した完全一致の文字列\n"
            "  改善案: 置き換える文字列\n"
            "  理由: 短い理由\n"
            "本文に存在しない原文は書かないでください。"
        )
    if mode == "names":
        return (
            "本文の雰囲気・世界観に合うキャラクター名、街名、施設名の候補を"
            "理由つきで出してください。各カテゴリごとに分けてください。"
        )
    if mode == "chapter_summary":
        return (
            "この章全体を要約してください。設定資料と各節の流れを踏まえてください。\n"
            "全体で1000字以内に収め、最後に文字数は書かないでください。\n"
            "## 章要約\n## 重要な出来事\n## 未回収の要素\nの形式で回答してください。"
        )
    return (
        "この節の内容を短く要約し、次の節へつなぐための要点を出してください。"
        "## 要約\n## 次の節へのつなぎ\nの形式で回答してください。"
    )
