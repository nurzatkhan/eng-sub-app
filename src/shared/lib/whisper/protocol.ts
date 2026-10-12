export type WhisperSegment = {
  /** seconds */
  start: number;
  /** seconds */
  end: number;
  text: string;
};

export type WhisperDevice = "webgpu" | "wasm";

export type WorkerRequest = {
  type: "transcribe";
  audio: Float32Array;
  model: string;
  webgpu: boolean;
};

export type WorkerResponse =
  | { type: "load"; progress: number }
  | { type: "ready"; device: WhisperDevice }
  | { type: "segments"; segments: WhisperSegment[]; progress: number }
  | { type: "done" }
  | { type: "error"; message: string };
