#!/usr/bin/env node
// Builds the video library (src/entities/video/config/catalog.json): finds YouTube videos for each CEFR level
// from learner-oriented channels and keeps only those that are embeddable and have human-made English captions.
//
//   node scripts/build-catalog.mjs
//
// Uses YouTube's undocumented innertube API (same as app/api/youtube/captions).
import { writeFileSync } from "node:fs";
import path from "node:path";

const OUT = path.join(import.meta.dirname, "..", "src", "entities", "video", "config", "catalog.json");

async function search(query) {
  const res = await fetch("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context: { client: { clientName: "WEB", clientVersion: "2.20250101.00.00", hl: "en" } }, query, params: "EgIQAQ%3D%3D" }),
  });
  const data = await res.json();
  const out = [];
  (function walk(o) {
    if (!o || typeof o !== "object") return;
    if (o.videoRenderer) {
      const v = o.videoRenderer;
      out.push({ id: v.videoId, title: v.title?.runs?.map((r) => r.text).join("") ?? "", channel: v.ownerText?.runs?.[0]?.text ?? "" });
    }
    for (const k in o) walk(o[k]);
  })(data);
  return out;
}

async function inspect(id) {
  const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)" },
    body: JSON.stringify({ context: { client: { clientName: "ANDROID", clientVersion: "20.10.38", androidSdkVersion: 34, hl: "en" } }, videoId: id }),
  });
  const p = await res.json();
  const tracks = p.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  const en = tracks.filter((t) => t.languageCode === "en" || t.languageCode.startsWith("en-"));
  return {
    ok: p.playabilityStatus?.status === "OK",
    embed: p.playabilityStatus?.playableInEmbed !== false,
    captions: en.some((t) => t.kind !== "asr") ? "manual" : en.length ? "auto" : null,
    seconds: Number(p.videoDetails?.lengthSeconds ?? 0),
    title: p.videoDetails?.title,
    channel: p.videoDetails?.author,
  };
}

const LEVELS = [
  { level: "A1", queries: ["English Singsing easy dialogue role play", "English Singsing basic English conversation", "English Singsing dialogue"], re: /Dialogue|Conversation|Role Play/i, count: 5, channel: "English Singsing", min: 90, max: 600 },
  { level: "A2", queries: ["Real Easy English BBC Learning English", "BBC Real Easy English", "Real Easy English listening", "Real Easy English talking about", "Real Easy English conversation", "Real Easy English improve your listening", "Real Easy English practise listening"], re: /Real Easy English/i, count: 30, channel: "BBC Learning English", min: 180, max: 600, fallback: { queries: ["Bob the Canadian learn English slowly", "Bob the Canadian English lesson daily life"], channel: "Learn English with Bob the Canadian", re: /./ , min: 300, max: 900 } },
  { level: "B1", queries: ["BBC Learning English 6 Minute English", "6 Minute English BBC everyday", "6 Minute English BBC technology"], re: /6 Minute English/i, count: 5, channel: "BBC Learning English", min: 300, max: 600 },
  { level: "B2", queries: ["TED-Ed lesson history", "TED-Ed lesson science", "TED-Ed lesson psychology"], re: /./, count: 5, channel: "TED-Ed", min: 200, max: 480 },
  { level: "C1", queries: ["TED talk psychology", "TED talk habits", "TED talk education"], re: /./, count: 5, channel: "TED", min: 480, max: 1100 },
  { level: "C2", queries: ["Veritasium science", "Veritasium physics", "Veritasium math"], re: /./, count: 5, channel: "Veritasium", min: 600, max: 1500 },
];

const catalog = [];
const seen = new Set();
for (const L of LEVELS) {
  const picked = [];
  const tryAdd = async (cand, lim = L) => {
    if (seen.has(cand.id) || picked.length >= L.count) return false;
    const info = await inspect(cand.id);
    if (!info.ok || !info.embed || info.captions !== "manual") { console.log(`  skip ${L.level} ${cand.id} ${cand.title} ok=${info.ok} embed=${info.embed} cc=${info.captions}`); return false; }
    if ((lim.min && info.seconds < lim.min) || (lim.max && info.seconds > lim.max)) return false;
    seen.add(cand.id);
    picked.push({ id: cand.id, level: L.level, title: info.title, channel: info.channel, seconds: info.seconds });
    return true;
  };
  for (const q of L.queries) {
    for (const c of (await search(q)).filter((c) => c.channel === L.channel && L.re.test(c.title))) await tryAdd(c);
  }
  // not enough videos in the main series: top up from a similar-level channel
  if (picked.length < L.count && L.fallback) {
    const F = L.fallback;
    for (const q of F.queries)
      for (const c of (await search(q)).filter((c) => c.channel === F.channel && F.re.test(c.title))) await tryAdd(c, F);
  }
  console.log(`${L.level}: ${picked.length}/${L.count}`);
  catalog.push(...picked);
}
writeFileSync(OUT, JSON.stringify(catalog, null, 2) + "\n");
console.log(`${catalog.length} videos → ${OUT}`);
