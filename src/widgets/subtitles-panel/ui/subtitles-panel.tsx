"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { useMediaStore } from "@/entities/media";
import { SubtitleText, findCueIndex, useSubtitleStore, type Cue, type WordClick } from "@/entities/subtitle";
import { normalizeWord, useVocabularyStore } from "@/entities/word";
import { useWordLookupStore } from "@/features/word-lookup";
import { formatClock } from "@/shared/lib/format-time";
import { cn } from "@/shared/lib/utils";
import { ScrollArea } from "@/shared/ui/scroll-area";

/** after the user scrolls the list manually, don't auto-scroll for this long */
const MANUAL_SCROLL_GRACE_MS = 4000;

export function SubtitlesPanel() {
  const cues = useSubtitleStore((s) => s.cues);
  const activeIndex = useMediaStore((s) => findCueIndex(cues, s.currentTime));
  const seek = useMediaStore((s) => s.seek);
  const words = useVocabularyStore((s) => s.words);
  const selection = useWordLookupStore((s) => s.selection);
  const open = useWordLookupStore((s) => s.open);

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const manualScrollAt = useRef(0);

  useEffect(() => {
    if (activeIndex < 0 || useWordLookupStore.getState().selection) return;
    if (Date.now() - manualScrollAt.current < MANUAL_SCROLL_GRACE_MS) return;
    rowRefs.current[activeIndex]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIndex]);

  const isSaved = useCallback((w: string) => !!words[normalizeWord(w)], [words]);
  const onWordClick = useCallback(
    (cueIndex: number, { word, tokenIndex, element }: WordClick) =>
      open({ word, tokenIndex, cueIndex, origin: "list", anchor: element }),
    [open],
  );
  const onSeek = useCallback((time: number) => seek(time + 0.01, true), [seek]);

  if (!cues.length) {
    return <p className="p-6 text-center text-muted-foreground">Субтитров пока нет</p>;
  }

  return (
    <ScrollArea
      className="h-full"
      onWheel={() => (manualScrollAt.current = Date.now())}
      onTouchMove={() => (manualScrollAt.current = Date.now())}
    >
      <div className="py-2">
        {cues.map((cue, i) => (
          <CueRow
            key={i}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            cue={cue}
            index={i}
            active={i === activeIndex}
            selectedTokenIndex={
              selection?.origin === "list" && selection.cueIndex === i ? selection.tokenIndex : undefined
            }
            isSaved={isSaved}
            onWordClick={onWordClick}
            onSeek={onSeek}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

type CueRowProps = {
  ref: React.Ref<HTMLDivElement>;
  cue: Cue;
  index: number;
  active: boolean;
  selectedTokenIndex?: number;
  isSaved: (word: string) => boolean;
  onWordClick: (cueIndex: number, click: WordClick) => void;
  onSeek: (time: number) => void;
};

const CueRow = memo(function CueRow({
  ref,
  cue,
  index,
  active,
  selectedTokenIndex,
  isSaved,
  onWordClick,
  onSeek,
}: CueRowProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex gap-3 border-l-[3px] border-transparent px-4 py-2 leading-relaxed",
        active && "border-primary bg-primary/10",
      )}
    >
      <button
        type="button"
        title="Перейти к этой строке"
        onClick={() => onSeek(cue.start)}
        className="w-11 shrink-0 pt-0.5 text-left text-xs text-muted-foreground tabular-nums hover:text-primary"
      >
        {formatClock(cue.start)}
      </button>
      <SubtitleText
        text={cue.text}
        cueIndex={index}
        className="flex-1"
        selectedTokenIndex={selectedTokenIndex}
        isWordHighlighted={isSaved}
        onWordClick={(click) => onWordClick(index, click)}
      />
    </div>
  );
});
