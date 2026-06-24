import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orchestrator — Multi-Agent Debate Platform",
  description:
    "Live multi-agent debate and idea generation platform. Agents with real tools, streaming responses, and collaborative intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
