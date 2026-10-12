// Local EN→X machine translation with Opus-MT models in a web worker (public/workers/opus-mt.worker.js).
// No rate limits; the model (~110 MB) is downloaded once and cached by the browser.

import { useSyncExternalStore } from "react";

export const LOCAL_MT_LANGUAGES = new Set(["ru", "uk"]);

export type LocalMtStatus =
  | { state: "idle" }
  | { state: "loading"; lang: string; progress: number }
  | { state: "ready"; lang: string };

type WorkerMessage =
  | { type: "load"; lang: string; file: string; loaded: number; total: number }
  | { type: "ready"; lang: string }
  | { type: "result"; id: number; text: string }
  | { type: "error"; id: number; message: string };

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, { resolve: (text: string) => void; reject: (e: Error) => void }>();
const downloads = new Map<string, [loaded: number, total: number]>();

let status: LocalMtStatus = { state: "idle" };
const listeners = new Set<() => void>();
function setStatus(next: LocalMtStatus) {
  status = next;
  listeners.forEach((l) => l());
}

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker("/workers/opus-mt.worker.js", { type: "module" });
  worker.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
    switch (data.type) {
      case "load": {
        downloads.set(data.file, [data.loaded, data.total]);
        let loaded = 0;
        let total = 0;
        for (const [l, t] of downloads.values()) {
          loaded += l;
          total += t;
        }
        setStatus({ state: "loading", lang: data.lang, progress: total ? (loaded / total) * 100 : 0 });
        break;
      }
      case "ready":
        if (status.state !== "ready" || status.lang !== data.lang) setStatus({ state: "ready", lang: data.lang });
        break;
      case "result":
        pending.get(data.id)?.resolve(data.text);
        pending.delete(data.id);
        break;
      case "error":
        pending.get(data.id)?.reject(new Error(data.message));
        pending.delete(data.id);
        break;
    }
  };
  worker.onerror = (e) => {
    for (const p of pending.values()) p.reject(new Error(e.message || "Local translator crashed"));
    pending.clear();
    worker?.terminate();
    worker = null;
    setStatus({ state: "idle" });
  };
  return worker;
}

export function translateLocally(text: string, lang: string): Promise<string> {
  if (!LOCAL_MT_LANGUAGES.has(lang)) return Promise.reject(new Error(`No local model for ${lang}`));
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, text, lang });
  });
}

export function useLocalMtStatus(): LocalMtStatus {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => status,
    () => status,
  );
}
