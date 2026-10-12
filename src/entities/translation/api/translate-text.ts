import { fetchTranslation } from "@/shared/api";
import { LOCAL_MT_LANGUAGES, translateLocally } from "@/shared/lib/local-mt";
import { translateOnDevice } from "@/shared/lib/on-device-translator";
import type { TextTranslation } from "../model/types";

/**
 * 1. Chrome's built-in on-device translator,
 * 2. local Opus-MT model in a worker (ru, uk),
 * 3. the server's Google proxy (rate-limited — last resort).
 */
export async function translateText(text: string, to: string, signal?: AbortSignal): Promise<TextTranslation> {
  const onDevice = await translateOnDevice(text, to);
  if (onDevice) return { text: onDevice, source: "on-device" };

  if (LOCAL_MT_LANGUAGES.has(to)) {
    try {
      return { text: await translateLocally(text, to), source: "local-mt" };
    } catch (e) {
      console.warn("Local translation failed, falling back to Google", e);
    }
  }

  const remote = await fetchTranslation({ text, to }, signal);
  return { text: remote.text, source: "google" };
}
