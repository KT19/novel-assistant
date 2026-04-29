import { Select, Stack, Tabs, Text } from "@mantine/core";
import { BookOpen, NotebookTabs } from "lucide-react";

import type { CharacterProfile, NovelProject, WorldLocation } from "../../types/novel";
import { ChapterOutlinePanel } from "./ChapterOutlinePanel";
import { ReferenceSettingsPanel } from "./ReferenceSettingsPanel";

type LeftWorkspacePanelProps = {
  activeChapterId: string;
  activeProjectId: string;
  activeSectionId: string;
  project: NovelProject;
  projects: NovelProject[];
  onAddChapter: () => void;
  onAddCharacter: () => void;
  onAddLocation: () => void;
  onAddSection: (chapterId: string) => void;
  onDeleteChapter: (chapterId: string) => void;
  onDeleteCharacter: (characterId: string) => void;
  onDeleteLocation: (locationId: string) => void;
  onDeleteSection: (chapterId: string, sectionId: string) => void;
  onMoveChapter: (chapterId: string, direction: "up" | "down") => void;
  onMoveSection: (chapterId: string, sectionId: string, direction: "up" | "down") => void;
  onSelectSection: (chapterId: string, sectionId: string) => void;
  onSelectProject: (projectId: string) => void;
  onUpdateCharacter: (
    characterId: string,
    input: Partial<Pick<CharacterProfile, "name" | "description">>,
  ) => void;
  onUpdateLocation: (
    locationId: string,
    input: Partial<Pick<WorldLocation, "name" | "description">>,
  ) => void;
  onUpdateStoryNotes: (storyNotes: string) => void;
};

export function LeftWorkspacePanel({
  activeChapterId,
  activeProjectId,
  activeSectionId,
  project,
  projects,
  onAddChapter,
  onAddCharacter,
  onAddLocation,
  onAddSection,
  onDeleteChapter,
  onDeleteCharacter,
  onDeleteLocation,
  onDeleteSection,
  onMoveChapter,
  onMoveSection,
  onSelectSection,
  onSelectProject,
  onUpdateCharacter,
  onUpdateLocation,
  onUpdateStoryNotes,
}: LeftWorkspacePanelProps) {
  return (
    <div className="side-panel">
      <Stack gap="md">
        <div>
          <Text size="xs" fw={700} c="dimmed" mb={6}>
            作品
          </Text>
          <Select
            aria-label="作品を選択"
            data={projects.map((item) => ({ value: item.id, label: item.title }))}
            value={activeProjectId}
            onChange={(value) => value && onSelectProject(value)}
            comboboxProps={{ withinPortal: false }}
          />
        </div>

        <Tabs defaultValue="outline" className="workspace-tabs">
          <Tabs.List grow>
            <Tabs.Tab value="outline" leftSection={<BookOpen size={15} />}>
              目次
            </Tabs.Tab>
            <Tabs.Tab value="references" leftSection={<NotebookTabs size={15} />}>
              設定
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="outline">
            <ChapterOutlinePanel
              activeChapterId={activeChapterId}
              activeSectionId={activeSectionId}
              chapters={project.chapters}
              onAddChapter={onAddChapter}
              onAddSection={onAddSection}
              onDeleteChapter={onDeleteChapter}
              onDeleteSection={onDeleteSection}
              onMoveChapter={onMoveChapter}
              onMoveSection={onMoveSection}
              onSelectSection={onSelectSection}
            />
          </Tabs.Panel>

          <Tabs.Panel value="references">
            <ReferenceSettingsPanel
              project={project}
              onAddCharacter={onAddCharacter}
              onAddLocation={onAddLocation}
              onDeleteCharacter={onDeleteCharacter}
              onDeleteLocation={onDeleteLocation}
              onUpdateCharacter={onUpdateCharacter}
              onUpdateLocation={onUpdateLocation}
              onUpdateStoryNotes={onUpdateStoryNotes}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </div>
  );
}
