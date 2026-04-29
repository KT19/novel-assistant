import { AppShell } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";

import { AiPanel } from "../components/ai/AiPanel";
import { ChapterEditor } from "../components/editor/ChapterEditor";
import { LeftWorkspacePanel } from "../components/layout/LeftWorkspacePanel";
import { TopBar } from "../components/layout/TopBar";
import { exportProjectToPdf } from "../lib/pdfExport";
import { useNovelProjects } from "../hooks/useNovelProjects";
import type { AiSuggestion } from "../types/aiSuggestion";

export function App() {
  const novel = useNovelProjects();
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);

  useEffect(() => {
    setAiSuggestions([]);
    setActiveSuggestionId(null);
  }, [novel.activeSection.id]);

  const replaceSuggestionInBody = useCallback(
    (suggestion: AiSuggestion): "applied" | "ambiguous" | "not_found" => {
      const body = novel.activeSection.body;
      const firstIndex = body.indexOf(suggestion.sourceText);
      if (firstIndex < 0) {
        return "not_found";
      }

      const secondIndex = body.indexOf(
        suggestion.sourceText,
        firstIndex + suggestion.sourceText.length,
      );
      if (secondIndex >= 0) {
        setActiveSuggestionId(suggestion.id);
        return "ambiguous";
      }

      const nextBody =
        body.slice(0, firstIndex) +
        suggestion.replacementText +
        body.slice(firstIndex + suggestion.sourceText.length);
      novel.updateActiveSection({ body: nextBody });
      return "applied";
    },
    [novel],
  );

  return (
    <AppShell
      header={{ height: 58 }}
      navbar={{ width: 304, breakpoint: "md", collapsed: { mobile: false } }}
      aside={{ width: 360, breakpoint: "lg", collapsed: { mobile: true } }}
      padding={0}
    >
      <AppShell.Header>
        <TopBar
          project={novel.activeProject}
          lastSavedAt={novel.lastSavedAt}
          onCreateProject={novel.createProject}
          onExportPdf={() => exportProjectToPdf(novel.activeProject)}
          onRenameProject={(title) => novel.updateActiveProject({ title })}
        />
      </AppShell.Header>

      <AppShell.Navbar>
        <LeftWorkspacePanel
          activeChapterId={novel.activeChapter.id}
          activeSectionId={novel.activeSection.id}
          activeProjectId={novel.activeProject.id}
          project={novel.activeProject}
          projects={novel.projects}
          onAddChapter={novel.addChapter}
          onAddCharacter={novel.addCharacter}
          onAddLocation={novel.addLocation}
          onAddSection={novel.addSection}
          onDeleteChapter={novel.deleteChapter}
          onDeleteCharacter={novel.deleteCharacter}
          onDeleteLocation={novel.deleteLocation}
          onDeleteSection={novel.deleteSection}
          onMoveChapter={novel.moveChapter}
          onMoveSection={novel.moveSection}
          onSelectSection={novel.selectSection}
          onSelectProject={novel.selectProject}
          onUpdateCharacter={novel.updateCharacter}
          onUpdateLocation={novel.updateLocation}
          onUpdateStoryNotes={novel.updateStoryNotes}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <ChapterEditor
          activeSuggestionId={activeSuggestionId}
          chapter={novel.activeChapter}
          section={novel.activeSection}
          onChangeChapterTitle={(title) => novel.updateActiveChapter({ title })}
          onChangeSectionBody={(body) => novel.updateActiveSection({ body })}
          onChangeSectionTitle={(title) => novel.updateActiveSection({ title })}
          suggestions={aiSuggestions}
        />
      </AppShell.Main>

      <AppShell.Aside>
        <AiPanel
          activeSuggestionId={activeSuggestionId}
          project={novel.activeProject}
          chapter={novel.activeChapter}
          section={novel.activeSection}
          onApplySuggestion={replaceSuggestionInBody}
          onSaveChapterSummary={novel.updateActiveChapterSummary}
          onSaveSectionSummary={novel.updateActiveSectionSummary}
          onSelectSuggestion={setActiveSuggestionId}
          onSuggestionsChange={setAiSuggestions}
        />
      </AppShell.Aside>
    </AppShell>
  );
}
