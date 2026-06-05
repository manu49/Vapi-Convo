import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vapi Sentiment Analysis",
  description: "Structured sentiment analysis for Vapi voice agent calls",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: 0, background: "#f8fafc" }}>
        {children}
      </body>
    </html>
  );
}
