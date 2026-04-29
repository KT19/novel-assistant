export type AiSuggestionKind = "typo" | "proof";

export type AiSuggestion = {
  id: string;
  kind: AiSuggestionKind;
  sourceText: string;
  replacementText: string;
  reason: string;
};
