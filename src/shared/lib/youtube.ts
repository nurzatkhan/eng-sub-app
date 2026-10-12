const ID_RE = /^[\w-]{11}$/;

/**
 * Extracts a video id from any common YouTube link:
 * watch?v=, youtu.be/, /shorts/, /embed/, /live/, m. and music. subdomains.
 */
export function parseYoutubeVideoId(input: string): string | null {
  const text = input.trim();
  if (ID_RE.test(text)) return text;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, "");

  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/)?.[1] ?? null;
  }
  return id && ID_RE.test(id) ? id : null;
}

/** "1m30s", "90", "90s" -> seconds */
export function parseYoutubeStartTime(input: string): number {
  try {
    const t = new URL(input.trim()).searchParams.get("t");
    if (!t) return 0;
    if (/^\d+$/.test(t)) return Number(t);
    const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
  } catch {
    return 0;
  }
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<typeof YT> | null = null;

/** Loads the YouTube IFrame Player API once. */
export function loadYoutubeIframeApi(): Promise<typeof YT> {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser only"));
  if (window.YT?.Player) return Promise.resolve(window.YT);

  apiPromise ??= new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("Не удалось загрузить плеер YouTube"));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}
