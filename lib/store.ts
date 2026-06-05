import { SentimentAnalysis } from "./sentiment";

interface CallRecord {
  callId: string;
  transcript: string;
  analysis?: SentimentAnalysis;
  analyzedAt?: Date;
  receivedAt: Date;
}

// In-memory store — replace with a database (e.g. Postgres, Redis) for production
const store = new Map<string, CallRecord>();

export function saveTranscript(callId: string, transcript: string): void {
  const existing = store.get(callId);
  store.set(callId, {
    callId,
    transcript,
    analysis: existing?.analysis,
    analyzedAt: existing?.analyzedAt,
    receivedAt: existing?.receivedAt ?? new Date(),
  });
}

export function saveAnalysis(callId: string, analysis: SentimentAnalysis): void {
  const existing = store.get(callId);
  if (!existing) throw new Error(`No record found for callId: ${callId}`);
  store.set(callId, { ...existing, analysis, analyzedAt: new Date() });
}

export function getRecord(callId: string): CallRecord | undefined {
  return store.get(callId);
}

export function getTranscript(callId: string): string | undefined {
  return store.get(callId)?.transcript;
}

export function getAnalysis(callId: string): SentimentAnalysis | undefined {
  return store.get(callId)?.analysis;
}
