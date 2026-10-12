import type { TranslateParams, TranslationResult } from "./types";

export async function fetchTranslation(
  { text, to, dictionary = false }: TranslateParams,
  signal?: AbortSignal,
): Promise<TranslationResult> {
  const params = new URLSearchParams({ q: text, to });
  if (dictionary) params.set("dict", "1");
  const res = await fetch(`/api/translate?${params}`, { signal });
  if (!res.ok) throw new Error(`Translation failed: ${res.status}`);
  return res.json();
}
