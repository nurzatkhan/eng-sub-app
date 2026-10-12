// Keyboard word-by-word navigation (← / →): selects the previous/next word and opens its translation card.
// Works on the rendered subtitles: words are [data-word][data-token-index] inside [data-subtitle-text][data-cue-index].

import { useMediaStore } from "@/entities/media";
import { findCueIndex, findNextCueIndex, useSubtitleStore } from "@/entities/subtitle";
import { useWordLookupStore, type LookupOrigin } from "@/features/word-lookup";

type Direction = -1 | 1;

const LINE_ROOT = "[data-current-line]";
const LIST_ROOT = "aside";

function wordsOfCue(cueIndex: number, origin: LookupOrigin): HTMLElement[] {
  const root = document.querySelector(`${origin === "line" ? LINE_ROOT : LIST_ROOT} [data-subtitle-text][data-cue-index="${cueIndex}"]`);
  return root ? [...root.querySelectorAll<HTMLElement>("[data-word]")] : [];
}

function select(el: HTMLElement, cueIndex: number, origin: LookupOrigin) {
  el.scrollIntoView({ block: "nearest" });
  useWordLookupStore.getState().open({
    word: el.textContent ?? "",
    tokenIndex: Number(el.dataset.tokenIndex),
    cueIndex,
    origin,
    anchor: el,
  });
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/** Selects the first/last word of a line; for the line under the video, seeks there first so it's rendered. */
async function selectInCue(cueIndex: number, origin: LookupOrigin, which: "first" | "last") {
  const cue = useSubtitleStore.getState().cues[cueIndex];
  if (!cue) return;

  let words = wordsOfCue(cueIndex, origin);
  if (origin === "line" && !words.length) {
    useMediaStore.getState().seek(cue.start + 0.01);
    for (let i = 0; i < 10 && !words.length; i++) {
      await nextFrame();
      words = wordsOfCue(cueIndex, origin);
    }
  }
  const el = which === "first" ? words[0] : words.at(-1);
  if (el) select(el, cueIndex, origin);
}

export function stepWord(direction: Direction) {
  const { cues } = useSubtitleStore.getState();
  if (!cues.length) return;
  const selection = useWordLookupStore.getState().selection;

  // nothing selected yet: start at the edge of the line that's playing (or the nearest one)
  if (!selection) {
    const media = useMediaStore.getState();
    const t = media.controller?.getCurrentTime() ?? media.currentTime;
    let i = findCueIndex(cues, t);
    if (i < 0) i = direction > 0 ? findNextCueIndex(cues, t) : cues.findLastIndex((c) => c.start <= t);
    if (i >= 0) void selectInCue(i, "line", direction > 0 ? "first" : "last");
    return;
  }

  const words = wordsOfCue(selection.cueIndex, selection.origin);
  const pos = words.findIndex((w) => Number(w.dataset.tokenIndex) === selection.tokenIndex);
  const next = pos >= 0 ? words[pos + direction] : undefined;
  if (next) {
    select(next, selection.cueIndex, selection.origin);
    return;
  }
  // past the edge of the line: continue in the neighbouring line
  const cueIndex = selection.cueIndex + direction;
  if (cueIndex >= 0 && cueIndex < cues.length) {
    void selectInCue(cueIndex, selection.origin, direction > 0 ? "first" : "last");
  }
}
