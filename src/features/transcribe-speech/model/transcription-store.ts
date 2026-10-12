import { create } from "zustand";
import { toast } from "sonner";
import { useMediaStore } from "@/entities/media";
import { useSubtitleStore } from "@/entities/subtitle";
import { formatClock } from "@/shared/lib/format-time";
import { WHISPER_SAMPLE_RATE, decodeAudio } from "../lib/decode-audio";
import { transcribeWithWhisper } from "../lib/whisper-client";

export type TranscriptionStatus = "idle" | "decoding" | "loading-model" | "transcribing";

type TranscriptionState = {
  status: TranscriptionStatus;
  modelProgress: number;
  startedAt: number | null;
  /** audio length in seconds */
  duration: number;
  start: () => Promise<void>;
};

export const useTranscriptionStore = create<TranscriptionState>()((set, get) => ({
  status: "idle",
  modelProgress: 0,
  startedAt: null,
  duration: 0,

  start: async () => {
    const { source } = useMediaStore.getState();
    const file = source?.kind === "file" ? source.file : null;
    if (!file || get().status !== "idle") return;

    const startedAt = Date.now();
    set({ status: "decoding", startedAt, modelProgress: 0, duration: 0 });
    try {
      const audio = await decodeAudio(file);
      set({ status: "loading-model", duration: audio.length / WHISPER_SAMPLE_RATE });

      const cues = await transcribeWithWhisper(audio, {
        onModelProgress: (modelProgress) => set({ modelProgress }),
        onTranscribing: () => set({ status: "transcribing" }),
      });

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
