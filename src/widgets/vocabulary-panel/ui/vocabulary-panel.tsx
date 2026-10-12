"use client";

import { DownloadIcon, Volume2Icon, XIcon } from "lucide-react";
import { useVocabularyStore, type SavedWord } from "@/entities/word";
import { downloadFile } from "@/shared/lib/download";
import { speakEnglish } from "@/shared/lib/speech";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

function toCsv(words: SavedWord[]): string {
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows = words.map((w) => [w.word, w.translation, w.context].map(q).join(","));
  // BOM so Excel opens Cyrillic correctly
  return "﻿" + ["word,translation,context", ...rows].join("\n");
}

export function VocabularyPanel() {
  const wordsMap = useVocabularyStore((s) => s.words);
  const remove = useVocabularyStore((s) => s.remove);
  const words = Object.values(wordsMap).sort((a, b) => b.addedAt - a.addedAt);

  if (!words.length) {
    return (
      <p className="p-6 text-center text-muted-foreground">
        Нажмите на слово в субтитрах и добавьте его «В словарь»
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-2">
        <Button variant="outline" size="sm" onClick={() => downloadFile("my-words.csv", toCsv(words), "text/csv")}>
          <DownloadIcon />
          Скачать CSV
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ul>
          {words.map((w) => (
            <li key={w.word} className="flex items-start gap-2 border-b px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <div>
                  <span className="font-medium">{w.word}</span>
                  <span className="text-muted-foreground"> — {w.translation || "…"}</span>
                </div>
                {w.context && <p className="truncate text-xs text-muted-foreground">{w.context}</p>}
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Произнести" onClick={() => speakEnglish(w.word)}>
                <Volume2Icon />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Удалить" onClick={() => remove(w.word)}>
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
