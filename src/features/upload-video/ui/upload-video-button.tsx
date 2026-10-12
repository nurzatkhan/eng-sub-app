"use client";

import { useRef } from "react";
import { FilmIcon } from "lucide-react";
import { useMediaStore } from "@/entities/media";
import { Button } from "@/shared/ui/button";

export function UploadVideoButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const loadFile = useMediaStore((s) => s.loadFile);

  return (
    <>
      <Button onClick={() => inputRef.current?.click()}>
        <FilmIcon />
        Видео
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="video/*,audio/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) loadFile(file);
          e.target.value = "";
        }}
      />
    </>
  );
}
