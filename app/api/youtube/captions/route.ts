import type { NextRequest } from "next/server";
import { getYoutubeCaptions } from "@/shared/api/youtube/captions.server";

const VIDEO_ID_RE = /^[\w-]{11}$/;

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("v") ?? "";
  if (!VIDEO_ID_RE.test(videoId)) {
    return Response.json({ error: "Invalid video id", code: "invalid" }, { status: 400 });
  }

  try {
    const result = await getYoutubeCaptions(videoId);
    if (!result.ok) return Response.json({ error: result.message, code: result.code }, { status: 404 });
    return Response.json(result.captions);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Could not load captions from YouTube", code: "upstream" }, { status: 502 });
  }
}
