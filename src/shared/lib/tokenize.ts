export type Token = { type: "word" | "text"; value: string };

// any script: don't, Gunther's, rock-n-roll, 1990s, картофель-фри
const WORD_RE = /([\p{L}\p{N}]+(?:['’][\p{L}]+)*(?:-[\p{L}\p{N}]+)*)/u;
const HAS_LETTER_RE = /\p{L}/u;

/** Splits text into words and the punctuation/spaces between them. Indices are stable for the same text. */
export function tokenize(text: string): Token[] {
  return text
    .split(WORD_RE)
    .filter(Boolean)
    .map((value) => ({
      type: WORD_RE.test(value) && HAS_LETTER_RE.test(value) ? "word" : "text",
      value,
    }));
}
