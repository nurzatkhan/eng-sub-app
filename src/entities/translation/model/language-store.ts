import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_TARGET_LANGUAGE, type TargetLanguage } from "@/shared/config";

type LanguageState = {
  target: TargetLanguage;
  setTarget: (target: TargetLanguage) => void;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      target: DEFAULT_TARGET_LANGUAGE,
      setTarget: (target) => set({ target }),
    }),
    { name: "target-language", skipHydration: true },
  ),
);
