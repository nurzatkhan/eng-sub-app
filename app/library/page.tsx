import type { Metadata } from "next";
import { LibraryPage } from "@/pages/library";

export const metadata: Metadata = {
  title: "Видеотека — English Subs",
  description: "Видео на английском по уровням A1–C2 с субтитрами и переводом слов",
};

export default function Page() {
  return <LibraryPage />;
}
