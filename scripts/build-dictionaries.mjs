#!/usr/bin/env node
// Builds offline EN→{ru,kk,uk,uz,ky,tr} dictionaries from English Wiktionary (via kaikki.org wiktextract dump).
//
//   node scripts/build-dictionaries.mjs                      # streams the dump from kaikki.org (~520 MB)
//   node scripts/build-dictionaries.mjs ./english.jsonl.gz   # or uses a downloaded copy
//
// Output: public/dictionaries/<lang>.json
//   { v, lang, words: { [word]: [[pos, [translations…]], …] }, forms: { [inflected]: lemma } }
//   A form may also have its own entry ("left" → "leave", and "left" = left-hand side); the app shows both.
//
// Wiktionary content is CC BY-SA 4.0 — see public/dictionaries/LICENSE.md.

import { createReadStream, mkdirSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import path from "node:path";

const DUMP_URL = "https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz";
const LANGS = ["ru", "kk", "uk", "uz", "ky", "tr"];
const OUT_DIR = path.join(import.meta.dirname, "..", "public", "dictionaries");

const MAX_TERMS_PER_POS = 10;
const MAX_WORDS_IN_HEADWORD = 3;
const SKIP_POS = new Set(["symbol", "character", "punct", "suffix", "prefix", "infix", "interfix", "affix", "combining_form"]);
// "form of" senses carrying these tags are not useful for learners (e.g. dialectal "book" = past of "bake")
const BAD_FORM_TAGS = new Set([
  "alternative", "archaic", "obsolete", "dialectal", "nonstandard", "misspelling", "rare",
  "pronunciation-spelling", "eye-dialect", "abbreviation", "Northern-England", "Scotland", "slang",
]);
const GOOD_INFLECTION_TAGS = new Set([
  "plural", "past", "participle", "present", "third-person", "comparative", "superlative", "gerund",
]);

const CYRILLIC_LANGS = new Set(["ru", "uk", "kk", "ky"]);

const key = (w) => w.toLowerCase().replace(/’/g, "'");

/** Strips stress marks and rejects junk (example-sentence fragments, glosses in English). */
function cleanTerm(lang, raw) {
  const term = raw.normalize("NFD").replace(/[\u0300\u0301]/g, "").normalize("NFC").trim();
  if (!term || term === "-" || term.length > 40) return null;
  if (/[.!?;:]/.test(term) || term.split(/\s+/).length > 4) return null;
  if (CYRILLIC_LANGS.has(lang) && /[A-Za-z]/.test(term)) return null;
  return term;
}

/** @type {Record<string, Map<string, Map<string, string[]>>>} lang -> word -> pos -> terms */
const words = Object.fromEntries(LANGS.map((l) => [l, new Map()]));
/** inflected form -> lemma candidates, in priority order */
const forms = new Map();

function addForm(form, lemma) {
  const f = key(form);
  const l = key(lemma);
  if (f === l || f.includes(" ") || l.includes(" ")) return;
  const list = forms.get(f) ?? [];
  if (!list.includes(l)) list.push(l);
  forms.set(f, list);
}

function addTranslation(lang, word, pos, term) {
  const byWord = words[lang];
  let byPos = byWord.get(word);
  if (!byPos) byWord.set(word, (byPos = new Map()));
  let terms = byPos.get(pos);
  if (!terms) byPos.set(pos, (terms = []));
  if (terms.length < MAX_TERMS_PER_POS && !terms.includes(term)) terms.push(term);
}

function processEntry(e) {
  if (e.lang_code !== "en" || !e.word || SKIP_POS.has(e.pos)) return;
  if (e.word.split(" ").length > MAX_WORDS_IN_HEADWORD) return;
  const word = key(e.word);
  const pos = e.pos === "name" ? "proper noun" : e.pos;

  const translations = [...(e.translations ?? []), ...(e.senses ?? []).flatMap((s) => s.translations ?? [])];
  for (const t of translations) {
    const lang = t.code ?? t.lang_code;
    if (!words[lang] || !t.word) continue;
    const term = cleanTerm(lang, t.word);
    if (term) addTranslation(lang, word, pos, term);
  }

  for (const s of e.senses ?? []) {
    const tags = s.tags ?? [];
    if (!s.form_of || tags.some((t) => BAD_FORM_TAGS.has(t))) continue;
    for (const f of s.form_of) if (f.word) addForm(word, f.word);
  }
  for (const f of e.forms ?? []) {
    const tags = f.tags ?? [];
    if (!f.form || tags.some((t) => BAD_FORM_TAGS.has(t)) || !tags.some((t) => GOOD_INFLECTION_TAGS.has(t))) continue;
    addForm(f.form, word);
  }
}

async function openDump(source) {
  if (source) return createReadStream(source).pipe(createGunzip());
  console.log(`Downloading ${DUMP_URL} …`);
  const res = await fetch(DUMP_URL);
  if (!res.ok || !res.body) throw new Error(`Download failed: ${res.status}`);
  return Readable.fromWeb(res.body).pipe(createGunzip());
}

const input = await openDump(process.argv[2]);
let count = 0;
for await (const line of createInterface({ input, crlfDelay: Infinity })) {
  if (!line) continue;
  try {
    processEntry(JSON.parse(line));
  } catch {
    // skip malformed lines
  }
  if (++count % 200_000 === 0) console.log(`  ${count.toLocaleString()} entries…`);
}
console.log(`Processed ${count.toLocaleString()} entries`);

mkdirSync(OUT_DIR, { recursive: true });
for (const lang of LANGS) {
  const byWord = words[lang];
  const outWords = {};
  for (const [w, byPos] of byWord) outWords[w] = [...byPos].map(([pos, terms]) => [pos, terms]);

  // "is" is both a form of "be" and the plural of the letter "i": pick the lemma with the most translations
  const weight = (w) => [...(byWord.get(w)?.values() ?? [])].reduce((n, terms) => n + terms.length, 0);
  const outForms = {};
  for (const [form, lemmas] of forms) {
    const lemma = lemmas.filter((l) => byWord.has(l)).sort((a, b) => weight(b) - weight(a))[0];
    if (lemma) outForms[form] = lemma;
  }

  const file = path.join(OUT_DIR, `${lang}.json`);
  writeFileSync(file, JSON.stringify({ v: 1, lang, words: outWords, forms: outForms }));
  console.log(`${lang}: ${Object.keys(outWords).length} words, ${Object.keys(outForms).length} forms → ${file}`);
}
