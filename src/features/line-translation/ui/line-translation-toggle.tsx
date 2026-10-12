"use client";

import { LanguagesIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Kbd } from "@/shared/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { useLineTranslationStore } from "../model/settings-store";

export function LineTranslationToggle({ className }: { className?: string }) {
  const enabled = useLineTranslationStore((s) => s.enabled);
  const toggle = useLineTranslationStore((s) => s.toggle);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={enabled ? "secondary" : "ghost"}
          size="icon-sm"
          aria-pressed={enabled}
          aria-label="Перевод строки под видео"
          onClick={toggle}
          className={cn(className)}
        >
          <LanguagesIcon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {enabled ? "Скрыть перевод строки" : "Показывать перевод строки"} <Kbd>T</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}
