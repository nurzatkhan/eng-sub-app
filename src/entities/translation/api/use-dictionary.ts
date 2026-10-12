"use client";

import { useQuery } from "@tanstack/react-query";
import { useLanguageStore } from "../model/language-store";
import type { DictionaryData } from "../model/types";

async function fetchDictionary(lang: string, signal?: AbortSignal): Promise<DictionaryData> {
  const res = await fetch(`/dictionaries/${lang}.json`, { signal });
  if (!res.ok) throw new Error(`Dictionary ${lang}: ${res.status}`);
  return res.json();
}

/** Offline dictionary for the current target language. Loaded once and kept for the session. */
export function useDictionary() {
  const lang = useLanguageStore((s) => s.target);
  return useQuery({
    queryKey: ["dictionary", lang],
    queryFn: ({ signal }) => fetchDictionary(lang, signal),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
}
