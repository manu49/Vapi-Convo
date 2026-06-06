import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TurnSchema = z.object({
  speaker: z.string().describe("Speaker role: 'agent' or 'customer'"),
  text: z.string().describe("The spoken text"),
  sentiment: z.enum(["positive", "negative", "neutral", "mixed"]),
  score: z.number().min(-1).max(1).describe("Sentiment score from -1 (very negative) to 1 (very positive)"),
});

const EmotionalMomentSchema = z.object({
  timestamp: z.string().describe("Approximate timestamp or position in the conversation (e.g. 'early', '2:30', 'closing')"),
  emotion: z.string().describe("Detected emotion (e.g. frustration, relief, satisfaction, confusion)"),
  intensity: z.number().min(0).max(1).describe("Emotion intensity from 0 (subtle) to 1 (very strong)"),
});

const AgentPerformanceSchema = z.object({
  empathy: z.number().min(1).max(10).describe("Empathy score 1-10"),
  clarity: z.number().min(1).max(10).describe("Communication clarity score 1-10"),
  resolution: z.number().min(1).max(10).describe("Problem resolution effectiveness score 1-10"),
});

const SentimentSchema = z.object({
  overallSentiment: z.enum(["positive", "negative", "neutral", "mixed"]).describe("Overall sentiment of the entire call"),
  sentimentScore: z.number().min(-1).max(1).describe("Composite sentiment score from -1 to 1"),
  emotionalJourney: z.array(EmotionalMomentSchema).describe("Key emotional moments throughout the call"),
  turnByTurnAnalysis: z.array(TurnSchema).describe("Sentiment for each speaker turn"),
  keyTopics: z.array(z.string()).describe("Main topics discussed during the call"),
  customerSatisfactionScore: z.number().min(1).max(10).describe("Estimated customer satisfaction score 1-10"),
  agentPerformance: AgentPerformanceSchema,
  summary: z.string().describe("2-3 sentence summary of the call and its sentiment arc"),
  actionableInsights: z.array(z.string()).describe("Concrete recommendations based on sentiment patterns"),
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
        content: `Analyze the sentiment of the following voice call transcript. Provide a detailed, structured sentiment analysis covering the overall tone, emotional journey, per-turn sentiment, agent performance, and actionable insights.

Transcript:
${transcript}`,
      },
    ],
  });

  return object;
}
