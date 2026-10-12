export const TARGET_LANGUAGES = [
  { code: "ru", label: "Русский" },
  { code: "kk", label: "Қазақша" },
  { code: "uk", label: "Українська" },
  { code: "uz", label: "Oʻzbekcha" },
  { code: "ky", label: "Кыргызча" },
  { code: "tr", label: "Türkçe" },
] as const;

export type TargetLanguage = (typeof TARGET_LANGUAGES)[number]["code"];

export const DEFAULT_TARGET_LANGUAGE: TargetLanguage = "ru";

export function isTargetLanguage(value: string): value is TargetLanguage {
  return TARGET_LANGUAGES.some((l) => l.code === value);
}
