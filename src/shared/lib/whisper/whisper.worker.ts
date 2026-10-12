/// <reference lib="webworker" />
// Speech recognition with Whisper (transformers.js), off the main thread.

import { env, pipeline, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";
import type { WhisperDevice, WhisperSegment, WorkerRequest, WorkerResponse } from "./protocol";

env.allowLocalModels = false;

const SAMPLE_RATE = 16_000;
/** Whisper's window is 30 s; cut a bit earlier, at the quietest moment, so words aren't split */
const TARGET_CHUNK_S = 28;
const SEARCH_FROM_S = 22;
const FRAME_S = 0.1;
/** chunks quieter than this are skipped: Whisper "hears" phrases like "Thank you." in silence */
const SILENCE_RMS = 0.004;

const post = (msg: WorkerResponse) => self.postMessage(msg);

let loaded: { key: string; pipe: AutomaticSpeechRecognitionPipeline; device: WhisperDevice } | null = null;

async function load(model: string, webgpu: boolean) {
  const device: WhisperDevice = webgpu ? "webgpu" : "wasm";
  const key = `${model}|${device}`;
  if (loaded?.key === key) return loaded;
  await loaded?.pipe.dispose();
  loaded = null;

  const pipe = (await pipeline("automatic-speech-recognition", model, {
    device,
    dtype: device === "webgpu" ? { encoder_model: "fp32", decoder_model_merged: "q4" } : "q8",
    progress_callback: (p) => {
      if (p.status === "progress_total") post({ type: "load", progress: p.progress });
    },
  })) as AutomaticSpeechRecognitionPipeline;
  loaded = { key, pipe, device };
  return loaded;
}

function rms(samples: Float32Array, from: number, to: number) {
  let sum = 0;
  for (let i = from; i < to; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / Math.max(1, to - from));
}

/** Splits audio into ≤30 s pieces, cutting at the quietest 0.1 s frame between 22 and 28 s. */
function splitAtPauses(audio: Float32Array): { offset: number; samples: Float32Array }[] {
  const out: { offset: number; samples: Float32Array }[] = [];
  const frame = Math.round(FRAME_S * SAMPLE_RATE);
  let start = 0;
  while (start < audio.length) {
    let end = Math.min(audio.length, start + TARGET_CHUNK_S * SAMPLE_RATE);
    if (end < audio.length) {
      let best = end;
      let bestRms = Infinity;
      for (let f = start + SEARCH_FROM_S * SAMPLE_RATE; f + frame <= end; f += frame) {
        const r = rms(audio, f, f + frame);
        if (r < bestRms) {
          bestRms = r;
          best = f + Math.floor(frame / 2);
        }
      }
      end = best;
    }
    out.push({ offset: start / SAMPLE_RATE, samples: audio.subarray(start, end) });
    start = end;
  }
  return out;
}

self.onmessage = async ({ data }: MessageEvent<WorkerRequest>) => {
  if (data.type !== "transcribe") return;
  try {
    let model;
    try {
      model = await load(data.model, data.webgpu);
    } catch (e) {
      if (!data.webgpu) throw e;
      model = await load(data.model, false);
    }
    post({ type: "ready", device: model.device });

    const pieces = splitAtPauses(data.audio);
    for (let k = 0; k < pieces.length; k++) {
      const { offset, samples } = pieces[k];
      const duration = samples.length / SAMPLE_RATE;
      let segments: WhisperSegment[] = [];
      if (rms(samples, 0, samples.length) >= SILENCE_RMS) {
        const out = await model.pipe(samples, { return_timestamps: true });
        segments = (out.chunks ?? [])
          .map((c) => {
            const [from, to] = c.timestamp;
            return {
              start: offset + Math.min(from ?? 0, duration),
              end: offset + Math.min(to ?? duration, duration),
              text: c.text.trim(),
            };
          })
          .filter((s) => s.text);
      }
      post({ type: "segments", segments, progress: ((k + 1) / pieces.length) * 100 });
    }
    post({ type: "done" });
  } catch (e) {
    post({ type: "error", message: e instanceof Error ? e.message : String(e) });
  }
};
