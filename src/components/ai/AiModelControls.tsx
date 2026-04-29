import { Badge, Group, Progress, Select, Stack, Text } from "@mantine/core";
import { Sparkles } from "lucide-react";

import type { AiModelEntry, AiStatus } from "../../lib/aiClient";

type AiModelControlsProps = {
  downloadProgress: number;
  isDownloading: boolean;
  onSelectModel: (modelKey: string) => void;
  ready: boolean;
  selectedModelKey: string;
  status: AiStatus | null;
};

export function AiModelControls({
  downloadProgress,
  isDownloading,
  onSelectModel,
  ready,
  selectedModelKey,
  status,
}: AiModelControlsProps) {
  const modelOptions: { value: string; label: string }[] =
    status?.models?.map((model: AiModelEntry) => ({
      value: model.key,
      label: `${model.name}${model.ready ? " ✓" : ""}`,
    })) ?? [
      { value: "lightweight", label: "Gemma 4 E2B-it（軽量版）" },
      { value: "standard", label: "Gemma 4 E4B-it（標準版）" },
      { value: "high_quality", label: "Gemma 4 26B-A4B-it（高品質版）" },
    ];
  const selectedModelInfo = status?.models?.find((model) => model.key === selectedModelKey);

  return (
    <Stack gap="md">
      <div>
        <Group justify="space-between" align="center" mb="xs">
          <Group gap={8}>
            <Sparkles size={17} />
            <Text fw={800}>AI相談</Text>
          </Group>
          <Badge variant="light" color={ready ? "teal" : "gray"}>
            {ready ? "準備済み" : "未準備"}
          </Badge>
        </Group>
        <Text size="sm" c="dimmed">
          {status?.message ?? "AI状態を確認しています…"}
        </Text>
        {status?.model && (
          <Text size="xs" c="dimmed" mt={4}>
            {status.model.name} / {status.model.license}
          </Text>
        )}
      </div>

      <Select
        label="モデルを選択"
        description={selectedModelInfo?.description}
        data={modelOptions}
        value={selectedModelKey}
        onChange={(value) => value && onSelectModel(value)}
        comboboxProps={{ withinPortal: false }}
        disabled={isDownloading}
      />

      {isDownloading && (
        <div className="ai-download">
          <Group justify="space-between" mb={6}>
            <Text size="xs" fw={700} c="dimmed">
              モデルをダウンロード中
            </Text>
            <Text size="xs" c="dimmed">
              {downloadProgress > 0 ? `${downloadProgress}%` : "開始中…"}
            </Text>
          </Group>
          <Progress value={downloadProgress} animated={downloadProgress === 0} />
        </div>
      )}
    </Stack>
  );
}
