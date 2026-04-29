import { createId } from "./id";
import type { Chapter, NovelProject, Section } from "../types/novel";

export function createNextChapter(project: NovelProject): Chapter {
  const now = new Date().toISOString();
  return {
    id: createId("chapter"),
    title: `第${project.chapters.length + 1}章`,
    sections: [
      {
        id: createId("section"),
        title: "第1節",
        body: "",
        updatedAt: now,
      },
    ],
    updatedAt: now,
  };
}

export function createNextSection(chapter: Chapter): Section {
  return {
    id: createId("section"),
    title: `第${chapter.sections.length + 1}節`,
    body: "",
    updatedAt: new Date().toISOString(),
  };
}

export function updateChapterInProject(
  project: NovelProject,
  chapterId: string,
  input: Partial<Pick<Chapter, "title" | "summary">>,
): Chapter[] {
  const now = new Date().toISOString();
  return project.chapters.map((chapter) =>
    chapter.id === chapterId ? { ...chapter, ...input, updatedAt: now } : chapter,
  );
}

export function addSectionToProject(
  project: NovelProject,
  chapterId: string,
  section: Section,
): Chapter[] {
  return project.chapters.map((chapter) =>
    chapter.id === chapterId
      ? { ...chapter, sections: [...chapter.sections, section], updatedAt: section.updatedAt }
      : chapter,
  );
}

export function deleteSectionFromProject(
  project: NovelProject,
  chapterId: string,
  sectionId: string,
): Chapter[] {
  const now = new Date().toISOString();
  return project.chapters.map((chapter) =>
    chapter.id === chapterId
      ? {
          ...chapter,
          sections: chapter.sections.filter((section) => section.id !== sectionId),
          updatedAt: now,
        }
      : chapter,
  );
}

export function updateSectionInProject(
  project: NovelProject,
  chapterId: string,
  sectionId: string,
  input: Partial<Pick<Section, "title" | "body" | "summary">>,
): Chapter[] {
  const now = new Date().toISOString();
  return project.chapters.map((chapter) =>
    chapter.id === chapterId
      ? {
          ...chapter,
          sections: chapter.sections.map((section) =>
            section.id === sectionId ? { ...section, ...input, updatedAt: now } : section,
          ),
          updatedAt: now,
        }
      : chapter,
  );
}

export function moveSectionInProject(
  project: NovelProject,
  chapterId: string,
  sectionId: string,
  direction: "up" | "down",
): Chapter[] {
  const chapter = project.chapters.find((item) => item.id === chapterId);
  if (!chapter) {
    return project.chapters;
  }
  const currentIndex = chapter.sections.findIndex((section) => section.id === sectionId);
  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= chapter.sections.length) {
    return project.chapters;
  }
  const sections = [...chapter.sections];
  const [section] = sections.splice(currentIndex, 1);
  sections.splice(nextIndex, 0, section);
  const now = new Date().toISOString();
  return project.chapters.map((item) =>
    item.id === chapterId ? { ...item, sections, updatedAt: now } : item,
  );
}

export function moveChapterInProject(
  project: NovelProject,
  chapterId: string,
  direction: "up" | "down",
): Chapter[] {
  const currentIndex = project.chapters.findIndex((chapter) => chapter.id === chapterId);
  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= project.chapters.length) {
    return project.chapters;
  }
  const chapters = [...project.chapters];
  const [chapter] = chapters.splice(currentIndex, 1);
  chapters.splice(nextIndex, 0, chapter);
  return chapters;
}
