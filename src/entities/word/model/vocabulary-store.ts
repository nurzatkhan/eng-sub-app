import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeWord } from "../lib/normalize-word";
import type { SavedWord } from "./types";

function omit<T>(record: Record<string, T>, key: string): Record<string, T> {
  const copy = { ...record };
  delete copy[key];
  return copy;
}

type VocabularyState = {
  words: Record<string, SavedWord>;
  toggle: (entry: Omit<SavedWord, "addedAt">) => void;
  setTranslation: (word: string, translation: string) => void;
  remove: (word: string) => void;
};

export const useVocabularyStore = create<VocabularyState>()(
  persist(
    (set) => ({
      words: {},
      toggle: (entry) =>
        set(({ words }) => {
          const key = normalizeWord(entry.word);
          if (words[key]) return { words: omit(words, key) };
          return { words: { ...words, [key]: { ...entry, word: key, addedAt: Date.now() } } };
        }),
      setTranslation: (word, translation) =>
        set(({ words }) => {
          const key = normalizeWord(word);
          return words[key] ? { words: { ...words, [key]: { ...words[key], translation } } } : {};
        }),
      remove: (word) =>
        set(({ words }) => ({ words: omit(words, normalizeWord(word)) })),
    }),
    // rehydrated on the client by StoreHydration to avoid SSR mismatches
    { name: "vocabulary", skipHydration: true },
  ),
);
