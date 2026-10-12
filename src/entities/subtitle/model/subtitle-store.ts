import { create } from "zustand";
import type { Cue } from "./types";

type SubtitleState = {
  cues: Cue[];
  /** file name or "Whisper" — where the current cues came from */
  source: string | null;
  setCues: (cues: Cue[], source: string) => void;
  clear: () => void;
};

export const useSubtitleStore = create<SubtitleState>()((set) => ({
  cues: [],
  source: null,
  setCues: (cues, source) => set({ cues, source }),
  clear: () => set({ cues: [], source: null }),
}));
