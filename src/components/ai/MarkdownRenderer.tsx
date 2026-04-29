import Markdown from "react-markdown";
import type { FC } from "react";

type MarkdownRendererProps = {
  content: string;
};

/**
 * AIの出力テキストをマークダウンとして整形表示するコンポーネント。
 * react-markdown で見出し・リスト・太字・コードブロック等を描画する。
 */
export const MarkdownRenderer: FC<MarkdownRendererProps> = ({ content }) => {
  return <Markdown>{content}</Markdown>;
};
