// Local machine translation (Opus-MT / MarianMT via transformers.js). Runs fully in the browser.
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2";

env.allowLocalModels = false;

const pipes = new Map();
// one translation at a time: the model isn't re-entrant
let queue = Promise.resolve();

function getPipe(lang) {
  if (!pipes.has(lang)) {
    const pending = pipeline("translation", `Xenova/opus-mt-en-${lang}`, {
      dtype: "q8",
      progress_callback: (p) => {
        if (p.status === "progress" && p.total) {
          self.postMessage({ type: "load", lang, file: p.file, loaded: p.loaded, total: p.total });
        }
      },
    });
    pending.catch(() => pipes.delete(lang));
    pipes.set(lang, pending);
  }
  return pipes.get(lang);
}

self.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    try {
      const translate = await getPipe(data.lang);
      self.postMessage({ type: "ready", lang: data.lang });
      const [out] = await translate(data.text);
      self.postMessage({ type: "result", id: data.id, text: out.translation_text });
    } catch (e) {
      self.postMessage({ type: "error", id: data.id, message: String(e?.message ?? e) });
    }
  });
};
