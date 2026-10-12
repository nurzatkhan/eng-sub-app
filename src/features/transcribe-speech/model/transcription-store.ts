import { create } from "zustand";
import { toast } from "sonner";
import { useMediaStore } from "@/entities/media";
import { normalizeCues, useSubtitleStore } from "@/entities/subtitle";
import { SPEECH_SAMPLE_RATE, decodeAudio } from "@/shared/lib/audio";
import { formatClock } from "@/shared/lib/format-time";
import { DEFAULT_WHISPER_MODEL, transcribeAudio } from "@/shared/lib/whisper";

export type TranscriptionStatus = "idle" | "decoding" | "loading-model" | "transcribing";

type TranscriptionState = {
  status: TranscriptionStatus;
  modelProgress: number;
  /** recognition progress, 0–100 */
  progress: number;
  startedAt: number | null;
  /** audio length in seconds */
  duration: number;
  start: () => Promise<void>;
};

export const useTranscriptionStore = create<TranscriptionState>()((set, get) => ({
  status: "idle",
  modelProgress: 0,
  progress: 0,
  startedAt: null,
  duration: 0,

  start: async () => {
    const { source } = useMediaStore.getState();
    const file = source?.kind === "file" ? source.file : null;
    if (!file || get().status !== "idle") return;

    const startedAt = Date.now();
    set({ status: "decoding", startedAt, modelProgress: 0, progress: 0, duration: 0 });
    try {
      const audio = await decodeAudio(file);
      set({ status: "loading-model", duration: audio.length / SPEECH_SAMPLE_RATE });

      const segments = await transcribeAudio(audio, DEFAULT_WHISPER_MODEL, {
        onLoadProgress: (modelProgress) => set({ modelProgress }),
        onReady: () => set({ status: "transcribing" }),
        onSegments: (_, progress) => set({ progress }),
      }).result;

      const cues = normalizeCues(segments);
      useSubtitleStore.getState().setCues(cues, "Whisper");
      toast.success(`Готово: ${cues.length} строк за ${formatClock((Date.now() - startedAt) / 1000)}`, {
        description: "Скачайте .srt, чтобы не распознавать это видео заново.",
      });
    } catch (e) {
      console.error(e);
      toast.error("Ошибка распознавания", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ status: "idle", startedAt: null });
    }
  },
}));
