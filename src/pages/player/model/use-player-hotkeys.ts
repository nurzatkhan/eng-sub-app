"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useMediaStore } from "@/entities/media";
import { findCueIndex, findNextCueIndex, findPrevCueIndex, useSubtitleStore } from "@/entities/subtitle";
import { normalizeWord, useVocabularyStore } from "@/entities/word";
import { useLineTranslationStore } from "@/features/line-translation";
import { usePlaybackModesStore } from "@/features/playback-modes";
import { stepSpeed } from "@/features/playback-speed";
import { useHotkeys, type HotkeyHandlers } from "@/features/player-hotkeys";
import { YOUTUBE_LINK_INPUT_ID } from "@/features/open-youtube";
import { useWordLookupStore } from "@/features/word-lookup";
import { stepWord } from "../lib/word-navigation";

const SEEK_STEP_S = 5;

function notify(message: string) {
  toast(message, { id: "hotkey-feedback", duration: 1400 });
}

/** What each hotkey does on the player page (the keymap itself lives in features/player-hotkeys). */
export function usePlayerHotkeys() {
  const handlers = useMemo<HotkeyHandlers>(() => {
    const media = () => useMediaStore.getState();
    const cues = () => useSubtitleStore.getState().cues;
    const closeLookup = () => useWordLookupStore.getState().close();
    const now = () => media().controller?.getCurrentTime() ?? media().currentTime;
    const goToLine = (i: number) => {
      const cue = cues()[i];
      if (cue) media().seek(cue.start + 0.01);
    };

    return {
      "play-pause": () => {
        closeLookup();
        media().toggle();
      },
      "prev-line": () => {
        closeLookup();
        goToLine(findPrevCueIndex(cues(), now()));
      },
      "next-line": () => {
        closeLookup();
        goToLine(findNextCueIndex(cues(), now()));
      },
      "prev-word": () => stepWord(-1),
      "next-word": () => stepWord(1),
      "repeat-line": () => {
        closeLookup();
        const t = now();
        // between lines: repeat the one that just ended
        const i = findCueIndex(cues(), t);
        const target = i >= 0 ? i : cues().findLastIndex((c) => c.start <= t);
        if (target >= 0) media().seek(cues()[target].start + 0.01, true);
      },
      "seek-back": () => media().skip(-SEEK_STEP_S),
      "seek-forward": () => media().skip(SEEK_STEP_S),
      slower: () => stepSpeed(-1),
      faster: () => stepSpeed(1),
      "auto-pause": () => {
        usePlaybackModesStore.getState().toggleAutoPause();
        notify(usePlaybackModesStore.getState().autoPause ? "Пауза после каждой строки: вкл" : "Пауза после каждой строки: выкл");
      },
      "loop-line": () => {
        usePlaybackModesStore.getState().toggleLoop();
        notify(usePlaybackModesStore.getState().loop ? "Повтор строки: вкл" : "Повтор строки: выкл");
      },
      "toggle-translation": () => {
        useLineTranslationStore.getState().toggle();
        notify(useLineTranslationStore.getState().enabled ? "Перевод строки: показан" : "Перевод строки: скрыт");
      },
      "save-word": () => {
        const selection = useWordLookupStore.getState().selection;
        if (!selection) return notify("Сначала нажмите на слово");
        const vocabulary = useVocabularyStore.getState();
        const wasSaved = !!vocabulary.words[normalizeWord(selection.word)];
        // the open card fills in the translation (see features/save-word)
        vocabulary.toggle({ word: selection.word, translation: "", context: cues()[selection.cueIndex]?.text ?? "" });
        notify(wasSaved ? `«${selection.word}» удалено из словаря` : `«${selection.word}» добавлено в словарь`);
      },
      close: closeLookup,
      "focus-link": () => document.getElementById(YOUTUBE_LINK_INPUT_ID)?.focus(),
    };
  }, []);

  useHotkeys(handlers);
}
