"use client";

import { useEffect, useState } from "react";
import { useInstantLookup } from "@/entities/translation";
import { useWordLookupStore } from "@/features/word-lookup";

const SHOW_DELAY_MS = 120;

type Hint = { text: string; lemma: string | null; rect: DOMRect; anchor: Element };

/**
 * Hovering a subtitle word shows its main translation right away, from the offline dictionary.
 * One delegated listener for the whole page instead of a tooltip per word.
 */
export function WordHoverHint() {
  const lookup = useInstantLookup();
  const selection = useWordLookupStore((s) => s.selection);
  const [hint, setHint] = useState<Hint | null>(null);

  useEffect(() => {
    if (!lookup || !window.matchMedia("(hover: hover)").matches) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onOver = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-word]");
      clearTimeout(timer);
      if (!el) return;
      timer = setTimeout(() => {
        const word = el.textContent ?? "";
        const found = lookup(word);
        if (!found) return setHint(null);
        const lemma = found.lemma !== word.toLowerCase().replace(/’/g, "'") ? found.lemma : null;
        setHint({ text: found.entries[0].terms.slice(0, 3).join(", "), lemma, rect: el.getBoundingClientRect(), anchor: el });
      }, SHOW_DELAY_MS);
    };
    const onOut = (e: MouseEvent) => {
      const from = (e.target as Element | null)?.closest?.("[data-word]");
      const to = (e.relatedTarget as Element | null)?.closest?.("[data-word]");
      if (from && from !== to) {
        clearTimeout(timer);
        setHint(null);
      }
    };
    const hide = () => setHint(null);

    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("pointerdown", hide);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("pointerdown", hide);
    };
  }, [lookup]);

  // the full card for this word is already open
  if (!hint || selection?.anchor === hint.anchor) return null;

  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 max-w-72 -translate-x-1/2 -translate-y-full rounded-md bg-popover px-2.5 py-1.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10"
      style={{ left: hint.rect.left + hint.rect.width / 2, top: hint.rect.top - 6 }}
    >
      {hint.lemma && <span className="text-muted-foreground">{hint.lemma}: </span>}
      <span className="text-amber-300">{hint.text}</span>
    </div>
  );
}
