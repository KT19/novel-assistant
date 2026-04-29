import { Badge, Button, Group, Stack, Text } from "@mantine/core";
import { Check, LocateFixed } from "lucide-react";

import type { AiSuggestion } from "../../types/aiSuggestion";

type AiSuggestionListProps = {
  activeSuggestionId: string | null;
  onApplySuggestion: (suggestion: AiSuggestion) => void;
  onSelectSuggestion: (suggestionId: string) => void;
  suggestions: AiSuggestion[];
};

export function AiSuggestionList({
  activeSuggestionId,
  onApplySuggestion,
  onSelectSuggestion,
  suggestions,
}: AiSuggestionListProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Stack gap="xs" className="ai-suggestion-list">
      <Group justify="space-between">
        <Text size="xs" fw={800} c="dimmed">
          本文への提案
        </Text>
        <Badge variant="light">{suggestions.length}件</Badge>
      </Group>
      {suggestions.map((suggestion) => (
        <div
          className={
            suggestion.id === activeSuggestionId
              ? "ai-suggestion-card is-active"
              : "ai-suggestion-card"
          }
          key={suggestion.id}
        >
          <Stack gap={6}>
            <Text size="xs" c="dimmed">
              {suggestion.kind === "typo" ? "誤字脱字" : "校正"}
            </Text>
            <Text size="sm" lineClamp={2}>
              {suggestion.sourceText}
            </Text>
            <Text size="sm" c="teal" lineClamp={2}>
              {suggestion.replacementText}
            </Text>
            {suggestion.reason && (
              <Text size="xs" c="dimmed" lineClamp={2}>
                {suggestion.reason}
              </Text>
            )}
            <Group gap="xs">
              <Button
                size="xs"
                variant="subtle"
                leftSection={<LocateFixed size={14} />}
                onClick={() => onSelectSuggestion(suggestion.id)}
              >
                確認
              </Button>
              <Button
                size="xs"
                leftSection={<Check size={14} />}
                onClick={() => onApplySuggestion(suggestion)}
              >
                適用
              </Button>
            </Group>
          </Stack>
        </div>
      ))}
    </Stack>
  );
}
