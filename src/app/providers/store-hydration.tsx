"use client";

import { useEffect } from "react";
import { useLanguageStore } from "@/entities/translation";
import { useVocabularyStore } from "@/entities/word";
import { useLineTranslationStore } from "@/features/line-translation";
import { usePlaybackModesStore } from "@/features/playback-modes";

/** Persisted stores use `skipHydration`, so the server and first client render match. */
export function StoreHydration() {
  useEffect(() => {
    void useVocabularyStore.persist.rehydrate();
    void useLanguageStore.persist.rehydrate();
    void useLineTranslationStore.persist.rehydrate();
    void usePlaybackModesStore.persist.rehydrate();
  }, []);
  return null;
}
