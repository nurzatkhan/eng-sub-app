import Image from "next/image";
import Link from "next/link";
import { formatClock } from "@/shared/lib/format-time";
import { playerHref, youtubeThumbnail } from "../lib/links";
import type { CatalogVideo } from "../model/types";
import { LevelBadge } from "./level-badge";

export function VideoRow({ video, index }: { video: CatalogVideo; index?: number }) {
  return (
    <Link
      href={playerHref(video.id)}
      className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
    >
      {index != null && <span className="w-6 shrink-0 text-right text-sm text-muted-foreground tabular-nums">{index}</span>}
      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-muted sm:w-40">
        <Image
          src={youtubeThumbnail(video.id)}
          alt=""
          fill
          sizes="160px"
          className="object-cover transition-transform group-hover:scale-105"
        />
        <span className="absolute right-1 bottom-1 rounded bg-black/80 px-1 text-[11px] text-white tabular-nums">
          {formatClock(video.seconds)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-medium group-hover:text-primary">{video.title}</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <LevelBadge level={video.level} />
          <span className="truncate">{video.channel}</span>
        </p>
      </div>
    </Link>
  );
}
