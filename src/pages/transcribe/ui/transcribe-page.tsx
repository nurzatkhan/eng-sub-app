"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CpuIcon, DownloadIcon, FileVideoIcon, Loader2Icon, PlayIcon, SquareIcon, UploadIcon, WandSparklesIcon } from "lucide-react";
import { useMediaStore } from "@/entities/media";
import { findCueIndex, normalizeCues, toSrt, useSubtitleStore } from "@/entities/subtitle";
import { downloadFile } from "@/shared/lib/download";
import { formatClock } from "@/shared/lib/format-time";
import { cn } from "@/shared/lib/utils";
import { WHISPER_MODELS } from "@/shared/lib/whisper";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { MainNav } from "@/widgets/main-nav";
import { useFileTranscription, type TranscriptionStage } from "../model/use-file-transcription";

const BUSY: TranscriptionStage[] = ["decoding", "loading-model", "transcribing"];

function useElapsed(from: number | null, to: number | null) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (from == null || to != null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [from, to]);
  if (from == null) return 0;
  return Math.max(0, ((to ?? now) - from) / 1000);
}

export function TranscribePage() {
  const t = useFileTranscription();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);

  const busy = BUSY.includes(t.stage);
  const elapsed = useElapsed(t.startedAt, t.finishedAt);
  const cues = useMemo(() => normalizeCues(t.segments), [t.segments]);
  const active = findCueIndex(cues, previewTime);

  // keep the newest recognized line in view while transcribing
  useEffect(() => {
    if (busy) listRef.current?.lastElementChild?.scrollIntoView({ block: "nearest" });
  }, [busy, cues.length]);

  const baseName = t.file?.name.replace(/\.[^.]+$/, "") ?? "subtitles";

  const openInPlayer = () => {
    if (!t.file) return;
    useMediaStore.getState().loadFile(t.file);
    useSubtitleStore.getState().setCues(cues, "Whisper");
    router.push("/");
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
          <MainNav />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold">Распознавание речи</h1>
          <p className="text-muted-foreground">
            Субтитры для своего видео на английском — прямо в браузере, с помощью Whisper. Файл никуда не загружается.
          </p>
        </div>

        {/* 1. file */}
        <section
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) t.selectFile(f);
          }}
          className={cn(
            "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 text-center",
            dragging && "border-primary bg-primary/5",
          )}
        >
          {t.file ? (
            <p className="flex items-center gap-2 font-medium">
              <FileVideoIcon className="size-5 text-muted-foreground" />
              {t.file.name}
              <span className="text-sm font-normal text-muted-foreground">
                {(t.file.size / 1024 / 1024).toFixed(1)} МБ
              </span>
            </p>
          ) : (
            <p className="text-muted-foreground">Перетащите сюда видео или аудио на английском</p>
          )}
          <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
            <UploadIcon />
            {t.file ? "Выбрать другой файл" : "Выбрать файл"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="video/*,audio/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) t.selectFile(f);
              e.target.value = "";
            }}
          />
        </section>

        {/* 2. model */}
        <section className="flex flex-col gap-2">
          <h2 className="font-medium">Модель</h2>
          <div role="radiogroup" aria-label="Модель распознавания" className="grid gap-2 sm:grid-cols-3">
            {WHISPER_MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={t.model === m.id}
                disabled={busy}
                onClick={() => t.setModel(m.id)}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-50",
                  t.model === m.id && "border-primary bg-primary/5",
                )}
              >
                <span className="font-medium">{m.label}</span>
                <span className="text-xs text-muted-foreground">
                  {m.size} · {m.note}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Модель скачивается один раз и сохраняется в браузере.</p>
        </section>

        {/* 3. run */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {busy ? (
              <Button variant="secondary" onClick={t.cancel}>
                <SquareIcon />
                Остановить
              </Button>
            ) : (
              <Button onClick={t.start} disabled={!t.file}>
                <WandSparklesIcon />
                {t.stage === "done" ? "Распознать заново" : "Сделать субтитры"}
              </Button>
            )}
            {t.device && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CpuIcon className="size-3.5" />
                {t.device === "webgpu" ? "Видеокарта (WebGPU)" : "Процессор (WASM)"}
              </span>
            )}
          </div>

          {t.stage !== "idle" && (
            <div className="flex flex-col gap-1.5 text-sm text-muted-foreground" aria-live="polite">
              {t.stage === "decoding" && (
                <span className="flex items-center gap-2">
                  <Loader2Icon className="size-4 animate-spin" />
                  Извлекаю звук…
                </span>
              )}
              {t.stage === "loading-model" && (
                <>
                  <span>Загружаю модель… {t.loadProgress.toFixed(0)}%</span>
                  <Progress value={t.loadProgress} className="h-1.5" />
                </>
              )}
              {t.stage === "transcribing" && (
                <>
                  <span>
                    Распознаю… {t.progress.toFixed(0)}% · прошло {formatClock(elapsed)} · длина {formatClock(t.duration)}
                  </span>
                  <Progress value={t.progress} className="h-1.5" />
                </>
              )}
              {t.stage === "done" && (
                <span>
                  Готово: {cues.length} строк за {formatClock(elapsed)}
                </span>
              )}
              {t.stage === "error" && <span className="text-destructive">Ошибка: {t.error}</span>}
            </div>
          )}
        </section>

        {/* result */}
        {t.previewUrl && (cues.length > 0 || busy) && (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-2">
              <video
                ref={videoRef}
                src={t.previewUrl}
                controls
                playsInline
                className="aspect-video w-full rounded-xl bg-black"
                onTimeUpdate={(e) => setPreviewTime(e.currentTarget.currentTime)}
              />
              <p className="min-h-[3em] text-center text-lg">{active >= 0 ? cues[active].text : ""}</p>
              {t.stage === "done" && (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={openInPlayer}>
                    <PlayIcon />
                    Открыть в плеере
                  </Button>
                  <Button variant="outline" onClick={() => downloadFile(`${baseName}.srt`, toSrt(cues), "text/plain")}>
                    <DownloadIcon />
                    Скачать .srt
                  </Button>
                </div>
              )}
            </div>
            <ScrollArea className="h-[420px] rounded-xl border">
              <div ref={listRef} className="py-1">
                {cues.map((c, i) => (
                  <button
                    key={`${c.start}-${i}`}
                    type="button"
                    onClick={() => {
                      if (!videoRef.current) return;
                      videoRef.current.currentTime = c.start + 0.01;
                      void videoRef.current.play();
                    }}
                    className={cn(
                      "flex w-full gap-3 border-l-[3px] border-transparent px-3 py-1.5 text-left hover:bg-muted/50",
                      i === active && "border-primary bg-primary/10",
                    )}
                  >
                    <span className="w-11 shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums">
                      {formatClock(c.start)}
                    </span>
                    <span>{c.text}</span>
                  </button>
                ))}
                {busy && (
                  <p className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <Loader2Icon className="size-4 animate-spin" />
                    Распознаю дальше…
                  </p>
                )}
              </div>
            </ScrollArea>
          </section>
        )}
      </main>
    </div>
  );
}
