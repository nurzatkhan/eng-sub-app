"use client";

import { useEffect } from "react";
import { StarIcon } from "lucide-react";
import { useWordTranslation } from "@/entities/translation";
import { normalizeWord, useVocabularyStore } from "@/entities/word";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type Props = {
  word: string;
  context: string;
};

export function SaveWordButton({ word, context }: Props) {
  const saved = useVocabularyStore((s) => s.words[normalizeWord(word)]);
  const toggle = useVocabularyStore((s) => s.toggle);
  const setTranslation = useVocabularyStore((s) => s.setTranslation);
  // same lookup as the translation card, so this is served from memory/cache
  const result = useWordTranslation(word);
  const translation = result.status === "success" ? result.data.primary : "";

  // saved before the translation arrived — fill it in
  useEffect(() => {
    if (saved && !saved.translation && translation) setTranslation(word, translation);
  }, [saved, translation, word, setTranslation]);

  return (
    <Button
      variant={saved ? "secondary" : "outline"}
      size="sm"
      onClick={() => toggle({ word, translation, context })}
    >
      <StarIcon className={cn(saved && "fill-amber-300 text-amber-300")} />
      {saved ? "В словаре" : "В словарь"}
    </Button>
  );
}
