import type { CefrLevel } from "../model/types";

export const LEVEL_INFO: Record<CefrLevel, { name: string; description: string }> = {
  A1: { name: "Начальный", description: "Короткие диалоги на самые простые темы" },
  A2: { name: "Элементарный", description: "Живые разговоры простым языком о повседневной жизни" },
  B1: { name: "Средний", description: "Обсуждения знакомых тем с полезной лексикой" },
  B2: { name: "Выше среднего", description: "Научно-популярные уроки, речь в обычном темпе" },
  C1: { name: "Продвинутый", description: "Выступления носителей на сложные темы" },
  C2: { name: "Профессиональный", description: "Быстрая речь и научная лексика" },
};
