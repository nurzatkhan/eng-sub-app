"use client";

import { useDictionary } from "@/entities/translation";
import { useVocabularyStore } from "@/entities/word";
import { useVideoUrlSync, useYoutubePaste } from "@/features/open-youtube";
import { HotkeysDialog } from "@/features/player-hotkeys";
import { usePlaybackModes } from "@/features/playback-modes";
import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AppHeader } from "@/widgets/app-header";
import { MainNav } from "@/widgets/main-nav";
import { SubtitlesPanel } from "@/widgets/subtitles-panel";
import { VideoPlayer } from "@/widgets/video-player";
import { VocabularyPanel } from "@/widgets/vocabulary-panel";
import { WordHoverHint } from "@/widgets/word-hover-hint";
import { WordLookupPopover } from "@/widgets/word-lookup-popover";
import { usePlayerHotkeys } from "../model/use-player-hotkeys";

export function PlayerPage() {
  const savedCount = useVocabularyStore((s) => Object.keys(s.words).length);
  usePlayerHotkeys();
  usePlaybackModes();
  useYoutubePaste();
  useVideoUrlSync();
  // load the offline dictionary up front so the first click/hover is instant
  useDictionary();

  return (
    <div className="flex h-dvh flex-col">
      <h1 className="sr-only">English Subs — плеер с переводом субтитров</h1>
      <AppHeader nav={<MainNav />} />
      <main className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_420px] lg:grid-rows-1">
        <VideoPlayer />
        <aside className="flex min-h-0 flex-col border-t bg-card lg:border-t-0 lg:border-l">
          <Tabs defaultValue="subtitles" className="flex min-h-0 flex-1 flex-col gap-0">
            <div className="border-b p-2">
              <TabsList className="w-full">
                <TabsTrigger value="subtitles">Субтитры</TabsTrigger>
                <TabsTrigger value="vocabulary">
                  Мои слова
                  {savedCount > 0 && <Badge variant="secondary">{savedCount}</Badge>}
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="subtitles" className="min-h-0 flex-1">
              <SubtitlesPanel />
            </TabsContent>
            <TabsContent value="vocabulary" className="min-h-0 flex-1">
              <VocabularyPanel />
            </TabsContent>
          </Tabs>
        </aside>
      </main>
      <WordLookupPopover />
      <WordHoverHint />
      <HotkeysDialog />
    </div>
  );
}
