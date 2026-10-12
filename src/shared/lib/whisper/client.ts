import type { WhisperDevice, WhisperSegment, WorkerRequest, WorkerResponse } from "./protocol";

export type { WhisperDevice, WhisperSegment };

export const WHISPER_MODELS = [
  { id: "onnx-community/whisper-tiny.en", label: "Быстрая", size: "≈ 40 МБ", note: "для проверки и чёткой речи" },
  { id: "onnx-community/whisper-base.en", label: "Обычная", size: "≈ 80 МБ", note: "хороший баланс" },
  { id: "onnx-community/whisper-small.en", label: "Точная", size: "≈ 250 МБ", note: "медленнее, меньше ошибок" },
] as const;

export type WhisperModelId = (typeof WHISPER_MODELS)[number]["id"];

export const DEFAULT_WHISPER_MODEL: WhisperModelId = "onnx-community/whisper-base.en";

type Callbacks = {
  /** model download, 0–100 */
  onLoadProgress?: (percent: number) => void;
  onReady?: (device: WhisperDevice) => void;
  /** new segments as they're recognized, and overall progress 0–100 */
  onSegments?: (segments: WhisperSegment[], percent: number) => void;
};

export type TranscriptionJob = {
  result: Promise<WhisperSegment[]>;
  cancel: () => void;
};

// kept between runs so the loaded model is reused
let worker: Worker | null = null;
let busy = false;

function getWorker() {
  worker ??= new Worker(new URL("./whisper.worker.ts", import.meta.url), { type: "module" });
  return worker;
}

function resetWorker() {
  worker?.terminate();
  worker = null;
  busy = false;
}

async function hasWebGpu(): Promise<boolean> {
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    return !!(await gpu?.requestAdapter());
  } catch {
    return false;
  }
}

/** Transcribes 16 kHz mono English audio with Whisper, in a web worker. */
export function transcribeAudio(audio: Float32Array, model: WhisperModelId, callbacks: Callbacks = {}): TranscriptionJob {
  if (busy) throw new Error("Распознавание уже идёт");
  busy = true;
  let reject: (e: Error) => void = () => {};

  const result = new Promise<WhisperSegment[]>((resolve, rej) => {
    reject = rej;
    const all: WhisperSegment[] = [];
    void hasWebGpu().then((webgpu) => {
      const w = getWorker();
      w.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
        switch (data.type) {
          case "load":
            callbacks.onLoadProgress?.(data.progress);
            break;
          case "ready":
            callbacks.onReady?.(data.device);
            break;
          case "segments":
            all.push(...data.segments);
            callbacks.onSegments?.(data.segments, data.progress);
            break;
          case "done":
            busy = false;
            resolve(all);
            break;
          case "error":
            resetWorker();
            rej(new Error(data.message));
            break;
        }
      };
      w.onerror = (e) => {
        resetWorker();
        rej(new Error(e.message || "Ошибка распознавания"));
      };
      const request: WorkerRequest = { type: "transcribe", audio, model, webgpu };
      w.postMessage(request, [audio.buffer]);
    });
  });

  return {
    result,
    cancel: () => {
      resetWorker();
      reject(new DOMException("Отменено", "AbortError"));
    },
  };
}
