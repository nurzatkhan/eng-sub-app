"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AudioLinesIcon, LibraryIcon, PlayIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const LINKS = [
  { href: "/", label: "Плеер", icon: PlayIcon },
  { href: "/library", label: "Видеотека", icon: LibraryIcon },
  { href: "/transcribe", label: "Распознавание", icon: AudioLinesIcon },
] as const;

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1" aria-label="Разделы">
      <Link href="/" className="mr-2 font-semibold">
        English Subs
      </Link>
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-muted text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
