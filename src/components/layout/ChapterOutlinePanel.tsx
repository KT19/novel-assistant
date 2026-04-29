import {
  ActionIcon,
  Button,
  Collapse,
  Group,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { ChevronDown, ChevronRight, ChevronUp, Plus, Trash2 } from "lucide-react";
import { type KeyboardEvent, useState } from "react";

import type { Chapter } from "../../types/novel";

type ChapterOutlinePanelProps = {
  activeChapterId: string;
  activeSectionId: string;
  chapters: Chapter[];
  onAddChapter: () => void;
  onAddSection: (chapterId: string) => void;
  onDeleteChapter: (chapterId: string) => void;
  onDeleteSection: (chapterId: string, sectionId: string) => void;
  onMoveChapter: (chapterId: string, direction: "up" | "down") => void;
  onMoveSection: (chapterId: string, sectionId: string, direction: "up" | "down") => void;
  onSelectSection: (chapterId: string, sectionId: string) => void;
};

function countCharacters(text: string): number {
  return text.replace(/\s/g, "").length;
}

function activateOnKeyboard(event: KeyboardEvent<HTMLDivElement>, action: () => void): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}

export function ChapterOutlinePanel({
  activeChapterId,
  activeSectionId,
  chapters,
  onAddChapter,
  onAddSection,
  onDeleteChapter,
  onDeleteSection,
  onMoveChapter,
  onMoveSection,
  onSelectSection,
}: ChapterOutlinePanelProps) {
  const [closedChapterIds, setClosedChapterIds] = useState<string[]>([]);

  function toggleChapter(chapterId: string): void {
    setClosedChapterIds((currentIds) =>
      currentIds.includes(chapterId)
        ? currentIds.filter((id) => id !== chapterId)
        : [...currentIds, chapterId],
    );
  }

  function addSectionAndOpenChapter(chapterId: string): void {
    setClosedChapterIds((currentIds) => currentIds.filter((id) => id !== chapterId));
    onAddSection(chapterId);
  }

  return (
    <>
      <Group justify="space-between" mt="md">
        <div>
          <Text size="xs" fw={700} c="dimmed">
            目次
          </Text>
          <Text size="sm" c="dimmed">
            {chapters.length}章 /{" "}
            {chapters.reduce((total, chapter) => total + chapter.sections.length, 0)}節
          </Text>
        </div>
        <Button size="xs" leftSection={<Plus size={15} />} onClick={onAddChapter}>
          章を追加
        </Button>
      </Group>

      <ScrollArea className="chapter-list-scroll">
        <Stack gap="xs">
          {chapters.map((chapter, index) => {
            const selected = chapter.id === activeChapterId;
            const closed = closedChapterIds.includes(chapter.id);
            const chapterCharacters = chapter.sections.reduce(
              (total, section) => total + countCharacters(section.body),
              0,
            );

            return (
              <div className="chapter-tree-group" key={chapter.id}>
                <div
                  className={selected ? "chapter-list-item is-selected" : "chapter-list-item"}
                  onClick={() => toggleChapter(chapter.id)}
                  onKeyDown={(event) =>
                    activateOnKeyboard(event, () => toggleChapter(chapter.id))
                  }
                  role="button"
                  tabIndex={0}
                >
                  <ActionIcon component="span" size="sm" variant="subtle" color="gray">
                    {closed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                  </ActionIcon>
                  <div className="chapter-list-main">
                    <Text size="sm" fw={800} lineClamp={1}>
                      {chapter.title || `第${index + 1}章`}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {chapter.sections.length}節 /{" "}
                      {chapterCharacters.toLocaleString("ja-JP")}字
                    </Text>
                  </div>
                  <Group gap={3} className="chapter-actions">
                    <Tooltip label="節を追加">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="teal"
                        onClick={(event) => {
                          event.stopPropagation();
                          addSectionAndOpenChapter(chapter.id);
                        }}
                      >
                        <Plus size={15} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="上へ">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="gray"
                        onClick={(event) => {
                          event.stopPropagation();
                          onMoveChapter(chapter.id, "up");
                        }}
                      >
                        <ChevronUp size={15} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="下へ">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="gray"
                        onClick={(event) => {
                          event.stopPropagation();
                          onMoveChapter(chapter.id, "down");
                        }}
                      >
                        <ChevronDown size={15} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="章を削除">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        disabled={chapters.length === 1}
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteChapter(chapter.id);
                        }}
                      >
                        <Trash2 size={15} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </div>

                <Collapse in={!closed}>
                  <Stack gap={4} className="section-list">
                    {chapter.sections.map((section, sectionIndex) => {
                      const sectionSelected = section.id === activeSectionId;
                      return (
                        <div
                          className={
                            sectionSelected
                              ? "section-list-item is-selected"
                              : "section-list-item"
                          }
                          key={section.id}
                          onClick={() => onSelectSection(chapter.id, section.id)}
                          onKeyDown={(event) =>
                            activateOnKeyboard(event, () =>
                              onSelectSection(chapter.id, section.id),
                            )
                          }
                          role="button"
                          tabIndex={0}
                        >
                          <div className="chapter-list-main">
                            <Text size="sm" fw={600} lineClamp={1}>
                              {section.title || `第${sectionIndex + 1}節`}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {countCharacters(section.body).toLocaleString("ja-JP")}字
                            </Text>
                          </div>
                          <Group gap={3} className="chapter-actions">
                            <Tooltip label="上へ">
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="gray"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onMoveSection(chapter.id, section.id, "up");
                                }}
                              >
                                <ChevronUp size={15} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="下へ">
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="gray"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onMoveSection(chapter.id, section.id, "down");
                                }}
                              >
                                <ChevronDown size={15} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="節を削除">
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="red"
                                disabled={chapter.sections.length === 1}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onDeleteSection(chapter.id, section.id);
                                }}
                              >
                                <Trash2 size={15} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </div>
                      );
                    })}
                  </Stack>
                </Collapse>
              </div>
            );
          })}
        </Stack>
      </ScrollArea>
    </>
  );
}
