"use client";

import { useEffect } from "react";
import { useMediaStore } from "@/entities/media";
import { findCueIndex, useSubtitleStore } from "@/entities/subtitle";
import { usePlaybackModesStore } from "./modes-store";

/** a jump bigger than this between two time updates is a seek, not playback */
const MAX_PLAYBACK_STEP_S = 1;
/** stop this far before the line's end so it stays on screen while paused */
const PAUSE_BEFORE_END_S = 0.05;

/** Enforces auto-pause / loop by watching playback cross the end of the current line. */
export function usePlaybackModes() {
  useEffect(() => {
    // after auto-pausing at the end of a line, the next play must not pause on that same line again
    let pausedAtCue = -1;

    return useMediaStore.subscribe((state, prev) => {
      if (state.paused || state.currentTime === prev.currentTime) return;
      const { autoPause, loop } = usePlaybackModesStore.getState();
      if (!autoPause && !loop) return;

      const { cues } = useSubtitleStore.getState();
      const i = findCueIndex(cues, prev.currentTime);
      if (i < 0) return;
      const cue = cues[i];
      const step = state.currentTime - prev.currentTime;
      const crossedEnd = prev.currentTime < cue.end - PAUSE_BEFORE_END_S && state.currentTime >= cue.end - PAUSE_BEFORE_END_S;
      if (!crossedEnd || step <= 0 || step > MAX_PLAYBACK_STEP_S) {
        if (i !== pausedAtCue) pausedAtCue = -1;
        return;
      }

      if (loop) {
        state.seek(cue.start);
      } else if (pausedAtCue !== i) {
        pausedAtCue = i;
        state.pause();
        state.seek(cue.end - PAUSE_BEFORE_END_S);
      }
    });
  }, []);
}
