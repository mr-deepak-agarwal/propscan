import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropScan — AI Proposal Health Check",
  description: "Upload any vendor proposal. Get an instant forensic audit — red flags, missing clauses, payment traps, and a risk score. Free, by codeq.",
  openGraph: {
    title: "PropScan — AI Proposal Health Check",
    description: "Upload a vendor proposal and get an instant, AI-powered risk audit before you sign.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
