import { NextRequest, NextResponse } from "next/server";
import { analyzeSentiment } from "@/lib/sentiment";
import { getTranscript, saveTranscript, saveAnalysis, getAnalysis } from "@/lib/store";
import { fetchCallTranscript } from "@/lib/vapi";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { callId } = await req.json();

  if (!callId || typeof callId !== "string") {
    return NextResponse.json({ error: "callId is required" }, { status: 400 });
  }

  // Return cached analysis if already done
  const cached = getAnalysis(callId);
  if (cached) {
    return NextResponse.json({ callId, analysis: cached, cached: true });
  }

  // Get transcript from store or fetch from Vapi API
  let transcript = getTranscript(callId);
  if (!transcript) {
    try {
      transcript = await fetchCallTranscript(callId);
      saveTranscript(callId, transcript);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch transcript from Vapi";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  try {
    const analysis = await analyzeSentiment(transcript);
    saveAnalysis(callId, analysis);
    return NextResponse.json({ callId, analysis, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sentiment analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
