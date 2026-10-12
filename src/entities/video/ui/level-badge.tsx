import { cn } from "@/shared/lib/utils";
import type { CefrLevel } from "../model/types";

const COLORS: Record<CefrLevel, string> = {
  A1: "bg-emerald-500/15 text-emerald-300",
  A2: "bg-lime-500/15 text-lime-300",
  B1: "bg-sky-500/15 text-sky-300",
  B2: "bg-indigo-500/15 text-indigo-300",
  C1: "bg-amber-500/15 text-amber-300",
  C2: "bg-rose-500/15 text-rose-300",
};

export function LevelBadge({ level, className }: { level: CefrLevel; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center rounded-md px-1.5 text-xs font-semibold", COLORS[level], className)}>
      {level}
    </span>
  );
}
