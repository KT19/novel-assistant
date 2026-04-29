import { createId } from "./id";
import type { NovelProject } from "../types/novel";

export function createBlankProject(title = "無題の作品"): NovelProject {
  const now = new Date().toISOString();
  return {
    id: createId("project"),
    title,
    chapters: [
      {
        id: createId("chapter"),
        title: "第1章",
        sections: [
          {
            id: createId("section"),
            title: "第1節",
            body: "",
            updatedAt: now,
          },
        ],
        updatedAt: now,
      },
    ],
    characters: [],
    locations: [],
    storyNotes: "",
    createdAt: now,
    updatedAt: now,
  };
}
