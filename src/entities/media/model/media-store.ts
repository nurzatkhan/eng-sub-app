import { create } from "zustand";
import type { MediaSource, PlayerController } from "./types";

type MediaState = {
  source: MediaSource | null;
  /** title for YouTube videos, file name for local ones */
  title: string | null;
  controller: PlayerController | null;
  currentTime: number;
  duration: number;
  paused: boolean;
  /** playback speed; kept when switching videos */
  rate: number;
};

type MediaActions = {
  loadFile: (file: File) => void;
  loadYoutube: (videoId: string, startAt?: number) => void;
  setTitle: (title: string) => void;
  attach: (controller: PlayerController | null) => void;
  sync: (patch: Partial<Pick<MediaState, "currentTime" | "duration" | "paused">>) => void;
  seek: (time: number, autoplay?: boolean) => void;
  /** seek relative to the current position */
  skip: (seconds: number) => void;
  setRate: (rate: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
};

const resetPlayback = { controller: null, currentTime: 0, duration: 0, paused: true };

function revokeFileUrl(source: MediaSource | null) {
  if (source?.kind === "file") URL.revokeObjectURL(source.url);
}

export const useMediaStore = create<MediaState & MediaActions>()((set, get) => ({
  source: null,
  title: null,
  rate: 1,
  ...resetPlayback,

  loadFile: (file) => {
    revokeFileUrl(get().source);
    set({ ...resetPlayback, source: { kind: "file", file, url: URL.createObjectURL(file) }, title: file.name });
  },
  loadYoutube: (videoId, startAt = 0) => {
    revokeFileUrl(get().source);
    set({ ...resetPlayback, source: { kind: "youtube", videoId, startAt }, title: null });
  },
  setTitle: (title) => set({ title }),
  attach: (controller) => {
    if (controller && get().rate !== 1) controller.setRate(get().rate);
    set({ controller });
  },
  sync: (patch) => set(patch),
  seek: (time, autoplay = false) => {
    const { controller } = get();
    if (!controller) return;
    controller.seek(Math.max(0, time));
    set({ currentTime: Math.max(0, time) });
    if (autoplay) controller.play();
  },
  skip: (seconds) => {
    const { controller, duration, seek } = get();
    if (!controller) return;
    const target = controller.getCurrentTime() + seconds;
    seek(duration ? Math.min(target, duration - 0.1) : target);
  },
  setRate: (rate) => {
    get().controller?.setRate(rate);
    set({ rate });
  },
  play: () => get().controller?.play(),
  pause: () => get().controller?.pause(),
  toggle: () => {
    const { controller } = get();
    if (!controller) return;
    if (controller.isPaused()) controller.play();
    else controller.pause();
  },
}));
