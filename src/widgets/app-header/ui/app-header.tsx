import type { ReactNode } from "react";
import { ExportSubtitlesButton } from "@/features/export-subtitles";
import { YoutubeLinkForm } from "@/features/open-youtube";
import { HotkeysButton } from "@/features/player-hotkeys";
import { LanguageSelect } from "@/features/select-language";
import { TranscribeButton, TranscriptionStatus } from "@/features/transcribe-speech";
import { UploadSubtitlesButton } from "@/features/upload-subtitles";
import { UploadVideoButton } from "@/features/upload-video";

/** `nav` is a slot: widgets don't import each other, the page composes them. */
export function AppHeader({ nav }: { nav?: ReactNode }) {
  return (
    <header className="border-b bg-card">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
        {nav}
        <YoutubeLinkForm />
        <UploadVideoButton />
        <UploadSubtitlesButton />
        <TranscribeButton />
        <ExportSubtitlesButton />
        <div className="ml-auto flex items-center gap-1">
          <HotkeysButton />
          <LanguageSelect />
        </div>
      </div>
      <TranscriptionStatus />
    </header>
  );
}
