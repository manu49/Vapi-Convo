import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TurnSchema = z.object({
  speaker: z.string().describe("Speaker role: 'AI' or 'User'"),
  text: z.string().describe("The spoken text"),
  sentiment: z.enum(["positive", "negative", "neutral", "mixed"]),
  score: z.number().min(-1).max(1).describe("Sentiment score from -1 (very negative) to 1 (very positive)"),
});

const EmotionalMomentSchema = z.object({
  timestamp: z.string().describe("Approximate position in the conversation (e.g. 'early', 'mid', 'closing')"),
  emotion: z.string().describe("Detected emotion (e.g. frustration, relief, satisfaction, confusion)"),
  intensity: z.number().min(0).max(1).describe("Emotion intensity from 0 (subtle) to 1 (very strong)"),
});

const AgentPerformanceSchema = z.object({
  empathy: z.number().min(1).max(10).describe("Empathy score 1-10"),
  clarity: z.number().min(1).max(10).describe("Communication clarity score 1-10"),
  resolution: z.number().min(1).max(10).describe("Problem resolution effectiveness score 1-10"),
});

const CallSummarySchema = z.object({
  customerName: z.string().describe("Full name of the customer as mentioned in the call, or 'Unknown' if not stated"),
  contactNumber: z.string().describe("Phone number provided by the customer, or 'Not provided' if absent"),
  serviceRequested: z.string().describe("The service, appointment type, or reason for the call, or 'Not specified' if unclear"),
  appointmentDate: z.string().describe("Appointment date/time if mentioned, or 'Not specified'"),
  callOutcome: z.enum(["confirmed", "rescheduled", "cancelled", "escalated", "unresolved", "other"]).describe("Best match for how the call concluded — use 'other' if unclear"),
  actionableItems: z.array(z.string()).describe("Concrete follow-up tasks. Use an empty array if none."),
});

const SentimentSchema = z.object({
  callSummary: CallSummarySchema,
  overallSentiment: z.enum(["positive", "negative", "neutral", "mixed"]).describe("Overall sentiment of the entire call"),
  sentimentScore: z.number().min(-1).max(1).describe("Composite sentiment score from -1 to 1"),
  emotionalJourney: z.array(EmotionalMomentSchema).describe("Key emotional moments. Use an empty array if the call is too short to determine."),
  turnByTurnAnalysis: z.array(TurnSchema).describe("Sentiment for each speaker turn"),
  keyTopics: z.array(z.string()).describe("Main topics discussed. Use an empty array if unclear."),
  customerSatisfactionScore: z.number().min(1).max(10).describe("Estimated customer satisfaction 1-10. Use 5 if insufficient data."),
  agentPerformance: AgentPerformanceSchema,
  summary: z.string().describe("2-3 sentence summary of the call. If the call is very short or incomplete, summarize what was captured."),
  actionableInsights: z.array(z.string()).describe("Concrete recommendations. Use an empty array if the call provides insufficient data."),
});

export type SentimentAnalysis = z.infer<typeof SentimentSchema>;

export async function analyzeSentiment(transcript: string): Promise<SentimentAnalysis> {
  const { object } = await generateObject({
    model: anthropic("claude-haiku-4-5-20251001"),
    schema: SentimentSchema,
    temperature: 1,
    messages: [
      {
        role: "user",
        content: `Analyze the sentiment of the following voice call transcript. The call may be short, incomplete, or have unclear audio — do your best with the available content and use the fallback values described in the schema when information is missing.

Transcript:
${transcript}`,
      },
    ],
  });

  return object;
}
