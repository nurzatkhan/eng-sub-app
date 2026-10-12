import type { Cue } from "../model/types";

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"' };

export function cleanCueText(text: string): string {
  return text
    .replace(/<[^>]+>/g, "") // <i>, <font>, VTT voice tags
    .replace(/\{[^}]*\}/g, "") // ASS-style {\an8}
    .replace(/&(nbsp|amp|lt|gt|quot);/g, (m) => ENTITIES[m])
    .replace(/\s+/g, " ")
    .trim();
}

/** "01:02:03,456" | "02:03.456" -> seconds */
function parseTimestamp(raw: string): number {
  const m = raw.trim().replace(",", ".").match(/(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)/);
  if (!m) return NaN;
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/** Parses SRT and WebVTT. */
export function parseSubtitles(content: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = content.replace(/^﻿/, "").replace(/\r/g, "").split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.split("\n");
    const timingIdx = lines.findIndex((l) => l.includes("-->"));
    if (timingIdx < 0) continue;

    const [rawStart, rawEnd = ""] = lines[timingIdx].split("-->");
    const start = parseTimestamp(rawStart);
    // VTT allows cue settings after the end time: "00:02.000 align:start"
    const end = parseTimestamp(rawEnd.trim().split(/\s+/)[0] ?? "");
    const text = cleanCueText(lines.slice(timingIdx + 1).join(" "));

    if (!Number.isNaN(start) && text) {
      cues.push({ start, end: Number.isNaN(end) ? start + 3 : end, text });
    }
  }
  return cues.sort((a, b) => a.start - b.start);
}

export function isSubtitleFile(file: File): boolean {
  return /\.(srt|vtt)$/i.test(file.name);
}
