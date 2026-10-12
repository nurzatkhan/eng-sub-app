// Speech recognition worker (Whisper via transformers.js). Runs fully in the browser.
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2";

env.allowLocalModels = false;

const MODEL = "Xenova/whisper-base.en";
let asr = null;

function load(device) {
  return pipeline("automatic-speech-recognition", MODEL, {
    device,
    dtype: device === "webgpu" ? { encoder_model: "fp32", decoder_model_merged: "q4" } : "q8",
    progress_callback: (p) => {
      if (p.status === "progress" && p.total) {
        self.postMessage({ type: "load", file: p.file, loaded: p.loaded, total: p.total });
      }
    },
  });
}

self.onmessage = async ({ data }) => {
  try {
    if (!asr) {
      try {
        asr = await load(data.webgpu ? "webgpu" : "wasm");
      } catch (e) {
        if (!data.webgpu) throw e;
        asr = await load("wasm");
      }
    }
    self.postMessage({ type: "transcribing" });
    const out = await asr(data.audio, { chunk_length_s: 30, stride_length_s: 5, return_timestamps: true });
    self.postMessage({ type: "done", chunks: out.chunks ?? [] });
  } catch (e) {
    self.postMessage({ type: "error", message: String(e?.message ?? e) });
  }
};
