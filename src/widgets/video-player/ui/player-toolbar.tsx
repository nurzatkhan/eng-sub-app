"use client";

import { LineTranslationToggle } from "@/features/line-translation";
import { PlaybackModeToggles } from "@/features/playback-modes";
import { SpeedSelect } from "@/features/playback-speed";

/** Learning controls between the video and the current line. */
export function PlayerToolbar() {
  return (
    <div className="flex items-center gap-1">
      <SpeedSelect />
      <div className="ml-auto flex items-center gap-1">
        <PlaybackModeToggles />
        <LineTranslationToggle />
      </div>
    </div>
  );
}
