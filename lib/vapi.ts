const VAPI_BASE_URL = "https://api.vapi.ai";

interface VapiMessage {
  role: string;
  content: string;
  time?: number;
}

interface VapiCall {
  id: string;
  transcript?: string;
  messages?: VapiMessage[];
  status: string;
  endedAt?: string;
}

export async function fetchCallTranscript(callId: string): Promise<string> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) throw new Error("VAPI_API_KEY is not set");

  const response = await fetch(`${VAPI_BASE_URL}/call/${callId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vapi API error ${response.status}: ${body}`);
  }

  const call: VapiCall = await response.json();

  if (call.transcript) return call.transcript;

  // Build transcript from messages array as fallback
  if (call.messages && call.messages.length > 0) {
    return call.messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");
  }

  throw new Error(`No transcript available for call ${callId}. Call status: ${call.status}`);
}
