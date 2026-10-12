import { toast } from "sonner";
import { parseSubtitles, useSubtitleStore } from "@/entities/subtitle";

export async function loadSubtitleFile(file: File) {
  const cues = parseSubtitles(await file.text());
  if (!cues.length) {
    toast.error(`Не удалось прочитать субтитры из ${file.name}`);
    return;
  }
  useSubtitleStore.getState().setCues(cues, file.name);
  toast.success(`Субтитры загружены: ${cues.length} строк`);
}
