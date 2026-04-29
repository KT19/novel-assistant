import { Group, Text, TextInput } from "@mantine/core";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";

import type { AiSuggestion } from "../../types/aiSuggestion";
import type { Chapter, Section } from "../../types/novel";

type ChapterEditorProps = {
  activeSuggestionId: string | null;
  chapter: Chapter;
  section: Section;
  onChangeChapterTitle: (title: string) => void;
  onChangeSectionBody: (body: string) => void;
  onChangeSectionTitle: (title: string) => void;
  suggestions: AiSuggestion[];
};

function countCharacters(text: string): number {
  return text.replace(/\s/g, "").length;
}

type HighlightRange = {
  end: number;
  selected: boolean;
  start: number;
};

function findHighlightRanges(
  text: string,
  suggestions: AiSuggestion[],
  activeSuggestionId: string | null,
): HighlightRange[] {
  return suggestions
    .flatMap((suggestion) => {
      if (!suggestion.sourceText) {
        return [];
      }
      const ranges: HighlightRange[] = [];
      let start = text.indexOf(suggestion.sourceText);
      while (start >= 0) {
        ranges.push({
          end: start + suggestion.sourceText.length,
          selected: suggestion.id === activeSuggestionId,
          start,
        });
        start = text.indexOf(suggestion.sourceText, start + suggestion.sourceText.length);
      }
      return ranges;
    })
    .sort((a, b) => a.start - b.start)
    .filter((range, index, ranges) => index === 0 || range.start >= ranges[index - 1].end);
}

export function ChapterEditor({
  activeSuggestionId,
  chapter,
  section,
  onChangeChapterTitle,
  onChangeSectionBody,
  onChangeSectionTitle,
  suggestions,
}: ChapterEditorProps) {
  const characterCount = countCharacters(section.body);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const highlightLayerRef = useRef<HTMLPreElement | null>(null);
  const highlightRanges = useMemo(
    () => findHighlightRanges(section.body, suggestions, activeSuggestionId),
    [activeSuggestionId, section.body, suggestions],
  );

  useEffect(() => {
    const activeSuggestion = suggestions.find((suggestion) => suggestion.id === activeSuggestionId);
    if (!activeSuggestion || !textareaRef.current) {
      return;
    }
    const start = section.body.indexOf(activeSuggestion.sourceText);
    if (start < 0) {
      return;
    }
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(start, start + activeSuggestion.sourceText.length);
  }, [activeSuggestionId, section.body, suggestions]);

  function syncHighlightScroll(): void {
    if (!textareaRef.current || !highlightLayerRef.current) {
      return;
    }
    highlightLayerRef.current.scrollTop = textareaRef.current.scrollTop;
    highlightLayerRef.current.scrollLeft = textareaRef.current.scrollLeft;
  }

  return (
    <main className="editor-shell">
      <div className="editor-header">
        <div className="editor-title-stack">
          <TextInput
            aria-label="章タイトル"
            value={chapter.title}
            onChange={(event) => onChangeChapterTitle(event.currentTarget.value)}
            classNames={{ input: "chapter-title-input" }}
          />
          <TextInput
            aria-label="節タイトル"
            value={section.title}
            onChange={(event) => onChangeSectionTitle(event.currentTarget.value)}
            classNames={{ input: "section-title-input" }}
          />
        </div>
        <Group gap="lg">
          <Text size="sm" c="dimmed">
            {characterCount.toLocaleString("ja-JP")}字
          </Text>
          <Text size="sm" c="dimmed">
            {section.body.split(/\n/).length.toLocaleString("ja-JP")}行
          </Text>
        </Group>
      </div>

      <div className="editor-textarea-root">
        <pre className="editor-highlight-layer" ref={highlightLayerRef} aria-hidden="true">
          <HighlightedBody text={section.body} ranges={highlightRanges} />
        </pre>
        <textarea
          aria-label="本文"
          value={section.body}
          onChange={(event) => onChangeSectionBody(event.currentTarget.value)}
          onScroll={syncHighlightScroll}
          placeholder="ここに本文を書き始めます。"
          className="editor-textarea"
          ref={textareaRef}
        />
      </div>
    </main>
  );
}

type HighlightedBodyProps = {
  ranges: HighlightRange[];
  text: string;
};

function HighlightedBody({ ranges, text }: HighlightedBodyProps) {
  if (ranges.length === 0) {
    return <>{text || " "}</>;
  }

  const segments: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((range, index) => {
    if (range.start > cursor) {
      segments.push(text.slice(cursor, range.start));
    }
    segments.push(
      <mark className={range.selected ? "is-selected" : ""} key={`${range.start}-${index}`}>
        {text.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  });
  if (cursor < text.length) {
    segments.push(text.slice(cursor));
  }
  return <>{segments}</>;
}
