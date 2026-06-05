import { NextRequest, NextResponse } from "next/server";
import { analyzeSentiment } from "@/lib/sentiment";
import { saveTranscript, saveAnalysis } from "@/lib/store";

interface VapiArtifact {
  transcript?: string;
  messages?: Array<{ role: string; content: string }>;
}

interface VapiEndOfCallReport {
  type: "end-of-call-report";
  call: { id: string; [key: string]: unknown };
  artifact?: VapiArtifact;
  transcript?: string;
  messages?: Array<{ role: string; content: string }>;
}

interface VapiWebhookPayload {
  message: VapiEndOfCallReport | { type: string; [key: string]: unknown };
}

function extractTranscript(payload: VapiEndOfCallReport): string | null {
  // Vapi sends transcript at multiple possible locations
  if (payload.transcript) return payload.transcript;
  if (payload.artifact?.transcript) return payload.artifact.transcript;

  const messages = payload.messages ?? payload.artifact?.messages;
  if (messages && messages.length > 0) {
    return messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
  }

  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body: VapiWebhookPayload = await req.json();
  const { message } = body;

  // Only process end-of-call reports
  if (message.type !== "end-of-call-report") {
    return NextResponse.json({ received: true });
  }

  const report = message as VapiEndOfCallReport;
  const callId = report.call?.id;

  if (!callId) {
    return NextResponse.json({ error: "Missing call ID in webhook payload" }, { status: 400 });
  }

  const transcript = extractTranscript(report);
  if (!transcript) {
    return NextResponse.json({ error: "No transcript in webhook payload" }, { status: 400 });
  }

  // Persist transcript immediately so it's available even if analysis fails
  saveTranscript(callId, transcript);

  // Run analysis asynchronously — don't block the webhook response
  analyzeSentiment(transcript)
    .then((analysis) => saveAnalysis(callId, analysis))
    .catch((err) => console.error(`Sentiment analysis failed for call ${callId}:`, err));

  return NextResponse.json({ received: true, callId });
}
