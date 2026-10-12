"use client";

import { useMemo } from "react";
import { PlayIcon, Volume2Icon, XIcon } from "lucide-react";
import { useMediaStore } from "@/entities/media";
import { useSubtitleStore } from "@/entities/subtitle";
import { SaveWordButton } from "@/features/save-word";
import { WordTranslation, useWordLookupStore } from "@/features/word-lookup";
import { speakEnglish } from "@/shared/lib/speech";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverAnchor, PopoverContent } from "@/shared/ui/popover";

/** One popover for the whole page, anchored to whichever word was clicked. */
export function WordLookupPopover() {
  const selection = useWordLookupStore((s) => s.selection);
  const close = useWordLookupStore((s) => s.close);
  const play = useMediaStore((s) => s.play);
  const sentence = useSubtitleStore((s) => (selection ? (s.cues[selection.cueIndex]?.text ?? "") : ""));

  const virtualRef = useMemo(() => ({ current: selection?.anchor ?? null }), [selection]);

  return (
    <Popover open={!!selection} onOpenChange={(open) => !open && close()}>
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        className="max-h-[60vh] w-80 overflow-y-auto"
        collisionPadding={16}
        onOpenAutoFocus={(e) => e.preventDefault()}
        // clicking another word switches the selection instead of closing
        onInteractOutside={(e) => {
          if ((e.target as HTMLElement | null)?.closest?.("[data-word]")) e.preventDefault();
        }}
      >
        {selection && (
          <>
            <div className="flex items-center gap-1">
              <h2 className="flex-1 truncate text-xl font-semibold">{selection.word}</h2>
              <Button variant="ghost" size="icon-sm" aria-label="Произнести" onClick={() => speakEnglish(selection.word)}>
                <Volume2Icon />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Закрыть" onClick={close}>
                <XIcon />
              </Button>
            </div>
            <WordTranslation key={selection.word + sentence} word={selection.word} sentence={sentence} />
            <div className="flex flex-wrap gap-2 pt-1">
              <SaveWordButton word={selection.word} context={sentence} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  close();
                  play();
                }}
              >
                <PlayIcon />
                Продолжить
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
