import type { Cue } from "../model/types";

/** Index of the cue playing at `time`, or -1. Cues must be sorted by start. */
export function findCueIndex(cues: Cue[], time: number): number {
  let lo = 0;
  let hi = cues.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].start <= time) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found >= 0 && time < cues[found].end ? found : -1;
}

export function findNextCueIndex(cues: Cue[], time: number): number {
  return cues.findIndex((c) => c.start > time + 0.05);
}

/** Start of the current line, or the previous one if we're within its first second. */
export function findPrevCueIndex(cues: Cue[], time: number): number {
  return Math.max(0, cues.findLastIndex((c) => c.start < time - 1));
}
