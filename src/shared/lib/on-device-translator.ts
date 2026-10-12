// Chrome's built-in Translator API (Chrome 138+): translation runs on the device, offline after the
// language pack is downloaded, with no rate limits. https://developer.chrome.com/docs/ai/translator-api

type Availability = "unavailable" | "downloadable" | "downloading" | "available";

type TranslatorInstance = { translate(text: string): Promise<string> };

type TranslatorStatic = {
  availability(opts: { sourceLanguage: string; targetLanguage: string }): Promise<Availability>;
  create(opts: { sourceLanguage: string; targetLanguage: string }): Promise<TranslatorInstance>;
};

declare global {
  var Translator: TranslatorStatic | undefined;
}

const translators = new Map<string, Promise<TranslatorInstance | null>>();

function getTranslator(target: string): Promise<TranslatorInstance | null> {
  let pending = translators.get(target);
  if (!pending) {
    pending = (async () => {
      const api = globalThis.Translator;
      if (!api) return null;
      const opts = { sourceLanguage: "en", targetLanguage: target };
      if ((await api.availability(opts)) === "unavailable") return null;
      return api.create(opts);
    })().catch(() => null);
    translators.set(target, pending);
    // don't cache failures: creating may need a user gesture to start the language-pack download
    void pending.then((t) => t ?? translators.delete(target));
  }
  return pending;
}

export function isOnDeviceTranslatorSupported(): boolean {
  return typeof globalThis.Translator !== "undefined";
}

/** Translates EN → `target` on the device. Returns null when the browser can't. */
export async function translateOnDevice(text: string, target: string): Promise<string | null> {
  const translator = await getTranslator(target);
  if (!translator) return null;
  try {
    return await translator.translate(text);
  } catch {
    return null;
  }
}
