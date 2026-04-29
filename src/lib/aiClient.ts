import type { Chapter, NovelProject, Section } from "../types/novel";

export type AiMode =
  | "reader"
  | "consistency"
  | "typo"
  | "proof"
  | "names"
  | "summary"
  | "chapter_summary";

export type AiModelEntry = {
  key: string;
  name: string;
  description: string;
  license: string;
  sourceUrl: string;
  ready: boolean;
};

export type AiStatus = {
  downloadedBytes: number;
  error?: string;
  ready: boolean;
  engine: string;
  message: string;
  model: {
    downloadUrl: string;
    license: string;
    name: string;
    sourceUrl: string;
  };
  models?: AiModelEntry[];
  state: "missing" | "downloading" | "ready" | "error";
  totalBytes: number | null;
};

type AiGenerateInput = {
  chapter: Chapter;
  mode: AiMode;
  project: NovelProject;
  readerPersona: string;
  section: Section;
};

const API_BASE_URL = "http://127.0.0.1:8765/api";

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };
    return payload.error ?? payload.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function loadAiStatus(): Promise<AiStatus> {
  const response = await fetch(`${API_BASE_URL}/ai/status`);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "AI状態の確認に失敗しました。"));
  }
  return (await response.json()) as AiStatus;
}

export async function setupAi(modelKey?: string): Promise<AiStatus> {
  const response = await fetch(`${API_BASE_URL}/ai/setup`, {
    body: JSON.stringify({ modelKey }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "AIの準備に失敗しました。"));
  }
  return (await response.json()) as AiStatus;
}

export async function generateAiResponse(input: AiGenerateInput): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/ai/generate`, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "AI相談に失敗しました。"));
  }
  const payload = (await response.json()) as { text: string };
  return payload.text;
}
