"use client";

import { GaugeIcon } from "lucide-react";
import { useMediaStore } from "@/entities/media";
import { Kbd } from "@/shared/ui/kbd";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { SPEEDS, formatSpeed } from "../model/speed";

export function SpeedSelect() {
  const rate = useMediaStore((s) => s.rate);
  const setRate = useMediaStore((s) => s.setRate);

  return (
    <Select value={String(rate)} onValueChange={(v) => setRate(Number(v))}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SelectTrigger size="sm" aria-label="Скорость воспроизведения" className="w-24">
            <GaugeIcon />
            <SelectValue />
          </SelectTrigger>
        </TooltipTrigger>
        <TooltipContent>
          Скорость <Kbd>&lt;</Kbd> <Kbd>&gt;</Kbd>
        </TooltipContent>
      </Tooltip>
      <SelectContent>
        {SPEEDS.map((s) => (
          <SelectItem key={s} value={String(s)}>
            {formatSpeed(s)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
