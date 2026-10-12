"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SPEECH_SAMPLE_RATE, decodeAudio } from "@/shared/lib/audio";
import {
  DEFAULT_WHISPER_MODEL,
  transcribeAudio,
  type TranscriptionJob,
  type WhisperDevice,
  type WhisperModelId,
  type WhisperSegment,
} from "@/shared/lib/whisper";

export type TranscriptionStage = "idle" | "decoding" | "loading-model" | "transcribing" | "done" | "error";

type State = {
  stage: TranscriptionStage;
  loadProgress: number;
  progress: number;
  device: WhisperDevice | null;
  segments: WhisperSegment[];
  error: string | null;
  /** audio length, seconds */
  duration: number;
  startedAt: number | null;
  finishedAt: number | null;
};

const INITIAL: State = {
  stage: "idle",
  loadProgress: 0,
  progress: 0,
  device: null,
  segments: [],
  error: null,
  duration: 0,
  startedAt: null,
  finishedAt: null,
};

export function useFileTranscription() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [model, setModel] = useState<WhisperModelId>(DEFAULT_WHISPER_MODEL);
  const [state, setState] = useState<State>(INITIAL);
  const job = useRef<TranscriptionJob | null>(null);
  const urlRef = useRef<string | null>(null);

  const patch = (p: Partial<State>) => setState((s) => ({ ...s, ...p }));

  const selectFile = useCallback((next: File) => {
    job.current?.cancel();
    job.current = null;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = URL.createObjectURL(next);
    setFile(next);
    setPreviewUrl(urlRef.current);
    setState(INITIAL);
  }, []);

  // stop the worker and free the preview when leaving the page
  useEffect(
    () => () => {
      job.current?.cancel();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  const start = useCallback(async () => {
    if (!file) return;
    setState({ ...INITIAL, stage: "decoding", startedAt: Date.now() });
    try {
      const audio = await decodeAudio(file);
      patch({ stage: "loading-model", duration: audio.length / SPEECH_SAMPLE_RATE });

      const current = transcribeAudio(audio, model, {
        onLoadProgress: (loadProgress) => patch({ loadProgress }),
        onReady: (device) => patch({ stage: "transcribing", device }),
        onSegments: (segments, progress) =>
          setState((s) => ({ ...s, progress, segments: [...s.segments, ...segments] })),
      });
      job.current = current;
      await current.result;
      if (job.current === current) patch({ stage: "done", finishedAt: Date.now() });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      patch({ stage: "error", error: e instanceof Error ? e.message : String(e) });
    } finally {
      job.current = null;
    }
  }, [file, model]);

  const cancel = useCallback(() => {
    job.current?.cancel();
    job.current = null;
    setState((s) => ({ ...s, stage: s.segments.length ? "done" : "idle", finishedAt: Date.now() }));
  }, []);

  return { file, previewUrl, model, setModel, selectFile, start, cancel, ...state };
}
