import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { Download, FilePlus, Save } from "lucide-react";
import { useState } from "react";

import type { NovelProject } from "../../types/novel";

type TopBarProps = {
  project: NovelProject;
  lastSavedAt: Date | null;
  onCreateProject: (title: string) => void;
  onExportPdf: () => void;
  onRenameProject: (title: string) => void;
};

export function TopBar({
  project,
  lastSavedAt,
  onCreateProject,
  onExportPdf,
  onRenameProject,
}: TopBarProps) {
  const [opened, setOpened] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const savedLabel = lastSavedAt
    ? `${lastSavedAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} 保存`
    : "保存準備中";

  function submitNewProject(): void {
    const title = newProjectTitle.trim();
    if (!title) {
      return;
    }
    onCreateProject(title);
    setNewProjectTitle("");
    setOpened(false);
  }

  return (
    <>
      <Modal opened={opened} onClose={() => setOpened(false)} title="新しい作品" centered>
        <Stack>
          <TextInput
            autoFocus
            label="作品名"
            placeholder="例: 星降る街の郵便屋"
            value={newProjectTitle}
            onChange={(event) => setNewProjectTitle(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submitNewProject();
              }
            }}
          />
          <Group justify="end">
            <Button variant="subtle" color="gray" onClick={() => setOpened(false)}>
              キャンセル
            </Button>
            <Button disabled={!newProjectTitle.trim()} onClick={submitNewProject}>
              作成
            </Button>
          </Group>
        </Stack>
      </Modal>

      <div className="top-bar">
        <Group gap="sm" className="min-w-0 flex-1">
          <TextInput
            aria-label="作品名"
            value={project.title}
            onChange={(event) => onRenameProject(event.currentTarget.value)}
            className="project-title-input"
          />
          <Group gap={6} className="save-state">
            <Save size={15} />
            <Text size="sm" c="dimmed">
              {savedLabel}
            </Text>
          </Group>
        </Group>

        <Group gap="xs">
          <Tooltip label="新しい作品">
            <ActionIcon variant="subtle" color="gray" size="lg" onClick={() => setOpened(true)}>
              <FilePlus size={19} />
            </ActionIcon>
          </Tooltip>
          <Button leftSection={<Download size={17} />} variant="filled" onClick={onExportPdf}>
            PDF出力
          </Button>
        </Group>
      </div>
    </>
  );
}
