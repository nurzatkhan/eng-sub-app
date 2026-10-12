"use client";

import { memo, useMemo } from "react";
import { cn } from "@/shared/lib/utils";
import { tokenize } from "../lib/tokenize";

export type WordClick = {
  word: string;
  tokenIndex: number;
  element: HTMLElement;
};

type Props = {
  text: string;
  onWordClick?: (click: WordClick) => void;
  /** hover in/out of a word: its token index, or null */
  onWordHover?: (tokenIndex: number | null) => void;
  selectedTokenIndex?: number;
  /** tokens to highlight, e.g. words aligned with the hovered word of a translation */
  highlightedTokens?: ReadonlySet<number>;
  isWordHighlighted?: (word: string) => boolean;
  /** exposed as data-cue-index so keyboard navigation can find the words of a line */
  cueIndex?: number;
  className?: string;
};

export const SubtitleText = memo(function SubtitleText({
  text,
  onWordClick,
  onWordHover,
  selectedTokenIndex,
  highlightedTokens,
  isWordHighlighted,
  cueIndex,
  className,
}: Props) {
  const tokens = useMemo(() => tokenize(text), [text]);

  return (
    <span className={className} data-subtitle-text data-cue-index={cueIndex}>
      {tokens.map((token, i) =>
        token.type === "word" ? (
          <span
            key={i}
            role="button"
            tabIndex={-1}
            data-word
            data-token-index={i}
            onClick={(e) => {
              e.stopPropagation();
              onWordClick?.({ word: token.value, tokenIndex: i, element: e.currentTarget });
            }}
            onMouseEnter={onWordHover && (() => onWordHover(i))}
            onMouseLeave={onWordHover && (() => onWordHover(null))}
            className={cn(
              "cursor-pointer rounded px-px transition-colors hover:bg-amber-300/25",
              isWordHighlighted?.(token.value) && "text-amber-300",
              highlightedTokens?.has(i) && "bg-sky-400/30 hover:bg-sky-400/30",
              selectedTokenIndex === i && "bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            {token.value}
          </span>
        ) : (
          <span key={i}>{token.value}</span>
        ),
      )}
    </span>
  );
});
