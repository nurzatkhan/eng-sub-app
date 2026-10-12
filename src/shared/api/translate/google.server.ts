import "server-only";
import { cacheLife } from "next/cache";
import type { DictionaryEntry, TranslateParams, TranslationResult } from "./types";

const ENDPOINT = "https://translate.googleapis.com/translate_a/single";

type GoogleResponse = [
  Array<[string, ...unknown[]]> | null,
  Array<[string, string[], ...unknown[]]> | null,
  ...unknown[],
];

export async function translateWithGoogle({
  text,
  to,
  dictionary = false,
}: TranslateParams): Promise<TranslationResult> {
  "use cache";
  cacheLife("max");

  const url = new URL(ENDPOINT);
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", to);
  url.searchParams.append("dt", "t");
  if (dictionary) url.searchParams.append("dt", "bd");
  url.searchParams.set("q", text);

  // fail fast: this is only a fallback, and Google rate-limits keyless clients (HTTP 429)
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Google Translate responded ${res.status}`);
  const data = (await res.json()) as GoogleResponse;

  const dict: DictionaryEntry[] =
    dictionary && Array.isArray(data[1])
      ? data[1].map(([pos, terms]) => ({ pos, terms: (terms ?? []).slice(0, 8) }))
      : [];

  return {
    text: (data[0] ?? []).map((segment) => segment[0]).join(""),
    dictionary: dict,
  };
}
