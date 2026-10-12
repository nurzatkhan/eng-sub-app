"use client";

import { useLocalMtStatus } from "@/shared/lib/local-mt";
import type { Token } from "@/shared/lib/tokenize";
import { cn } from "@/shared/lib/utils";

type Props = {
  pending: boolean;
  error: boolean;
  text: string | undefined;
  /** tokenized translation; absent until the dictionary is loaded (then the text is shown as is) */
  tokens: Token[] | undefined;
  highlightedTokens: ReadonlySet<number>;
  onWordHover: (tokenIndex: number | null) => void;
};

export function TranslatedLine({ pending, error, text, tokens, highlightedTokens, onWordHover }: Props) {
  const localMt = useLocalMtStatus();

  if (pending) {
    return (
      <p className="text-sm text-muted-foreground">
        {localMt.state === "loading"
          ? `Загружаю локальный переводчик (один раз, ~110 МБ)… ${localMt.progress.toFixed(0)}%`
          : "Перевожу…"}
      </p>
    );
  }
  if (error || !text) {
    return <p className="text-sm text-muted-foreground">Перевод строки сейчас недоступен</p>;
  }

  return (
    <p className="text-base leading-relaxed text-muted-foreground lg:text-lg">
      {tokens
        ? tokens.map((token, i) =>
            token.type === "word" ? (
              <span
                key={i}
                onMouseEnter={() => onWordHover(i)}
                onMouseLeave={() => onWordHover(null)}
                className={cn(
                  "rounded px-px transition-colors",
                  highlightedTokens.has(i) && "bg-sky-400/30 text-foreground",
                )}
              >
                {token.value}
              </span>
            ) : (
              <span key={i}>{token.value}</span>
            ),
          )
        : text}
    </p>
  );
}
