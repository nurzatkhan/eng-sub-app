import { create } from "zustand";
import { persist } from "zustand/middleware";

type LineTranslationState = {
  /** show the translation of the current line under the video */
  enabled: boolean;
  toggle: () => void;
};

export const useLineTranslationStore = create<LineTranslationState>()(
  persist(
    (set) => ({
      enabled: true,
      toggle: () => set((s) => ({ enabled: !s.enabled })),
    }),
    // rehydrated on the client by StoreHydration to avoid SSR mismatches
    { name: "line-translation", skipHydration: true },
  ),
);
