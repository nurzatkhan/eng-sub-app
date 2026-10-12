"use client";

import { useCallback } from "react";
import { useMediaStore } from "@/entities/media";

export function FileVideo({ url }: { url: string }) {
  const attach = useMediaStore((s) => s.attach);
  const sync = useMediaStore((s) => s.sync);

  const ref = useCallback(
    (el: HTMLVideoElement | null) => {
      if (!el) return;
      attach({
        play: () => void el.play(),
        pause: () => el.pause(),
        seek: (t) => {
          el.currentTime = t;
        },
        getCurrentTime: () => el.currentTime,
        isPaused: () => el.paused,
        setRate: (rate) => {
          el.playbackRate = rate;
        },
      });
      // also runs when Next.js hides this page with <Activity> on navigation: the <video> stays
      // in the DOM (display: none) and would keep playing sound
      return () => {
        el.pause();
        attach(null);
      };
    },
    [attach],
  );

  return (
    <video
      ref={ref}
      src={url}
      controls
      playsInline
      className="size-full object-contain"
      onTimeUpdate={(e) => sync({ currentTime: e.currentTarget.currentTime })}
      onSeeked={(e) => sync({ currentTime: e.currentTarget.currentTime })}
      onLoadedMetadata={(e) => sync({ duration: e.currentTarget.duration })}
      onPlay={() => sync({ paused: false })}
      onPause={() => sync({ paused: true })}
    />
  );
}
