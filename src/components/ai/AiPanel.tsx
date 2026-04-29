import {
  Button,
  Divider,
  Loader,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { Bot, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import {
  type AiMode,
  type AiStatus,
  generateAiResponse,
  loadAiStatus,
  setupAi,
} from "../../lib/aiClient";
import { parseAiSuggestions } from "../../lib/aiSuggestions";
import type { AiSuggestion } from "../../types/aiSuggestion";
import type { Chapter, NovelProject, Section } from "../../types/novel";
import { AiModelControls } from "./AiModelControls";
import { AiSuggestionList } from "./AiSuggestionList";
import { MarkdownRenderer } from "./MarkdownRenderer";

type AiPanelProps = {
  activeSuggestionId: string | null;
  chapter: Chapter;
  onApplySuggestion: (suggestion: AiSuggestion) => "applied" | "ambiguous" | "not_found";
  onSaveChapterSummary: (summary: string) => void;
  onSaveSectionSummary: (summary: string) => void;
  onSelectSuggestion: (suggestionId: string | null) => void;
  onSuggestionsChange: (suggestions: AiSuggestion[]) => void;
  project: NovelProject;
  section: Section;
};

const modes: { label: string; value: AiMode }[] = [
  { label: "読者", value: "reader" },
  { label: "矛盾", value: "consistency" },
  { label: "誤字", value: "typo" },
  { label: "校正", value: "proof" },
  { label: "名前", value: "names" },
  { label: "節要約", value: "summary" },
  { label: "章要約", value: "chapter_summary" },
];

function describeAiTarget(mode: AiMode): string {
  if (mode === "reader") {
    return "対象: 現在の章全体。前章までの要約と設定資料も参照します。";
  }
  if (mode === "consistency") {
    return "対象: 現在の章全体。前章までの要約、人物・場所設定と照合します。";
  }
  if (mode === "chapter_summary") {
    return "対象: 現在の章全体。各節の本文をまとめます。";
  }
  if (mode === "summary") {
    return "対象: 現在の節。次の節へつなぐ要点をまとめます。";
  }
  return "対象: 現在の節。本文にある表現を中心に確認します。";
}

export function AiPanel({
  activeSuggestionId,
  chapter,
  onApplySuggestion,
  onSaveChapterSummary,
  onSaveSectionSummary,
  onSelectSuggestion,
  onSuggestionsChange,
  project,
  section,
}: AiPanelProps) {
  const [mode, setMode] = useState<AiMode>("reader");
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModelKey, setSelectedModelKey] = useState("lightweight");
  const [readerPersona, setReaderPersona] = useState(
    "恋愛要素とキャラクターの成長を重視する読者",
  );
  const [result, setResult] = useState(
    "AIを準備すると、ここに相談結果が表示されます。\n\nまずは上のモデルを選択して「AIを準備」ボタンを押してください。",
  );
  const [error, setError] = useState("");
  const [hasGeneratedResult, setHasGeneratedResult] = useState(false);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [suggestionMessage, setSuggestionMessage] = useState("");

  useEffect(() => {
    loadAiStatus()
      .then(setStatus)
      .catch((unknownError: unknown) => {
        const message = unknownError instanceof Error ? unknownError.message : "";
        setError(
          `AIを準備してください。${message ? `\n${message}` : ""}`,
        );
      });
  }, []);

  useEffect(() => {
    if (status?.state !== "downloading") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadAiStatus().then(setStatus).catch(() => undefined);
    }, 1200);

    return () => window.clearInterval(intervalId);
  }, [status?.state]);

  useEffect(() => {
    setSuggestions([]);
    setSuggestionMessage("");
    onSuggestionsChange([]);
    onSelectSuggestion(null);
  }, [mode, onSelectSuggestion, onSuggestionsChange, section.id]);

  async function prepareAi(): Promise<void> {
    setError("");
    setIsSettingUp(true);
    try {
      const nextStatus = await setupAi(selectedModelKey);
      setStatus(nextStatus);
      setHasGeneratedResult(false);
      if (nextStatus.state === "error") {
        setError(nextStatus.error ?? nextStatus.message);
      }
      setResult(
        nextStatus.ready
          ? "AIの準備ができました。\n\n本文を書いて「AIに相談」を押してください。"
          : "モデルをバックグラウンドでダウンロードしています。\n\n完了までこのまま待てます。",
      );
    } catch (unknownError: unknown) {
      const message = unknownError instanceof Error ? unknownError.message : "";
      setError(`AIの準備に失敗しました。${message ? `\n${message}` : ""}`);
    } finally {
      setIsSettingUp(false);
    }
  }

  async function askAi(): Promise<void> {
    setError("");
    setSuggestionMessage("");
    setIsGenerating(true);
    try {
      const text = await generateAiResponse({
        chapter,
        mode,
        project,
        readerPersona,
        section,
      });
      setResult(text);
      setHasGeneratedResult(true);
      const nextSuggestions = parseAiSuggestions(mode, text);
      setSuggestions(nextSuggestions);
      onSuggestionsChange(nextSuggestions);
      onSelectSuggestion(nextSuggestions[0]?.id ?? null);
    } catch (unknownError: unknown) {
      const message = unknownError instanceof Error ? unknownError.message : "";
      setError(`AI相談に失敗しました。${message ? `\n${message}` : ""}`);
    } finally {
      setIsGenerating(false);
    }
  }

  function applySuggestion(suggestion: AiSuggestion): void {
    const statusLabel = onApplySuggestion(suggestion);
    if (statusLabel === "applied") {
      const nextSuggestions = suggestions.filter((item) => item.id !== suggestion.id);
      setSuggestions(nextSuggestions);
      onSuggestionsChange(nextSuggestions);
      onSelectSuggestion(nextSuggestions[0]?.id ?? null);
      setSuggestionMessage("本文に反映しました。");
      return;
    }
    onSelectSuggestion(suggestion.id);
    setSuggestionMessage(
      statusLabel === "ambiguous"
        ? "同じ原文が複数あります。本文のハイライトを確認してから手で直してください。"
        : "本文内に同じ原文が見つかりませんでした。",
    );
  }

  const ready = status?.ready ?? false;
  const canSaveSummary = hasGeneratedResult && !isGenerating && !error.trim();
  const downloadProgress =
    status?.totalBytes && status.totalBytes > 0
      ? Math.round((status.downloadedBytes / status.totalBytes) * 100)
      : 0;
  const isDownloading = status?.state === "downloading";

  return (
    <aside className="ai-panel">
      <Stack gap="md" className="h-full">
        <AiModelControls
          downloadProgress={downloadProgress}
          isDownloading={isDownloading}
          onSelectModel={setSelectedModelKey}
          ready={ready}
          selectedModelKey={selectedModelKey}
          status={status}
        />

        <SegmentedControl
          value={mode}
          onChange={(value) => setMode(value as AiMode)}
          data={modes}
          fullWidth
          className="ai-mode-tabs"
        />

        <Text size="xs" c="dimmed">
          {describeAiTarget(mode)}
        </Text>

        <Textarea
          label="読者ペルソナ"
          value={readerPersona}
          onChange={(event) => setReaderPersona(event.currentTarget.value)}
          minRows={2}
          disabled={mode !== "reader"}
        />

        {!ready ? (
          <Button
            leftSection={isSettingUp ? <Loader size={16} /> : <Bot size={17} />}
            onClick={prepareAi}
            loading={isSettingUp || isDownloading}
          >
            {isDownloading ? "準備中…" : "AIを準備"}
          </Button>
        ) : (
          <Button
            leftSection={isGenerating ? <Loader size={16} /> : <Sparkles size={17} />}
            onClick={askAi}
            loading={isGenerating}
          >
            AIに相談
          </Button>
        )}

        {mode === "summary" && canSaveSummary && (
          <>
            <Divider />
            <Button variant="light" onClick={() => onSaveSectionSummary(result)}>
              節要約に保存
            </Button>
          </>
        )}

        {mode === "chapter_summary" && canSaveSummary && (
          <>
            <Divider />
            <Button variant="light" onClick={() => onSaveChapterSummary(result)}>
              章要約に保存
            </Button>
          </>
        )}

        <AiSuggestionList
          activeSuggestionId={activeSuggestionId}
          suggestions={suggestions}
          onApplySuggestion={applySuggestion}
          onSelectSuggestion={onSelectSuggestion}
        />

        {suggestionMessage && (
          <Text size="xs" c="dimmed" className="whitespace-pre-line">
            {suggestionMessage}
          </Text>
        )}

        <ScrollArea className="ai-result-scroll">
          <div className="ai-result">
            <Text size="xs" fw={800} c="dimmed" mb={8}>
              {project.title} / {chapter.title} / {section.title}
            </Text>
            {error && (
              <Text className="whitespace-pre-line" size="sm" c="red" mb="sm">
                {error}
              </Text>
            )}
            <MarkdownRenderer content={result} />
          </div>
        </ScrollArea>
      </Stack>
    </aside>
  );
}
