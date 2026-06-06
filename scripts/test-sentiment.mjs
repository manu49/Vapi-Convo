import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envContent = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
for (const line of envContent.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
}

const { createAnthropic } = await import("@ai-sdk/anthropic");
const { generateObject } = await import("ai");
const { z } = await import("zod");

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SentimentSchema = z.object({
  overallSentiment: z.enum(["positive", "negative", "neutral", "mixed"]),
  sentimentScore: z.number().min(-1).max(1),
  emotionalJourney: z.array(z.object({
    timestamp: z.string(),
    emotion: z.string(),
    intensity: z.number().min(0).max(1),
  })),
  turnByTurnAnalysis: z.array(z.object({
    speaker: z.string(),
    text: z.string(),
    sentiment: z.enum(["positive", "negative", "neutral", "mixed"]),
    score: z.number().min(-1).max(1),
  })),
  keyTopics: z.array(z.string()),
  customerSatisfactionScore: z.number().min(1).max(10),
  agentPerformance: z.object({
    empathy: z.number().min(1).max(10),
    clarity: z.number().min(1).max(10),
    resolution: z.number().min(1).max(10),
  }),
  summary: z.string(),
  actionableInsights: z.array(z.string()),
});

const TRANSCRIPT = `AI: Hi. This is a quick reminder about your upcoming appointments. you have a minute?
User: Yes. Sure.
AI: Great. Thanks. Just to confirm I have the right person, can I get your first name?
User: Manopreya
AI: Perfect. Thank you, Maniprea. And just to verify, what's your date of birth?
User: March first two thousand.
AI: Got it. March first two thousand. Thanks for confirming. So I'm calling to remind you about your upcoming appointment. Can you tell me, do you happen to remember what date and time your appointment is scheduled for?
User: No, I don't.
AI: No problem. Let me pull that up for you. Just give me one second. Actually, I apologize. I don't have your appointment details in front of me right now. Can you tell me what type of appointment this is for? Or do you remember roughly when it might be coming up like, this week or next week.
User: next week.
AI: Okay. Next week. And do you remember what the appointment is for, like, a doctor's visit, dental, haircut, something else?
User: Ten two.
AI: I'm sorry. I didn't quite catch that. Could you say that
User: dental
AI: Got it. a dental appointment next week. Perfect. So what I'm going to do is pass along your information to our team so they can send you the exact date and time details for your dental appointment. They'll get back to you with all those specifics. In the meantime, is next week still working for you? or would you need to reschedule?
User: It works.
AI: Excellent. So to confirm your dental appointment next week works for your schedule. Our team will be reaching out to you with the exact date and time details. You should expect to hear from us shortly with all those specifics. Is there anything else I should note? or a a best number to reach you at? if the team needs to contact you.
User: Yes. So the phone number would be four one two nine eight three eight three six bill.
AI: Perfect. So that's for one two nine eight three eight eight three six. Let me repeat that back to make sure I have it right. Four one two nine eight three eight eight three six. Is that correct?
User: Okay. Yes.
AI: Great. So, uh, just to recap,
User: To find out any`;

console.log("Running sentiment analysis on real call transcript (019e99da)...\n");

const { object } = await generateObject({
  model: anthropic("claude-haiku-4-5-20251001"),
  schema: SentimentSchema,
  messages: [{
    role: "user",
    content: `Analyze the sentiment of the following voice call transcript. This is an outbound appointment reminder call.\n\nTranscript:\n${TRANSCRIPT}`,
  }],
});

console.log("=== FULL RESULT ===\n");
console.log(JSON.stringify(object, null, 2));
console.log("\n--- Quick Summary ---");
console.log("Overall Sentiment:", object.overallSentiment, `(score: ${object.sentimentScore})`);
console.log("Customer Satisfaction:", object.customerSatisfactionScore, "/ 10");
console.log("Agent Performance:", JSON.stringify(object.agentPerformance));
console.log("Key Topics:", object.keyTopics.join(", "));
console.log("\nSummary:", object.summary);
