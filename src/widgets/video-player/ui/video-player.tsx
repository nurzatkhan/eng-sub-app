"use client";

import { useEffect, useState } from "react";
import { FilmIcon } from "lucide-react";
import { toast } from "sonner";
import { useMediaStore } from "@/entities/media";
import { isSubtitleFile } from "@/entities/subtitle";
import { openYoutube } from "@/features/open-youtube";
import { loadSubtitleFile } from "@/features/upload-subtitles";
import { cn } from "@/shared/lib/utils";
import { CurrentLine } from "./current-line";
import { FileVideo } from "./file-video";
import { PlayerToolbar } from "./player-toolbar";
import { YoutubeVideo } from "./youtube-video";

const MEDIA_EXT_RE = /\.(mp4|webm|mov|m4v|mkv|mp3|m4a|wav)$/i;

function isDroppable(dt: DataTransfer | null) {
  return !!dt && (dt.types.includes("Files") || dt.types.includes("text/uri-list") || dt.types.includes("text/plain"));
}

/** Accepts dropped videos, .srt/.vtt files and YouTube links anywhere on the page. */
function usePageDrop() {
  const [dragging, setDragging] = useState(false);
  const loadFile = useMediaStore((s) => s.loadFile);

  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (!isDroppable(e.dataTransfer)) return;
      e.preventDefault();
      setDragging(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (!e.relatedTarget) setDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      const dt = e.dataTransfer;
      if (!isDroppable(dt)) return;
      e.preventDefault();
      setDragging(false);

      const files = Array.from(dt!.files);
      if (!files.length) {
        // a link dragged from another tab or the address bar
        const link = dt!.getData("text/uri-list").split("\n").find((l) => l && !l.startsWith("#")) ?? dt!.getData("text/plain");
        if (link && !openYoutube(link)) toast.error("Поддерживаются только ссылки YouTube");
        return;
      }
      for (const file of files) {
        if (isSubtitleFile(file)) void loadSubtitleFile(file);
        else if (/^(video|audio)\//.test(file.type) || MEDIA_EXT_RE.test(file.name)) loadFile(file);
      }
    };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [loadFile]);

  return dragging;
}

/**
 * <video> only fires timeupdate ~4×/s and the YouTube player fires nothing,
 * so poll the controller: every frame while playing, a couple of times a second when paused
 * (to catch seeks made in the player's own UI).
 */
function useTimeSync() {
  const paused = useMediaStore((s) => s.paused);
  const controller = useMediaStore((s) => s.controller);

  useEffect(() => {
    if (!controller) return;
    const update = () => useMediaStore.getState().sync({ currentTime: controller.getCurrentTime() });

    if (paused) {
      const id = setInterval(update, 500);
      return () => clearInterval(id);
    }
    let raf = 0;
    const tick = () => {
      update();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, controller]);
}

export function VideoPlayer() {
  const source = useMediaStore((s) => s.source);
  const dragging = usePageDrop();
  useTimeSync();

  return (
    <section className="flex min-h-0 flex-col gap-3 p-4">
      <div
        className={cn(
          "relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-black lg:aspect-auto lg:min-h-0 lg:flex-1",
          dragging && "ring-2 ring-primary",
        )}
      >
        {source?.kind === "file" && <FileVideo key={source.url} url={source.url} />}
        {source?.kind === "youtube" && (
          <YoutubeVideo key={source.videoId} videoId={source.videoId} startAt={source.startAt} />
        )}
        {/* the YouTube iframe swallows drag events — cover it while something is being dragged */}
        {dragging && source && <div className="absolute inset-0 z-10 bg-primary/10" />}
        {!source && (
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center text-muted-foreground",
              dragging && "border-primary",
            )}
          >
            <FilmIcon className="size-10" />
            <p>Перетащите сюда видео или ссылку на YouTube</p>
            <p className="text-xs">
              Ссылку можно просто вставить: Ctrl/⌘ + V. Для своих видео добавьте .srt / .vtt или нажмите «Распознать
              речь»
            </p>
          </div>
        )}
      </div>
      {source && <PlayerToolbar />}
      <CurrentLine />
    </section>
  );
}
