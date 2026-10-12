import type { DictionaryEntry } from "@/shared/api";
import type { DictionaryData } from "../model/types";

/** Spoken/informal spellings common in subtitles → dictionary headword */
const ALIASES: Record<string, string> = {
  okay: "ok",
  "o.k.": "ok",
  gonna: "going to",
  wanna: "want",
  gotta: "have to",
  kinda: "kind of",
  sorta: "sort of",
  lemme: "let",
  gimme: "give",
  dunno: "know",
  ya: "you",
  yeah: "yes",
  yep: "yes",
  yup: "yes",
  nope: "no",
  "'cause": "because",
  cuz: "because",
  "i'm": "i",
  "won't": "will",
  "can't": "can",
  "shan't": "shall",
  "ain't": "be",
};

/** Articles have no translation in most target languages — explain them instead. */
const ARTICLES: Record<string, DictionaryEntry[]> = {
  the: [{ pos: "article", terms: ["определённый артикль: «тот самый», уже известный предмет"] }],
  a: [{ pos: "article", terms: ["неопределённый артикль: «один», «какой-то»"] }],
  an: [{ pos: "article", terms: ["неопределённый артикль (перед гласным звуком): «один», «какой-то»"] }],
};

/** Frequent function words that Wiktionary translates poorly or in an unhelpful order (Russian only). */
const OVERRIDES: Record<string, Record<string, DictionaryEntry[]>> = {
  ru: {
    i: [{ pos: "pron", terms: ["я"] }],
    you: [{ pos: "pron", terms: ["ты, вы", "тебя, вас", "тебе, вам"] }],
    go: [
      { pos: "verb", terms: ["идти", "ехать", "ходить", "ездить", "уходить", "становиться"] },
      { pos: "noun", terms: ["попытка", "очередь"] },
    ],
    would: [{ pos: "verb", terms: ["бы (условное наклонение)", "прошедшее от will: «собирался», «стал бы»"] }],
    could: [{ pos: "verb", terms: ["мог, могла, могли", "мог бы (вежливая просьба)"] }],
    should: [{ pos: "verb", terms: ["следует, стоит", "должен бы"] }],
    might: [{ pos: "verb", terms: ["может быть, возможно", "мог бы"] }],
    gonna: [{ pos: "verb", terms: ["собираться (= going to)", "будет, буду"] }],
    wanna: [{ pos: "verb", terms: ["хотеть (= want to)"] }],
    gotta: [{ pos: "verb", terms: ["должен, надо (= have got to)"] }],
  },
};

/** Candidate headwords for a word as it appears in subtitles, most likely first. */
function candidates(raw: string): string[] {
  const w = raw.toLowerCase().replace(/’/g, "'");
  const out = [w];
  if (ALIASES[w]) out.push(ALIASES[w]);
  // possessives and contractions: "John's", "they're", "we'll", "I've", "she'd", "don't"
  const base = w.replace(/'(s|re|ll|ve|d|m)$/, "").replace(/n't$/, "");
  if (base !== w) out.push(base);
  // naive suffix stripping for words the forms table doesn't know
  const rules: [RegExp, string][] = [
    [/ies$/, "y"],
    [/ied$/, "y"],
    [/(ss|sh|ch|x|z|o)es$/, "$1"],
    [/s$/, ""],
    [/([^aeiou])\1(ed|ing)$/, "$1"], // stopped -> stop, running -> run
    [/ed$/, "e"],
    [/ed$/, ""],
    [/ing$/, "e"],
    [/ing$/, ""],
    [/ier$/, "y"],
    [/iest$/, "y"],
    [/er$/, ""],
    [/est$/, ""],
    [/ily$/, "y"],
    [/ly$/, ""],
  ];
  for (const [re, rep] of rules) if (re.test(base)) out.push(base.replace(re, rep));
  return [...new Set(out)].filter((c) => c.length > 1 || c === "a" || c === "i");
}

const toEntries = (rows: DictionaryData["words"][string]) => rows.map(([pos, terms]) => ({ pos, terms }));

export function lookupWord(dict: DictionaryData, raw: string): { lemma: string; entries: DictionaryEntry[] } | null {
  const lower = raw.toLowerCase();
  if (ARTICLES[lower]) return { lemma: lower, entries: ARTICLES[lower] };

  for (const candidate of candidates(raw)) {
    const override = OVERRIDES[dict.lang]?.[candidate];
    if (override) return { lemma: candidate, entries: override };

    const own = dict.words[candidate];
    const lemma = dict.forms[candidate];
    // overrides apply to the lemma too: "going" → "go" → "идти", not Wiktionary's first sense
    const lemmaEntries = lemma
      ? (OVERRIDES[dict.lang]?.[lemma] ?? (dict.words[lemma] ? toEntries(dict.words[lemma]) : undefined))
      : undefined;

    // "left": show "leave" (the verb it's a form of) first, then its own meaning ("левый")
    if (lemma && lemmaEntries?.length) {
      return { lemma, entries: verbsFirstIfVerbForm(lower, [...lemmaEntries, ...(own ? toEntries(own) : [])]) };
    }
    if (own?.length) return { lemma: candidate, entries: verbsFirstIfVerbForm(lower, toEntries(own)) };
  }
  return null;
}

/** "figuring" is a verb form, so "соображать" should come before the noun "рисунок". */
function verbsFirstIfVerbForm(word: string, entries: DictionaryEntry[]): DictionaryEntry[] {
  if (!/(ing|ed)$/.test(word)) return entries;
  return [...entries.filter((e) => e.pos === "verb"), ...entries.filter((e) => e.pos !== "verb")];
}
