"use client";

import { PauseCircleIcon, Repeat1Icon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Kbd } from "@/shared/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { usePlaybackModesStore } from "../model/modes-store";

export function PlaybackModeToggles() {
  const { autoPause, loop, toggleAutoPause, toggleLoop } = usePlaybackModesStore();

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={autoPause ? "secondary" : "ghost"}
            size="icon-sm"
            aria-pressed={autoPause}
            aria-label="Пауза после каждой строки"
            onClick={toggleAutoPause}
          >
            <PauseCircleIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Пауза после каждой строки <Kbd>P</Kbd>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={loop ? "secondary" : "ghost"}
            size="icon-sm"
            aria-pressed={loop}
            aria-label="Повторять текущую строку"
            onClick={toggleLoop}
          >
            <Repeat1Icon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Повторять текущую строку <Kbd>L</Kbd>
        </TooltipContent>
      </Tooltip>
    </>
  );
}
