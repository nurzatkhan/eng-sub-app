import type { NextRequest } from "next/server";
import { translateWithGoogle } from "@/shared/api/translate/google.server";
import { isTargetLanguage } from "@/shared/config";

const MAX_TEXT_LENGTH = 1000;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const text = params.get("q")?.trim() ?? "";
  const to = params.get("to") ?? "";

  if (!text || text.length > MAX_TEXT_LENGTH) {
    return Response.json({ error: "Invalid text" }, { status: 400 });
  }
  if (!isTargetLanguage(to)) {
    return Response.json({ error: "Unsupported language" }, { status: 400 });
  }

  try {
    const result = await translateWithGoogle({ text, to, dictionary: params.get("dict") === "1" });
    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Translation service unavailable" }, { status: 502 });
  }
}
