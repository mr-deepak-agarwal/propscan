"use client";
import { useEffect, useState } from "react";

const SCAN_STEPS = [
  "Extracting document structure...",
  "Analysing scope definitions...",
  "Checking payment clauses...",
  "Scanning for vague language...",
  "Auditing IP ownership terms...",
  "Detecting missing clauses...",
  "Evaluating timeline promises...",
  "Generating risk report...",
];

export default function ScanningOverlay({ fileName }: { fileName: string }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < SCAN_STEPS.length - 1 ? s + 1 : s));
      setProgress((p) => Math.min(p + 100 / SCAN_STEPS.length, 95));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--navy)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      {/* Radar animation */}
      <div style={{ position: "relative", width: 120, height: 120, marginBottom: 40 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="55" stroke="var(--navy-border)" strokeWidth="1" fill="none" />
          <circle cx="60" cy="60" r="35" stroke="var(--navy-border)" strokeWidth="1" fill="none" />
          <circle cx="60" cy="60" r="15" stroke="var(--navy-border)" strokeWidth="1" fill="none" />
          <line x1="5" y1="60" x2="115" y2="60" stroke="var(--navy-border)" strokeWidth="1" />
          <line x1="60" y1="5" x2="60" y2="115" stroke="var(--navy-border)" strokeWidth="1" />
          <circle cx="60" cy="60" r="55" stroke="var(--amber)" strokeWidth="1.5" fill="none" strokeDasharray="345" strokeDashoffset="260" style={{ transformOrigin: "60px 60px", animation: "rotate 2s linear infinite" }} />
          <defs>
            <radialGradient id="sweep" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d="M60 60 L115 60 A55 55 0 0 0 60 5 Z" fill="url(#sweep)" style={{ transformOrigin: "60px 60px", animation: "rotate 2s linear infinite" }} />
        </svg>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 8, height: 8, borderRadius: "50%", background: "var(--amber)", boxShadow: "0 0 12px var(--amber)" }} />
      </div>

      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 8, letterSpacing: "-0.02em" }}>
        Scanning Proposal
      </h2>
      <p style={{ color: "var(--slate)", fontSize: 13, marginBottom: 32, maxWidth: 300, textAlign: "center" }}>
        {fileName}
      </p>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: 400, background: "var(--navy-card)", borderRadius: 100, height: 4, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "var(--amber)", borderRadius: 100, width: `${progress}%`, transition: "width 0.8s ease" }} />
      </div>

      {/* Steps */}
      <div style={{ maxWidth: 400, width: "100%" }}>
        {SCAN_STEPS.slice(0, step + 1).map((s, i) => (
          <div key={i} className="fade-in" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, opacity: i < step ? 0.5 : 1 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: i < step ? "rgba(34,197,94,0.15)" : "rgba(245,166,35,0.15)", border: `1px solid ${i < step ? "rgba(34,197,94,0.4)" : "rgba(245,166,35,0.4)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {i < step ? (
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              ) : (
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--amber)" }} />
              )}
            </div>
            <span style={{ fontSize: 13, color: i < step ? "var(--slate)" : "#fff", fontFamily: "'Inter', sans-serif" }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
