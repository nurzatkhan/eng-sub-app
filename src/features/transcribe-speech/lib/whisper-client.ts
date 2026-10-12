import { normalizeCues, type Cue } from "@/entities/subtitle";

// Plain JS module worker served from /public: it imports transformers.js from a CDN,
// which keeps the ONNX runtime out of the Next.js bundle.
const WORKER_URL = "/workers/whisper.worker.js";

type WorkerMessage =
  | { type: "load"; file: string; loaded: number; total: number }
  | { type: "transcribing" }
  | { type: "done"; chunks: Array<{ text: string; timestamp: [number | null, number | null] }> }
  | { type: "error"; message: string };

type Callbacks = {
  onModelProgress: (percent: number) => void;
  onTranscribing: () => void;
};

let worker: Worker | null = null;

export function transcribeWithWhisper(audio: Float32Array, { onModelProgress, onTranscribing }: Callbacks) {
  worker ??= new Worker(WORKER_URL, { type: "module" });
  const files = new Map<string, [loaded: number, total: number]>();

  return new Promise<Cue[]>((resolve, reject) => {
    const fail = (message: string) => {
      worker?.terminate();
      worker = null;
      reject(new Error(message));
    };

    worker!.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
      switch (data.type) {
        case "load": {
          files.set(data.file, [data.loaded, data.total]);
          let loaded = 0;
          let total = 0;
          for (const [l, t] of files.values()) {
            loaded += l;
            total += t;
          }
          onModelProgress(total ? (loaded / total) * 100 : 0);
          break;
        }
        case "transcribing":
          onTranscribing();
          break;
        case "done":
          resolve(
            normalizeCues(
              data.chunks.map((c) => {
                const start = c.timestamp[0] ?? 0;
                return { start, end: c.timestamp[1] ?? start + 4, text: c.text };
              }),
            ),
          );
          break;
        case "error":
          fail(data.message);
          break;
      }
    };
    worker!.onerror = (e) => fail(e.message || "Ошибка воркера распознавания");
    worker!.postMessage({ audio, webgpu: "gpu" in navigator }, [audio.buffer]);
  });
}
