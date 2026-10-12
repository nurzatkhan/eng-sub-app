"use client";

import { Loader2Icon, MicIcon } from "lucide-react";
import { useMediaStore } from "@/entities/media";
import { useSubtitleStore } from "@/entities/subtitle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { useTranscriptionStore } from "../model/transcription-store";

export function TranscribeButton() {
  const sourceKind = useMediaStore((s) => s.source?.kind);
  const hasCues = useSubtitleStore((s) => s.cues.length > 0);
  const busy = useTranscriptionStore((s) => s.status !== "idle");
  const start = useTranscriptionStore((s) => s.start);

  const button = (
    <Button variant="outline" disabled={sourceKind !== "file" || busy} onClick={hasCues ? undefined : start}>
      {busy ? <Loader2Icon className="animate-spin" /> : <MicIcon />}
      Распознать речь
    </Button>
  );

  if (sourceKind !== "file") {
    return (
      <Tooltip>
        {/* disabled buttons don't fire pointer events, so the tooltip needs a wrapper */}
        <TooltipTrigger asChild>
          <span tabIndex={0}>{button}</span>
        </TooltipTrigger>
        <TooltipContent>
          {sourceKind === "youtube"
            ? "Для YouTube берутся субтитры самого видео: звук встроенного плеера недоступен"
            : "Сначала загрузите видео"}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (!hasCues) return button;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{button}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Заменить субтитры?</AlertDialogTitle>
          <AlertDialogDescription>
            Текущие субтитры будут заменены распознанными из видео.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={start}>Распознать</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
