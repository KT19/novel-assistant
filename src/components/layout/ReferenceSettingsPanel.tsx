import {
  ActionIcon,
  Button,
  Group,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { MapPin, Plus, Trash2, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import type { CharacterProfile, NovelProject, WorldLocation } from "../../types/novel";

type ReferenceSettingsPanelProps = {
  project: NovelProject;
  onAddCharacter: () => void;
  onAddLocation: () => void;
  onDeleteCharacter: (characterId: string) => void;
  onDeleteLocation: (locationId: string) => void;
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

export function ReferenceSettingsPanel({
  project,
  onAddCharacter,
  onAddLocation,
  onDeleteCharacter,
  onDeleteLocation,
  onUpdateCharacter,
  onUpdateLocation,
  onUpdateStoryNotes,
}: ReferenceSettingsPanelProps) {
  return (
    <ScrollArea className="settings-scroll">
      <Stack gap="lg">
        <section>
          <Text size="xs" fw={700} c="dimmed" mb={6}>
            作品メモ
          </Text>
          <Textarea
            aria-label="作品メモ"
            minRows={5}
            autosize
            placeholder="世界観、時系列、伏線、守りたい設定を書いておけます。"
            value={project.storyNotes}
            onChange={(event) => onUpdateStoryNotes(event.currentTarget.value)}
          />
        </section>

        <ReferenceSectionHeader
          icon={<UserRound size={16} />}
          title="キャラクター"
          count={project.characters.length}
          actionLabel="人物を追加"
          onAdd={onAddCharacter}
        />
        <Stack gap="sm">
          {project.characters.length === 0 ? (
            <Text size="sm" c="dimmed">
              まだ人物設定がありません。
            </Text>
          ) : (
            project.characters.map((character) => (
              <div className="reference-item" key={character.id}>
                <Group justify="space-between" align="start" gap="xs">
                  <TextInput
                    aria-label="キャラクター名"
                    value={character.name}
                    onChange={(event) =>
                      onUpdateCharacter(character.id, { name: event.currentTarget.value })
                    }
                    className="reference-name-input"
                  />
                  <Tooltip label="人物を削除">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => onDeleteCharacter(character.id)}
                    >
                      <Trash2 size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
                <Textarea
                  aria-label={`${character.name || "キャラクター"}の説明`}
                  minRows={3}
                  autosize
                  value={character.description}
                  onChange={(event) =>
                    onUpdateCharacter(character.id, {
                      description: event.currentTarget.value,
                    })
                  }
                />
              </div>
            ))
          )}
        </Stack>

        <ReferenceSectionHeader
          icon={<MapPin size={16} />}
          title="街・場所"
          count={project.locations.length}
          actionLabel="場所を追加"
          onAdd={onAddLocation}
        />
        <Stack gap="sm">
          {project.locations.length === 0 ? (
            <Text size="sm" c="dimmed">
              まだ場所設定がありません。
            </Text>
          ) : (
            project.locations.map((location) => (
              <div className="reference-item" key={location.id}>
                <Group justify="space-between" align="start" gap="xs">
                  <TextInput
                    aria-label="場所名"
                    value={location.name}
                    onChange={(event) =>
                      onUpdateLocation(location.id, { name: event.currentTarget.value })
                    }
                    className="reference-name-input"
                  />
                  <Tooltip label="場所を削除">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => onDeleteLocation(location.id)}
                    >
                      <Trash2 size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
                <Textarea
                  aria-label={`${location.name || "場所"}の説明`}
                  minRows={3}
                  autosize
                  value={location.description}
                  onChange={(event) =>
                    onUpdateLocation(location.id, {
                      description: event.currentTarget.value,
                    })
                  }
                />
              </div>
            ))
          )}
        </Stack>
      </Stack>
    </ScrollArea>
  );
}

type ReferenceSectionHeaderProps = {
  actionLabel: string;
  count: number;
  icon: ReactNode;
  onAdd: () => void;
  title: string;
};

function ReferenceSectionHeader({
  actionLabel,
  count,
  icon,
  onAdd,
  title,
}: ReferenceSectionHeaderProps) {
  return (
    <Group justify="space-between" align="center">
      <Group gap={7}>
        {icon}
        <div>
          <Text size="xs" fw={700} c="dimmed">
            {title}
          </Text>
          <Text size="sm" c="dimmed">
            {count}件
          </Text>
        </div>
      </Group>
      <Button size="xs" leftSection={<Plus size={15} />} onClick={onAdd}>
        {actionLabel}
      </Button>
    </Group>
  );
}
