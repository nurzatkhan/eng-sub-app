import { toast } from "sonner";
import { useMediaStore } from "@/entities/media";

export const SPEEDS = [0.5, 0.75, 0.9, 1, 1.25, 1.5] as const;

export const formatSpeed = (rate: number) => `${rate}×`;

/** One step slower (-1) or faster (+1). */
export function stepSpeed(direction: -1 | 1) {
  const { rate, setRate } = useMediaStore.getState();
  const i = SPEEDS.findIndex((s) => s >= rate);
  const current = i < 0 ? SPEEDS.length - 1 : i;
  const next = SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, current + direction))];
  setRate(next);
  toast(`Скорость ${formatSpeed(next)}`, { id: "playback-speed", duration: 1200 });
}
