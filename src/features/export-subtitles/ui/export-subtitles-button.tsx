"use client";

import { DownloadIcon } from "lucide-react";
import { useMediaStore } from "@/entities/media";
import { toSrt, useSubtitleStore } from "@/entities/subtitle";
import { downloadFile } from "@/shared/lib/download";
import { Button } from "@/shared/ui/button";

export function ExportSubtitlesButton() {
  const cues = useSubtitleStore((s) => s.cues);
  const title = useMediaStore((s) => s.title);

  return (
    <Button
      variant="ghost"
      disabled={!cues.length}
      onClick={() => {
        const base = title?.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]+/g, " ").trim() || "subtitles";
        downloadFile(`${base}.srt`, toSrt(cues), "text/plain");
      }}
    >
      <DownloadIcon />
      .srt
    </Button>
  );
}
