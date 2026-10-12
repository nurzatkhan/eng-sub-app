import type { DictionaryEntry } from "@/shared/api";

/** Offline dictionary file: public/dictionaries/<lang>.json (see scripts/build-dictionaries.mjs) */
export type DictionaryData = {
  v: number;
  lang: string;
  /** word -> [[part of speech, translations], …] */
  words: Record<string, [pos: string, terms: string[]][]>;
  /** inflected form -> lemma, e.g. "ran" -> "run" */
  forms: Record<string, string>;
};

export type TranslationSource = "dictionary" | "on-device" | "local-mt" | "google";

export type WordLookup = {
  /** dictionary headword the clicked word resolved to ("ran" -> "run") */
  lemma: string;
  /** main translation to show first */
  primary: string;
  entries: DictionaryEntry[];
  source: TranslationSource;
};

export type TextTranslation = {
  text: string;
  source: Exclude<TranslationSource, "dictionary">;
};
