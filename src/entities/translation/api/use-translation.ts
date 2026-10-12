"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguageStore } from "../model/language-store";
import type { WordLookup } from "../model/types";
import { alignTranslation, type Alignment } from "../lib/align-translation";
import { lookupWord } from "../lib/lookup-word";
import { translateText } from "./translate-text";
import { useDictionary } from "./use-dictionary";

const TEXT_QUERY_OPTIONS = { staleTime: Infinity, gcTime: 60 * 60 * 1000, retry: false } as const;

/** Translation of a phrase or sentence. */
export function useTranslation({ text, enabled = true }: { text: string; enabled?: boolean }) {
  const to = useLanguageStore((s) => s.target);
  return useQuery({
    queryKey: ["translation", to, text],
    queryFn: ({ signal }) => translateText(text, to, signal),
    enabled: enabled && text.trim().length > 0,
    ...TEXT_QUERY_OPTIONS,
  });
}

type WordTranslationState =
  | { status: "pending" }
  | { status: "error" }
  | { status: "success"; data: WordLookup };

/**
 * Translation of a single word: instant from the offline dictionary,
 * falling back to the text translator for words the dictionary doesn't have.
 */
export function useWordTranslation(word: string): WordTranslationState {
  const to = useLanguageStore((s) => s.target);
  const dictionary = useDictionary();

  const found = useMemo(
    () => (dictionary.data ? lookupWord(dictionary.data, word) : null),
    [dictionary.data, word],
  );
  const needsFallback = dictionary.isError || (dictionary.isSuccess && !found);

  const fallback = useQuery({
    queryKey: ["translation", to, word],
    queryFn: ({ signal }) => translateText(word, to, signal),
    enabled: needsFallback,
    ...TEXT_QUERY_OPTIONS,
  });

  if (found) {
    return {
      status: "success",
      data: { ...found, primary: found.entries[0].terms[0], source: "dictionary" },
    };
  }
  if (!needsFallback || fallback.isPending) return { status: "pending" };
  if (fallback.isError) return { status: "error" };
  return {
    status: "success",
    data: { lemma: word.toLowerCase(), primary: fallback.data.text, entries: [], source: fallback.data.source },
  };
}

/** Warms the cache for upcoming lines so their translation shows up the moment they start. */
export function usePrefetchTranslations() {
  const to = useLanguageStore((s) => s.target);
  const queryClient = useQueryClient();
  return useCallback(
    (texts: string[]) => {
      for (const text of texts) {
        if (!text.trim()) continue;
        void queryClient.prefetchQuery({
          queryKey: ["translation", to, text],
          queryFn: ({ signal }) => translateText(text, to, signal),
          ...TEXT_QUERY_OPTIONS,
        });
      }
    },
    [queryClient, to],
  );
}

/** Word alignment between `source` and its translation, for hover highlighting. Null until ready. */
export function useAlignment(source: string, target: string | undefined): Alignment | null {
  const { data: dict } = useDictionary();
  return useMemo(
    () => (dict && target ? alignTranslation(dict, source, target) : null),
    [dict, source, target],
  );
}

/** Synchronous dictionary lookup for instant UI (hover hints). Null until the dictionary is loaded. */
export function useInstantLookup() {
  const { data } = useDictionary();
  return useMemo(() => (data ? (word: string) => lookupWord(data, word) : null), [data]);
}
