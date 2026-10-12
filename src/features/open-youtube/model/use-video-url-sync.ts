"use client";

import { useEffect } from "react";
import { useMediaStore } from "@/entities/media";
import { openYoutube } from "./open-youtube";

/**
 * `/?v=<id>` opens that YouTube video (links from the library), and the address bar follows
 * whatever is playing, so the page can be reloaded or shared.
 */
export function useVideoUrlSync() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("v");
    const current = useMediaStore.getState().source;
    if (id && !(current?.kind === "youtube" && current.videoId === id)) {
      const t = params.get("t");
      openYoutube(`https://www.youtube.com/watch?v=${id}${t ? `&t=${t}` : ""}`);
    } else if (!id && current?.kind === "youtube") {
      // came back to the player from another page: the video is still loaded
      window.history.replaceState(null, "", `/?v=${current.videoId}`);
    }

    return useMediaStore.subscribe((state, prev) => {
      if (state.source === prev.source) return;
      const url = state.source?.kind === "youtube" ? `/?v=${state.source.videoId}` : "/";
      if (window.location.pathname + window.location.search !== url) window.history.replaceState(null, "", url);
    });
  }, []);
}
