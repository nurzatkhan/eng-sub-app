import type { Metadata } from "next";
import { TranscribePage } from "@/pages/transcribe";

export const metadata: Metadata = {
  title: "Распознавание речи — English Subs",
  description: "Субтитры для своего видео на английском прямо в браузере, с помощью Whisper",
};

export default function Page() {
  return <TranscribePage />;
}
