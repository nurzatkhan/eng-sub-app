"use client";

import { useRef } from "react";
import { FileTextIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { loadSubtitleFile } from "../model/load-subtitle-file";

export function UploadSubtitlesButton() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Button variant="outline" onClick={() => inputRef.current?.click()}>
        <FileTextIcon />
        Субтитры
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".srt,.vtt,text/vtt"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void loadSubtitleFile(file);
          e.target.value = "";
        }}
      />
    </>
  );
}
