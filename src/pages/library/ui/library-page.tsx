"use client";

import { useState } from "react";
import {
  CEFR_LEVELS,
  LEVEL_INFO,
  LevelBadge,
  VIDEO_CATALOG,
  VideoRow,
  countByLevel,
  videosByLevel,
  type CefrLevel,
} from "@/entities/video";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { MainNav } from "@/widgets/main-nav";

type Filter = CefrLevel | "all";

const COUNTS = countByLevel();

function LevelSection({ level }: { level: CefrLevel }) {
  const videos = videosByLevel(level);
  return (
    <section aria-labelledby={`level-${level}`} className="flex flex-col gap-1">
      <header className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-2 pb-1">
        <h2 id={`level-${level}`} className="flex items-center gap-2 text-lg font-semibold">
          <LevelBadge level={level} className="h-6 px-2 text-sm" />
          {LEVEL_INFO[level].name}
        </h2>
        <p className="text-sm text-muted-foreground">
          {LEVEL_INFO[level].description} · {videos.length} видео
        </p>
      </header>
      <ul>
        {videos.map((video, i) => (
          <li key={video.id}>
            <VideoRow video={video} index={i + 1} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LibraryPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const levels = filter === "all" ? CEFR_LEVELS : [filter];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
          <MainNav />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold">Видеотека</h1>
          <p className="text-muted-foreground">
            {VIDEO_CATALOG.length} видео с английскими субтитрами, разделённые по уровням CEFR. Нажмите на видео,
            чтобы смотреть его с переводом слов.
          </p>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="h-auto w-full flex-wrap justify-start">
            <TabsTrigger value="all" className="flex-none">
              Все <span className="text-muted-foreground">{VIDEO_CATALOG.length}</span>
            </TabsTrigger>
            {CEFR_LEVELS.map((level) => (
              <TabsTrigger key={level} value={level} className="flex-none">
                {level} <span className="text-muted-foreground">{COUNTS[level]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-8">
          {levels.map((level) => (
            <LevelSection key={level} level={level} />
          ))}
        </div>
      </main>
    </div>
  );
}
