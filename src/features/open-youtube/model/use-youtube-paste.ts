"use client";

import { useEffect } from "react";
import { openYoutube } from "./open-youtube";

/** Ctrl/Cmd+V with a YouTube link anywhere on the page (outside text fields) opens it. */
export function useYoutubePaste() {
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.("input, textarea, [contenteditable=true]")) return;
      const text = e.clipboardData?.getData("text") ?? "";
      if (openYoutube(text)) e.preventDefault();
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);
}
