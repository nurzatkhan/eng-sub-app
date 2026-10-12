"use client";

import { useEffect, useState } from "react";
import { formatClock } from "@/shared/lib/format-time";
import { Progress } from "@/shared/ui/progress";
import { useTranscriptionStore } from "../model/transcription-store";

function useElapsedSeconds(since: number | null) {
  // 0 until the first tick: reading the clock during render breaks prerendering
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (since == null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [since]);
  return since == null ? 0 : Math.max(0, (now - since) / 1000);
}

export function TranscriptionStatus() {
  const { status, modelProgress, startedAt, duration } = useTranscriptionStore();
  const elapsed = useElapsedSeconds(startedAt);

  if (status === "idle") return null;

  return (
    <div className="flex flex-col gap-1.5 border-b bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
      {status === "decoding" && <span>Извлекаю звук из видео…</span>}
      {status === "loading-model" && (
        <>
          <span>Загружаю модель распознавания (один раз, ~150 МБ)… {modelProgress.toFixed(0)}%</span>
          <Progress value={modelProgress} className="h-1" />
        </>
      )}
      {status === "transcribing" && (
        <span>
          Распознаю речь… прошло {formatClock(elapsed)}, длина видео {formatClock(duration)}. Это может занять
          несколько минут.
        </span>
      )}
    </div>
  );
}
