import type { AiMode } from "./aiClient";
import type { AiSuggestion } from "../types/aiSuggestion";

type RawSuggestion = Omit<AiSuggestion, "id" | "kind">;

const SOURCE_LABEL = String.raw`(?:原文|誤り|対象|該当箇所)`;
const REPLACEMENT_LABEL = String.raw`(?:修正案|改善案|提案)`;
const REASON_LABEL = String.raw`(?:理由|意図|補足)`;

export function parseAiSuggestions(mode: AiMode, content: string): AiSuggestion[] {
  if (mode !== "typo" && mode !== "proof") {
    return [];
  }

  const rawSuggestions = [
    ...parseLabeledBlocks(content),
    ...parseArrowLines(content),
  ].filter((item) => item.sourceText && item.replacementText);

  return uniqueSuggestions(rawSuggestions).map((item, index) => ({
    id: `${mode}-${index}-${item.sourceText.slice(0, 12)}`,
    kind: mode,
    ...item,
  }));
}

function parseLabeledBlocks(content: string): RawSuggestion[] {
  const pattern = new RegExp(
    `${SOURCE_LABEL}\\s*[:：]\\s*(.+?)\\n\\s*${REPLACEMENT_LABEL}\\s*[:：]\\s*(.+?)(?:\\n\\s*${REASON_LABEL}\\s*[:：]\\s*(.+?))?(?=\\n\\s*(?:[-*\\d.]*\\s*)?${SOURCE_LABEL}\\s*[:：]|$)`,
    "gis",
  );
  return [...content.matchAll(pattern)].map((match) => ({
    sourceText: cleanSuggestionText(match[1]),
    replacementText: cleanSuggestionText(match[2]),
    reason: cleanSuggestionText(match[3] ?? ""),
  }));
}

function parseArrowLines(content: string): RawSuggestion[] {
  const lines = content.split("\n");
  return lines.flatMap((line) => {
    const normalizedLine = line.replace(/\*\*/g, "").replace(/`/g, "");
    const match = normalizedLine.match(/(.+?)\s*(?:→|=>|->)\s*(.+)/);
    if (!match) {
      return [];
    }
    return {
      sourceText: cleanSuggestionText(match[1]),
      replacementText: cleanSuggestionText(match[2]),
      reason: "",
    };
  });
}

function uniqueSuggestions(suggestions: RawSuggestion[]): RawSuggestion[] {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const key = `${suggestion.sourceText}\n${suggestion.replacementText}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function cleanSuggestionText(value: string): string {
  return value
    .replace(/^[\s\-*・\d.)）]+/, "")
    .replace(/^(原文|誤り|対象|該当箇所|修正案|改善案|提案)\s*[:：]\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/^`|`$/g, "")
    .replace(/^「|」$/g, "")
    .replace(/^『|』$/g, "")
    .trim();
}
