"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SquarePlayIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { openYoutube } from "../model/open-youtube";

export const YOUTUBE_LINK_INPUT_ID = "youtube-link";

export function YoutubeLinkForm() {
  const [link, setLink] = useState("");

  const submit = (value: string) => {
    if (!value.trim()) return;
    if (openYoutube(value)) setLink("");
    else toast.error("Это не похоже на ссылку YouTube");
  };

  return (
    <form
      className="flex min-w-0 flex-1 basis-64 gap-1.5 sm:max-w-sm"
      onSubmit={(e) => {
        e.preventDefault();
        submit(link);
      }}
    >
      <Input
        id={YOUTUBE_LINK_INPUT_ID}
        value={link}
        onChange={(e) => setLink(e.target.value)}
        // pasting a link opens it right away
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          if (openYoutube(text)) {
            e.preventDefault();
            setLink("");
          }
        }}
        placeholder="Ссылка на YouTube   /"
        aria-label="Ссылка на YouTube"
        inputMode="url"
      />
      <Button type="submit" variant="outline" size="icon" aria-label="Открыть видео с YouTube">
        <SquarePlayIcon />
      </Button>
    </form>
  );
}
