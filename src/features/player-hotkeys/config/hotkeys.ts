// Keys are matched by physical position (KeyboardEvent.code), so they work with the Russian layout too.

export type HotkeyId =
  | "play-pause"
  | "prev-line"
  | "next-line"
  | "prev-word"
  | "next-word"
  | "repeat-line"
  | "seek-back"
  | "seek-forward"
  | "slower"
  | "faster"
  | "auto-pause"
  | "loop-line"
  | "toggle-translation"
  | "save-word"
  | "close"
  | "focus-link"
  | "help";

type Combo = {
  code: string;
  shift?: boolean;
  /** how the keys are shown in the cheat sheet */
  label: string[];
};

export type Hotkey = {
  id: HotkeyId;
  combos: Combo[];
  description: string;
  group: "Видео" | "Учёба" | "Другое";
};

export const HOTKEYS: Hotkey[] = [
  { id: "play-pause", group: "Видео", description: "Пауза / воспроизведение", combos: [{ code: "Space", label: ["Пробел"] }, { code: "KeyK", label: ["K"] }] },
  { id: "prev-line", group: "Видео", description: "Предыдущая строка", combos: [{ code: "KeyA", label: ["A"] }] },
  { id: "next-line", group: "Видео", description: "Следующая строка", combos: [{ code: "KeyD", label: ["D"] }] },
  { id: "repeat-line", group: "Видео", description: "Повторить текущую строку с начала", combos: [{ code: "KeyR", label: ["R"] }, { code: "ArrowDown", label: ["↓"] }] },
  { id: "seek-back", group: "Видео", description: "Назад на 5 секунд", combos: [{ code: "ArrowLeft", shift: true, label: ["Shift", "←"] }] },
  { id: "seek-forward", group: "Видео", description: "Вперёд на 5 секунд", combos: [{ code: "ArrowRight", shift: true, label: ["Shift", "→"] }] },
  { id: "slower", group: "Видео", description: "Медленнее", combos: [{ code: "Comma", shift: true, label: ["<"] }, { code: "Minus", label: ["-"] }] },
  { id: "faster", group: "Видео", description: "Быстрее", combos: [{ code: "Period", shift: true, label: [">"] }, { code: "Equal", label: ["="] }] },
  { id: "prev-word", group: "Учёба", description: "Предыдущее слово с переводом", combos: [{ code: "ArrowLeft", label: ["←"] }] },
  { id: "next-word", group: "Учёба", description: "Следующее слово с переводом", combos: [{ code: "ArrowRight", label: ["→"] }] },
  { id: "auto-pause", group: "Учёба", description: "Пауза после каждой строки", combos: [{ code: "KeyP", label: ["P"] }] },
  { id: "loop-line", group: "Учёба", description: "Повторять строку по кругу", combos: [{ code: "KeyL", label: ["L"] }] },
  { id: "toggle-translation", group: "Учёба", description: "Показать / скрыть перевод строки", combos: [{ code: "KeyT", label: ["T"] }] },
  { id: "save-word", group: "Учёба", description: "Сохранить открытое слово в словарь", combos: [{ code: "KeyS", label: ["S"] }] },
  { id: "close", group: "Другое", description: "Закрыть перевод слова", combos: [{ code: "Escape", label: ["Esc"] }] },
  { id: "focus-link", group: "Другое", description: "Вставить ссылку на YouTube", combos: [{ code: "Slash", label: ["/"] }] },
  { id: "help", group: "Другое", description: "Горячие клавиши", combos: [{ code: "Slash", shift: true, label: ["?"] }] },
];

export function matchHotkey(e: KeyboardEvent): HotkeyId | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  const hit = HOTKEYS.find((h) => h.combos.some((c) => c.code === e.code && !!c.shift === e.shiftKey));
  return hit?.id ?? null;
}
