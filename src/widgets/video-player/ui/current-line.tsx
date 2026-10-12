"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMediaStore } from "@/entities/media";
import { SubtitleText, findCueIndex, useSubtitleStore, type WordClick } from "@/entities/subtitle";
import { useAlignment, usePrefetchTranslations, useTranslation } from "@/entities/translation";
import { normalizeWord, useVocabularyStore } from "@/entities/word";
import { useLineTranslationStore } from "@/features/line-translation";
import { useWordLookupStore } from "@/features/word-lookup";
import { TranslatedLine } from "./translated-line";

/** how many upcoming lines to translate ahead of time */
const PREFETCH_AHEAD = 2;

/** which side the mouse is over: a word of the original line or of its translation */
type Hover = { side: "source" | "target"; index: number } | null;

/** The playing subtitle line, shown large under the video, with its translation below. */
export function CurrentLine() {
  const cues = useSubtitleStore((s) => s.cues);
  const index = useMediaStore((s) => findCueIndex(cues, s.currentTime));
  const words = useVocabularyStore((s) => s.words);
  const selection = useWordLookupStore((s) => s.selection);
  const open = useWordLookupStore((s) => s.open);
  const showTranslation = useLineTranslationStore((s) => s.enabled);

  const text = index >= 0 ? cues[index].text : "";
  const translation = useTranslation({ text, enabled: showTranslation && !!text });
  const alignment = useAlignment(text, showTranslation ? translation.data?.text : undefined);
  const [hover, setHover] = useState<Hover>(null);

  const prefetch = usePrefetchTranslations();
  useEffect(() => {
    if (!showTranslation || index < 0) return;
    prefetch(cues.slice(index + 1, index + 1 + PREFETCH_AHEAD).map((c) => c.text));
  }, [showTranslation, index, cues, prefetch]);

  const isSaved = useCallback((w: string) => !!words[normalizeWord(w)], [words]);
  const onWordClick = useCallback(
    ({ word, tokenIndex, element }: WordClick) =>
      open({ word, tokenIndex, cueIndex: index, origin: "line", anchor: element }),
    [open, index],
  );
  const onSourceHover = useCallback((i: number | null) => setHover(i == null ? null : { side: "source", index: i }), []);
  const onTargetHover = useCallback((i: number | null) => setHover(i == null ? null : { side: "target", index: i }), []);

  // highlight the hovered word's counterparts on both sides
  const { sourceHighlight, targetHighlight } = useMemo(() => {
    const source = new Set<number>();
    const target = new Set<number>();
    if (hover && alignment) {
      if (hover.side === "source") {
        const aligned = alignment.sourceToTarget.get(hover.index) ?? [];
        if (aligned.length) source.add(hover.index);
        aligned.forEach((j) => target.add(j));
      } else {
        const aligned = alignment.targetToSource.get(hover.index) ?? [];
        if (aligned.length) target.add(hover.index);
        aligned.forEach((i) => source.add(i));
      }
    }
    return { sourceHighlight: source, targetHighlight: target };
  }, [hover, alignment]);

  if (!cues.length) return null;

  return (
    <div className="flex min-h-[5.5em] flex-col items-center gap-1 px-4 text-center">
      <p className="text-lg leading-relaxed lg:text-2xl" data-current-line>
        {index >= 0 && (
          <SubtitleText
            key={text}
            text={text}
            cueIndex={index}
            onWordClick={onWordClick}
            onWordHover={onSourceHover}
            highlightedTokens={sourceHighlight}
            isWordHighlighted={isSaved}
            selectedTokenIndex={
              selection?.origin === "line" && selection.cueIndex === index ? selection.tokenIndex : undefined
            }
          />
        )}
      </p>
      {showTranslation && index >= 0 && (
        <TranslatedLine
          key={text}
          pending={translation.isPending}
          error={translation.isError}
          text={translation.data?.text}
          tokens={alignment?.targetTokens}
          highlightedTokens={targetHighlight}
          onWordHover={onTargetHover}
        />
      )}
    </div>
  );
}
