import type { NovelProject } from "../types/novel";

const API_BASE_URL = "http://127.0.0.1:8765/api";

export type WorkspaceSnapshot = {
  activeProjectId: string | null;
  projects: NovelProject[];
};

export async function loadWorkspace(): Promise<WorkspaceSnapshot> {
  const response = await fetch(`${API_BASE_URL}/projects`);
  if (!response.ok) {
    throw new Error("作品データの読み込みに失敗しました。");
  }
  return (await response.json()) as WorkspaceSnapshot;
}

export async function saveWorkspace(snapshot: WorkspaceSnapshot): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    body: JSON.stringify(snapshot),
    headers: { "Content-Type": "application/json" },
    method: "PUT",
  });
  if (!response.ok) {
    throw new Error("作品データの保存に失敗しました。");
  }
}
