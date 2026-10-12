import { create } from "zustand";
import { persist } from "zustand/middleware";

type PlaybackModesState = {
  /** pause when each subtitle line ends */
  autoPause: boolean;
  /** replay the current line over and over */
  loop: boolean;
  toggleAutoPause: () => void;
  toggleLoop: () => void;
};

export const usePlaybackModesStore = create<PlaybackModesState>()(
  persist(
    (set) => ({
      autoPause: false,
      loop: false,
      toggleAutoPause: () => set((s) => ({ autoPause: !s.autoPause })),
      toggleLoop: () => set((s) => ({ loop: !s.loop })),
    }),
    // loop is per-moment, not a preference worth remembering
    { name: "playback-modes", skipHydration: true, partialize: (s) => ({ autoPause: s.autoPause }) },
  ),
);
