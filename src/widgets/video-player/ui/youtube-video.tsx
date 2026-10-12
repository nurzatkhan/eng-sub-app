"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useMediaStore } from "@/entities/media";
import { loadYoutubeIframeApi } from "@/shared/lib/youtube";

const EMBED_ERRORS: Record<number, string> = {
  2: "Неверная ссылка на видео",
  5: "Видео не воспроизводится во встроенном плеере",
  100: "Видео удалено или скрыто",
  101: "Автор запретил встраивать это видео — откройте его на YouTube",
  150: "Автор запретил встраивать это видео — откройте его на YouTube",
};

/** Hides YouTube's own captions — ours are shown under the video. The API has no documented switch for this. */
function hideNativeCaptions(player: YT.Player) {
  (player as YT.Player & { unloadModule?: (name: string) => void }).unloadModule?.("captions");
}

export function YoutubeVideo({ videoId, startAt }: { videoId: string; startAt: number }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const { attach, sync } = useMediaStore.getState();
    let player: YT.Player | null = null;
    let cancelled = false;

    loadYoutubeIframeApi()
      .then((YTApi) => {
        if (cancelled) return;
        // the API replaces this node with an <iframe>, so React must not own it
        const mount = document.createElement("div");
        host.replaceChildren(mount);

        player = new YTApi.Player(mount, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: { playsinline: 1, rel: 0, disablekb: 1, start: Math.floor(startAt), cc_load_policy: 0, iv_load_policy: 3 },
          events: {
            onReady: ({ target }) => {
              if (cancelled) return;
              attach({
                play: () => target.playVideo(),
                pause: () => target.pauseVideo(),
                seek: (t) => target.seekTo(t, true),
                getCurrentTime: () => target.getCurrentTime(),
                isPaused: () => target.getPlayerState() !== YTApi.PlayerState.PLAYING,
                setRate: (rate) => target.setPlaybackRate(rate),
              });
              sync({ duration: target.getDuration(), currentTime: target.getCurrentTime() });
              hideNativeCaptions(target);
            },
            onStateChange: ({ data, target }) => {
              // the captions module loads when playback starts
              if (data === YTApi.PlayerState.PLAYING) hideNativeCaptions(target);
              sync({ paused: data !== YTApi.PlayerState.PLAYING, currentTime: target.getCurrentTime() });
            },
            onError: ({ data }) => {
              toast.error(EMBED_ERRORS[data] ?? "Ошибка плеера YouTube");
            },
          },
        });
      })
      .catch((e: Error) => toast.error(e.message));

    // a click inside the iframe moves keyboard focus into it, and our hotkeys stop working;
    // the click itself has already been handled by the player, so give focus back to the page
    const onWindowBlur = () =>
      setTimeout(() => {
        const active = document.activeElement;
        if (active instanceof HTMLIFrameElement && host.contains(active)) {
          active.blur();
          window.focus();
        }
      }, 0);
    window.addEventListener("blur", onWindowBlur);

    return () => {
      cancelled = true;
      window.removeEventListener("blur", onWindowBlur);
      useMediaStore.getState().attach(null);
      player?.destroy();
      host.replaceChildren();
    };
  }, [videoId, startAt]);

  return <div ref={hostRef} className="size-full [&>iframe]:size-full" />;
}
