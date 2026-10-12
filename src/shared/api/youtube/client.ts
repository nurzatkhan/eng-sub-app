import type { YoutubeCaptions } from "./types";

export class YoutubeCaptionsRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}

export async function fetchYoutubeCaptions(videoId: string, signal?: AbortSignal): Promise<YoutubeCaptions> {
  const res = await fetch(`/api/youtube/captions?v=${encodeURIComponent(videoId)}`, { signal });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
    throw new YoutubeCaptionsRequestError(body.error ?? `HTTP ${res.status}`, body.code ?? "upstream");
  }
  return res.json();
}
