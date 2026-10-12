"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { useTranslation, useWordTranslation, type TranslationSource } from "@/entities/translation";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { PART_OF_SPEECH_LABELS } from "../config/parts-of-speech";

const SOURCE_LABELS: Record<TranslationSource, string> = {
  dictionary: "Словарь Wiktionary (офлайн)",
  "on-device": "Переводчик Chrome (на устройстве)",
  "local-mt": "Локальная модель Opus-MT",
  google: "Google Translate",
};

function SourceNote({ source }: { source: TranslationSource }) {
  return <p className="text-[11px] text-muted-foreground/70">{SOURCE_LABELS[source]}</p>;
}

type Props = {
  word: string;
  sentence: string;
};

export function WordTranslation({ word, sentence }: Props) {
  const result = useWordTranslation(word);

  return (
    <div className="flex flex-col gap-2">
      {result.status === "pending" ? (
        <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
      ) : result.status === "error" ? (
        <p className="text-destructive">Слова нет в словаре, а онлайн-перевод сейчас недоступен.</p>
      ) : (
        <>
          {result.data.lemma !== word.toLowerCase().replace(/’/g, "'") && (
            <p className="text-xs text-muted-foreground">
              {word} → <span className="font-medium text-foreground">{result.data.lemma}</span>
            </p>
          )}
          <p className="text-lg font-medium text-amber-300">{result.data.primary}</p>
          {result.data.entries.map((entry, i) => (
            <div key={`${entry.pos}-${i}`}>
              <div className="text-xs uppercase text-muted-foreground">
                {PART_OF_SPEECH_LABELS[entry.pos] ?? entry.pos}
              </div>
              <div>{entry.terms.join(", ")}</div>
            </div>
          ))}
          <SourceNote source={result.data.source} />
        </>
      )}
      {sentence && <SentenceTranslation key={sentence} sentence={sentence} />}
    </div>
  );
}

function SentenceTranslation({ sentence }: { sentence: string }) {
  const [requested, setRequested] = useState(false);
  const query = useTranslation({ text: sentence, enabled: requested });

  if (!requested) {
    return (
      <Button variant="secondary" size="sm" className="self-start" onClick={() => setRequested(true)}>
        Перевести фразу
      </Button>
    );
  }

  return (
    <>
      <Separator className="my-1" />
      <p className="text-muted-foreground">{sentence}</p>
      {query.isPending ? (
        <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
      ) : query.isError ? (
        <p className="text-destructive">
          Не удалось перевести фразу. Офлайн-перевод фраз есть для русского и украинского и в Chrome 138+; запасной
          онлайн-переводчик сейчас недоступен.
        </p>
      ) : (
        <>
          <p>{query.data.text}</p>
          <SourceNote source={query.data.source} />
        </>
      )}
    </>
  );
}
