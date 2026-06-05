"use client";

import { useState } from "react";

interface CallSummary {
  customerName: string | null;
  dateOfBirth: string | null;
  appointmentType: string | null;
  appointmentTiming: string | null;
  outcome: "confirmed" | "rescheduled" | "cancelled" | "unknown";
  contactNumber: string | null;
  notes: string[];
}

interface SentimentResult {
  callId: string;
  analysis?: {
    overallSentiment: string;
    sentimentScore: number;
    customerSatisfactionScore: number;
    summary: string;
    keyTopics: string[];
    actionableInsights: string[];
    agentPerformance: { empathy: number; clarity: number; resolution: number };
    emotionalJourney: Array<{ timestamp: string; emotion: string; intensity: number }>;
    turnByTurnAnalysis: Array<{ speaker: string; text: string; sentiment: string; score: number }>;
    callSummary: CallSummary;
  };
  cached?: boolean;
  error?: string;
}

function ScoreBadge({ score, max = 10 }: { score: number; max?: number }) {
  const pct = max === 1 ? (score + 1) / 2 : score / max;
  const color = pct >= 0.7 ? "#16a34a" : pct >= 0.4 ? "#d97706" : "#dc2626";
  return (
    <span style={{ background: color, color: "#fff", padding: "2px 8px", borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
      {max === 10 ? `${score}/10` : score.toFixed(2)}
    </span>
  );
}

export default function Dashboard() {
  const [callId, setCallId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SentimentResult | null>(null);

  async function analyze() {
    if (!callId.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: callId.trim() }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ callId, error: "Request failed" });
    } finally {
      setLoading(false);
    }
  }

  const a = result?.analysis;

  return (
    <main style={{ maxWidth: 860, margin: "48px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Vapi Call Sentiment Analysis</h1>
      <p style={{ color: "#64748b", marginBottom: 32 }}>
        Enter a Vapi call ID to retrieve structured sentiment analysis, or configure the webhook at{" "}
        <code>/api/webhook/vapi</code> for automatic ingestion.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <input
          value={callId}
          onChange={(e) => setCallId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
          placeholder="Vapi Call ID"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 15 }}
        />
        <button
          onClick={analyze}
          disabled={loading || !callId.trim()}
          style={{ padding: "10px 24px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, cursor: "pointer", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {result?.error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: 16, color: "#b91c1c" }}>
          {result.error}
        </div>
      )}

      {a && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {result?.cached && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 14px", color: "#166534", fontSize: 13 }}>
              Loaded from cache
            </div>
          )}

          <section style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>Overview</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Overall Sentiment</div>
                <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{a.overallSentiment}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Sentiment Score</div>
                <ScoreBadge score={a.sentimentScore} max={1} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>CSAT</div>
                <ScoreBadge score={a.customerSatisfactionScore} />
              </div>
            </div>
            <p style={{ marginTop: 16, color: "#374151", lineHeight: 1.6 }}>{a.summary}</p>
          </section>

          {a.callSummary && (
            <section style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>Call Summary</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <tbody>
                  {(
                    [
                      ["Customer Name", a.callSummary.customerName],
                      ["Date of Birth", a.callSummary.dateOfBirth],
                      ["Appointment Type", a.callSummary.appointmentType],
                      ["Appointment Timing", a.callSummary.appointmentTiming],
                      ["Outcome", a.callSummary.outcome],
                      ["Contact Number", a.callSummary.contactNumber],
                    ] as [string, string | null][]
                  ).map(([label, value]) => (
                    <tr key={label} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 0", color: "#64748b", fontWeight: 500, width: 180, verticalAlign: "top" }}>{label}</td>
                      <td style={{ padding: "10px 0", color: value ? "#111827" : "#94a3b8", fontStyle: value ? "normal" : "italic" }}>
                        {value ?? "—"}
                      </td>
                    </tr>
                  ))}
                  {a.callSummary.notes.length > 0 && (
                    <tr>
                      <td style={{ padding: "10px 0", color: "#64748b", fontWeight: 500, verticalAlign: "top" }}>Notes</td>
                      <td style={{ padding: "10px 0" }}>
                        <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                          {a.callSummary.notes.map((n, i) => (
                            <li key={i} style={{ color: "#374151" }}>{n}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          )}

          <section style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>Agent Performance</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {(["empathy", "clarity", "resolution"] as const).map((k) => (
                <div key={k}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, textTransform: "capitalize" }}>{k}</div>
                  <ScoreBadge score={a.agentPerformance[k]} />
                </div>
              ))}
            </div>
          </section>

          <section style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Key Topics</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {a.keyTopics.map((t) => (
                <span key={t} style={{ background: "#eff6ff", color: "#1d4ed8", padding: "4px 10px", borderRadius: 20, fontSize: 13 }}>{t}</span>
              ))}
            </div>
          </section>

          <section style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Emotional Journey</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {a.emotionalJourney.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "#94a3b8", fontSize: 13, minWidth: 60 }}>{m.timestamp}</span>
                  <span style={{ fontWeight: 500 }}>{m.emotion}</span>
                  <div style={{ flex: 1, background: "#e2e8f0", borderRadius: 4, height: 8 }}>
                    <div style={{ width: `${m.intensity * 100}%`, background: "#6366f1", borderRadius: 4, height: 8 }} />
                  </div>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{(m.intensity * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </section>

          <section style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Actionable Insights</h2>
            <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              {a.actionableInsights.map((insight, i) => (
                <li key={i} style={{ color: "#374151", lineHeight: 1.5 }}>{insight}</li>
              ))}
            </ul>
          </section>

          <section style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Turn-by-Turn Analysis</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {a.turnByTurnAnalysis.map((t, i) => {
                const isAgent = t.speaker.toLowerCase().includes("agent") || t.speaker.toLowerCase().includes("assistant");
                return (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ minWidth: 70, fontSize: 12, fontWeight: 600, color: isAgent ? "#7c3aed" : "#0369a1", paddingTop: 3 }}>
                      {t.speaker.toUpperCase()}
                    </span>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: "#374151", fontSize: 14 }}>{t.text}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#94a3b8", paddingTop: 3 }}>{t.sentiment} ({t.score.toFixed(2)})</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
