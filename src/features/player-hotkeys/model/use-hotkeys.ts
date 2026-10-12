"use client";

import { useEffect, useRef } from "react";
import { matchHotkey, type HotkeyId } from "../config/hotkeys";
import { useHotkeysHelpStore } from "./help-store";

export type HotkeyHandlers = Partial<Record<HotkeyId, () => void>>;

const TYPING_TARGETS =
  "input, textarea, select, [contenteditable=true], [role=listbox], [role=combobox], [role=alertdialog]";

/**
 * Global keyboard shortcuts. The keymap lives in config/hotkeys.ts; the page supplies what each one does.
 * `help` is handled here: it opens the cheat sheet.
 */
export function useHotkeys(handlers: HotkeyHandlers) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat && e.code !== "ArrowLeft" && e.code !== "ArrowRight") return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.(TYPING_TARGETS)) return;

      const id = matchHotkey(e);
      if (!id) return;
      // inside a dialog (the cheat sheet), only let it close itself
      if (target?.closest?.("[role=dialog]:not([data-slot=popover-content])") && id !== "help") return;

      if (id === "help") {
        e.preventDefault();
        useHotkeysHelpStore.getState().toggle();
        return;
      }
      const handler = handlersRef.current[id];
      if (!handler) return;
      e.preventDefault();
      handler();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
