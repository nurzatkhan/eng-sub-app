import { formatSrtTimestamp } from "@/shared/lib/format-time";
import type { Cue } from "../model/types";

export function toSrt(cues: Cue[]): string {
  return cues
    .map((c, i) => `${i + 1}\n${formatSrtTimestamp(c.start)} --> ${formatSrtTimestamp(c.end)}\n${c.text}\n`)
    .join("\n");
}
