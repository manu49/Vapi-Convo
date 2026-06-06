import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

import { analyzeSentiment } from "../lib/sentiment";

const SAMPLE_TRANSCRIPT = `AI Agent: Hello, thank you for calling TechSupport. My name is Alex. How can I help you today?
Customer: Hi, yes, I've been having this issue for like three days now and I'm really frustrated. My internet keeps dropping every couple of hours and I work from home so this is a huge problem for me.
AI Agent: I completely understand how disruptive that must be, especially when you're working from home. I'm sorry you've been dealing with this for three days. Let me pull up your account and we'll get to the bottom of this right away.
Customer: Thank you. I've already called twice before and nobody could fix it. I'm really at my limit here.
AI Agent: I hear you, and I apologize for the repeated inconvenience. You shouldn't have to call multiple times for the same issue. I can see your previous tickets here. It looks like the earlier technicians suggested a router restart, but that clearly hasn't resolved it. Let me dig deeper into the line diagnostics.
Customer: Yeah the restart thing didn't work at all. It just keeps dropping.
AI Agent: I can see some signal fluctuations on your line that weren't flagged before. This looks like it could be an issue with the node serving your neighborhood. I'm going to escalate this to our network team for a line inspection. In the meantime, I'd like to send you a temporary signal booster at no charge.
Customer: Oh really? That would actually be really helpful. So when would the network team come out?
AI Agent: I can schedule them for tomorrow between 9 AM and noon, or the day after in the afternoon — whichever works better for you.
Customer: Tomorrow morning works. That's great.
AI Agent: Perfect, I've got that booked. You'll get a confirmation text in the next few minutes. The signal booster will arrive by end of day today via courier. Is there anything else I can help you with?
Customer: No, that's actually really reassuring. Thank you for actually doing something this time. I appreciate it.
AI Agent: Of course, you deserve a reliable connection. I've also added a note to your account so if you call again, any agent will have full context. Have a great rest of your day!
Customer: Thanks, you too. Bye.`;

async function main() {
  console.log("Running sentiment analysis on sample transcript...\n");
  console.log("Transcript length:", SAMPLE_TRANSCRIPT.length, "chars\n");

  try {
    const analysis = await analyzeSentiment(SAMPLE_TRANSCRIPT);
    console.log("=== SENTIMENT ANALYSIS RESULT ===\n");
    console.log(JSON.stringify(analysis, null, 2));

    console.log("\n=== SUMMARY ===");
    console.log("Overall Sentiment:", analysis.overallSentiment);
    console.log("Sentiment Score:", analysis.sentimentScore);
    console.log("Customer Satisfaction:", analysis.customerSatisfactionScore, "/ 10");
    console.log("Agent Performance:", analysis.agentPerformance);
    console.log("Summary:", analysis.summary);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
