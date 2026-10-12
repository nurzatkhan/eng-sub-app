import type { Cue } from "../model/types";
import { cleanCueText } from "./parse-subtitles";

/** "[Music]", "(Laughter)" */
const NON_SPEECH_RE = /^\[.*\]$|^\(.*\)$/;

/**
 * Cleans text, drops empty and non-speech lines, sorts, and trims each cue's end
 * so it doesn't overlap the next one (auto-generated YouTube captions overlap a lot).
 */
export function normalizeCues(cues: Cue[]): Cue[] {
  const out = cues
    .map((c) => ({ ...c, text: cleanCueText(c.text) }))
    .filter((c) => c.text && !NON_SPEECH_RE.test(c.text))
    .sort((a, b) => a.start - b.start);

  for (let i = 0; i < out.length - 1; i++) {
    if (out[i].end > out[i + 1].start) out[i].end = out[i + 1].start;
  }
  return out;
}
