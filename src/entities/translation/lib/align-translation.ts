import { tokenize, type Token } from "@/shared/lib/tokenize";
import type { DictionaryData } from "../model/types";
import { lookupWord } from "./lookup-word";

export type Alignment = {
  targetTokens: Token[];
  /** source token index -> aligned target token indices */
  sourceToTarget: Map<number, number[]>;
  /** target token index -> aligned source token indices */
  targetToSource: Map<number, number[]>;
};

const norm = (w: string) => w.toLowerCase().replace(/ё/g, "е").replace(/’/g, "'");

function commonPrefix(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/**
 * How well a dictionary term matches a word of the translation, 0..1.
 * Inflected languages change endings ("лиса" / "лису", "бежать" / "бежит"), so long words match by stem.
 */
function matchScore(term: string, word: string): number {
  if (term === word) return 1;
  const shorter = Math.min(term.length, word.length);
  if (shorter < 3) return 0;
  const prefix = commonPrefix(term, word);
  if (prefix >= Math.max(3, shorter - 3)) return (prefix / Math.max(term.length, word.length)) * 0.9;
  return 0;
}

/**
 * Word alignment between a subtitle line and its translation, like Yandex Translate's hover highlighting.
 * Translators don't expose alignments, so this pairs words using the offline dictionary.
 */
export function alignTranslation(dict: DictionaryData, source: string, target: string): Alignment {
  const sourceTokens = tokenize(source);
  const targetTokens = tokenize(target);
  const targetWords = targetTokens.map((t, j) => (t.type === "word" ? { j, w: norm(t.value) } : null)).filter((x) => x !== null);

  const sourceWordCount = sourceTokens.filter((t) => t.type === "word").length;
  const candidates: { i: number; j: number; score: number }[] = [];

  let sourcePos = 0;
  sourceTokens.forEach((token, i) => {
    if (token.type !== "word") return;
    const relSource = sourcePos++ / Math.max(1, sourceWordCount - 1);
    const found = lookupWord(dict, token.value);
    if (!found) return;
    const terms = new Set(found.entries.flatMap((e) => e.terms.flatMap((t) => norm(t).split(/[\s,()«»"]+/))).filter(Boolean));

    targetWords.forEach(({ j, w }, k) => {
      let best = 0;
      for (const term of terms) best = Math.max(best, matchScore(term, w));
      if (!best) return;
      // word order is roughly preserved between English and the target languages: prefer nearby words
      const relTarget = k / Math.max(1, targetWords.length - 1);
      candidates.push({ i, j, score: best - Math.abs(relSource - relTarget) * 0.15 });
    });
  });

  // greedy: each target word belongs to one source word; a source word may cover several ("fries" → "картофель фри")
  candidates.sort((a, b) => b.score - a.score);
  const sourceToTarget = new Map<number, number[]>();
  const targetToSource = new Map<number, number[]>();
  for (const { i, j } of candidates) {
    if (targetToSource.has(j)) continue;
    targetToSource.set(j, [i]);
    sourceToTarget.set(i, [...(sourceToTarget.get(i) ?? []), j]);
  }
  return { targetTokens, sourceToTarget, targetToSource };
}
