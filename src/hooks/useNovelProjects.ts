import { useEffect, useMemo, useState } from "react";

import * as chapterOps from "../lib/projectChapters";
import * as referenceOps from "../lib/projectReferences";
import { createBlankProject } from "../lib/sampleProject";
import { loadWorkspace, saveWorkspace } from "../lib/storage";
import type { CharacterProfile, NovelProject, Section, WorldLocation } from "../types/novel";

type UpdateProjectInput = Partial<
  Pick<NovelProject, "title" | "chapters" | "characters" | "locations" | "storyNotes">
>;

export function useNovelProjects() {
  const initialProject = useMemo(() => createBlankProject(), []);
  const [projects, setProjects] = useState<NovelProject[]>([initialProject]);
  const [activeProjectId, setActiveProjectId] = useState<string>(initialProject.id);
  const [activeChapterId, setActiveChapterId] = useState<string>(initialProject.chapters[0].id);
  const [activeSectionId, setActiveSectionId] = useState<string>(
    initialProject.chapters[0].sections[0].id,
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [activeProjectId, projects],
  );

  const activeChapter = useMemo(
    () =>
      activeProject.chapters.find((chapter) => chapter.id === activeChapterId) ??
      activeProject.chapters[0],
    [activeChapterId, activeProject.chapters],
  );

  const activeSection = useMemo(
    () =>
      activeChapter.sections.find((section) => section.id === activeSectionId) ??
      activeChapter.sections[0],
    [activeChapter.sections, activeSectionId],
  );

  useEffect(() => {
    let ignore = false;

    async function loadSavedWorkspace(): Promise<void> {
      const snapshot = await loadWorkspace();
      if (ignore) {
        return;
      }

      const loadedProjects =
        snapshot.projects.length > 0 ? snapshot.projects : [createBlankProject()];
      const selectedProject =
        loadedProjects.find((project) => project.id === snapshot.activeProjectId) ??
        loadedProjects[0];

      setProjects(loadedProjects);
      setActiveProjectId(selectedProject.id);
      setActiveChapterId(selectedProject.chapters[0].id);
      setActiveSectionId(selectedProject.chapters[0].sections[0].id);
      setIsLoaded(true);
    }

    loadSavedWorkspace().catch(() => {
      if (!ignore) {
        setIsLoaded(true);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!activeProjectId && projects[0]) {
      setActiveProjectId(projects[0].id);
    }
  }, [activeProjectId, projects]);

  useEffect(() => {
    if (!activeChapterId && activeProject.chapters[0]) {
      setActiveChapterId(activeProject.chapters[0].id);
    }
  }, [activeChapterId, activeProject.chapters]);

  useEffect(() => {
    if (!activeSectionId && activeChapter.sections[0]) {
      setActiveSectionId(activeChapter.sections[0].id);
    }
  }, [activeChapter.sections, activeSectionId]);

  useEffect(() => {
    if (!isLoaded) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      saveWorkspace({ activeProjectId: activeProject.id, projects })
        .then(() => setLastSavedAt(new Date()))
        .catch(() => setLastSavedAt(null));
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [activeProject.id, isLoaded, projects]);

  function createProject(title: string): void {
    const project = createBlankProject(title);
    setProjects((currentProjects) => [project, ...currentProjects]);
    setActiveProjectId(project.id);
    setActiveChapterId(project.chapters[0].id);
    setActiveSectionId(project.chapters[0].sections[0].id);
  }

  function selectProject(projectId: string): void {
    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      return;
    }
    setActiveProjectId(project.id);
    setActiveChapterId(project.chapters[0]?.id ?? "");
    setActiveSectionId(project.chapters[0]?.sections[0]?.id ?? "");
  }

  function updateActiveProject(input: UpdateProjectInput): void {
    const now = new Date().toISOString();
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === activeProject.id
          ? { ...project, ...input, updatedAt: now }
          : project,
      ),
    );
  }

  function updateStoryNotes(storyNotes: string): void {
    updateActiveProject({ storyNotes });
  }

  function addCharacter(): void {
    updateActiveProject({ characters: referenceOps.addCharacterToProject(activeProject) });
  }

  function updateCharacter(
    characterId: string,
    input: Partial<Pick<CharacterProfile, "name" | "description">>,
  ): void {
    updateActiveProject({
      characters: referenceOps.updateCharacterInProject(activeProject, characterId, input),
    });
  }

  function deleteCharacter(characterId: string): void {
    updateActiveProject({
      characters: referenceOps.deleteCharacterFromProject(activeProject, characterId),
    });
  }

  function addLocation(): void {
    updateActiveProject({ locations: referenceOps.addLocationToProject(activeProject) });
  }

  function updateLocation(
    locationId: string,
    input: Partial<Pick<WorldLocation, "name" | "description">>,
  ): void {
    updateActiveProject({
      locations: referenceOps.updateLocationInProject(activeProject, locationId, input),
    });
  }

  function deleteLocation(locationId: string): void {
    updateActiveProject({
      locations: referenceOps.deleteLocationFromProject(activeProject, locationId),
    });
  }

  function addChapter(): void {
    const chapter = chapterOps.createNextChapter(activeProject);
    updateActiveProject({ chapters: [...activeProject.chapters, chapter] });
    setActiveChapterId(chapter.id);
    setActiveSectionId(chapter.sections[0].id);
  }

  function deleteChapter(chapterId: string): void {
    if (activeProject.chapters.length === 1) {
      return;
    }
    const nextChapters = activeProject.chapters.filter((chapter) => chapter.id !== chapterId);
    updateActiveProject({ chapters: nextChapters });
    if (chapterId === activeChapterId) {
      setActiveChapterId(nextChapters[0].id);
      setActiveSectionId(nextChapters[0].sections[0].id);
    }
  }

  function updateActiveChapter(input: { title: string }): void {
    updateActiveProject({
      chapters: chapterOps.updateChapterInProject(activeProject, activeChapter.id, input),
    });
  }

  function updateActiveChapterSummary(summary: string): void {
    updateActiveProject({
      chapters: chapterOps.updateChapterInProject(activeProject, activeChapter.id, { summary }),
    });
  }

  function addSection(chapterId: string): void {
    const chapter = activeProject.chapters.find((item) => item.id === chapterId);
    if (!chapter) {
      return;
    }
    const section = chapterOps.createNextSection(chapter);
    updateActiveProject({ chapters: chapterOps.addSectionToProject(activeProject, chapterId, section) });
    setActiveChapterId(chapterId);
    setActiveSectionId(section.id);
  }

  function deleteSection(chapterId: string, sectionId: string): void {
    const chapter = activeProject.chapters.find((item) => item.id === chapterId);
    if (!chapter || chapter.sections.length === 1) {
      return;
    }
    const nextSections = chapter.sections.filter((section) => section.id !== sectionId);
    updateActiveProject({
      chapters: chapterOps.deleteSectionFromProject(activeProject, chapterId, sectionId),
    });
    if (sectionId === activeSectionId) {
      setActiveChapterId(chapterId);
      setActiveSectionId(nextSections[0].id);
    }
  }

  function updateActiveSection(input: Partial<Pick<Section, "title" | "body">>): void {
    updateActiveProject({
      chapters: chapterOps.updateSectionInProject(
        activeProject,
        activeChapter.id,
        activeSection.id,
        input,
      ),
    });
  }

  function updateActiveSectionSummary(summary: string): void {
    updateActiveProject({
      chapters: chapterOps.updateSectionInProject(activeProject, activeChapter.id, activeSection.id, {
        summary,
      }),
    });
  }

  function moveSection(chapterId: string, sectionId: string, direction: "up" | "down"): void {
    updateActiveProject({
      chapters: chapterOps.moveSectionInProject(activeProject, chapterId, sectionId, direction),
    });
  }

  function selectSection(chapterId: string, sectionId: string): void {
    setActiveChapterId(chapterId);
    setActiveSectionId(sectionId);
  }

  function moveChapter(chapterId: string, direction: "up" | "down"): void {
    updateActiveProject({
      chapters: chapterOps.moveChapterInProject(activeProject, chapterId, direction),
    });
  }

  return {
    activeChapter,
    activeProject,
    activeSection,
    addChapter,
    addCharacter,
    addLocation,
    addSection,
    createProject,
    deleteChapter,
    deleteCharacter,
    deleteLocation,
    deleteSection,
    lastSavedAt,
    moveChapter,
    moveSection,
    projects,
    selectProject,
    selectSection,
    updateActiveChapter,
    updateActiveChapterSummary,
    updateActiveSection,
    updateActiveSectionSummary,
    updateActiveProject,
    updateCharacter,
    updateLocation,
    updateStoryNotes,
  };
}
