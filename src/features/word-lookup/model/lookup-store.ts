import { create } from "zustand";
import { useMediaStore } from "@/entities/media";

/** Where the clicked word is rendered: the subtitle list or the line under the video. */
export type LookupOrigin = "list" | "line";

export type WordSelection = {
  word: string;
  cueIndex: number;
  tokenIndex: number;
  origin: LookupOrigin;
  anchor: HTMLElement;
};

type LookupState = {
  selection: WordSelection | null;
  open: (selection: WordSelection) => void;
  close: () => void;
};

export const useWordLookupStore = create<LookupState>()((set) => ({
  selection: null,
  open: (selection) => {
    useMediaStore.getState().pause();
    set({ selection });
  },
  close: () => set({ selection: null }),
}));
