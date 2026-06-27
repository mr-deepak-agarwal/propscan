"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, MessageCircleQuestion, CheckCircle2, Info, Wrench } from "lucide-react";
import type { AnalysisResult } from "@/app/page";

interface Props {
  results: AnalysisResult;
  fileName: string;
  onReset: () => void;
  email: string;
  setEmail: (v: string) => void;
  emailSubmitted: boolean;
  onEmailSubmit: (e: React.FormEvent) => void;
}

const SEVERITY_CONFIG = {
  critical: { label: "CRITICAL", color: "#FF3B3B", bg: "rgba(255,59,59,0.12)", border: "rgba(255,59,59,0.3)" },
  high: { label: "HIGH", color: "#FBBF24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)" },
  medium: { label: "MEDIUM", color: "#F5A623", bg: "rgba(245,166,35,0.1)", border: "rgba(245,166,35,0.25)" },
  low: { label: "LOW", color: "#22C55E", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)" },
};

const CATEGORY_CONFIG = {
  contractual: { label: "CONTRACT", color: "#A78BFA" },
  technical: { label: "TECHNICAL", color: "#38BDF8" },
};

const RISK_CONFIG = {
  LOW: { color: "#22C55E", label: "Low Risk", bg: "rgba(34,197,94,0.12)" },
  MEDIUM: { color: "#F5A623", label: "Medium Risk", bg: "rgba(245,166,35,0.1)" },
  HIGH: { color: "#FBBF24", label: "High Risk", bg: "rgba(251,191,36,0.12)" },
  CRITICAL: { color: "#FF3B3B", label: "Critical Risk", bg: "rgba(255,59,59,0.12)" },
};

function ScoreRing({ score, size = 120, color }: { score: number; size?: number; color: string }) {
  const [animScore, setAnimScore] = useState(0);
  const r = size * 0.4;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (animScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--navy-border)" strokeWidth={size * 0.07} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={size * 0.07}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: size * 0.22, color, lineHeight: 1 }}>
          {animScore}
        </span>
        <span style={{ fontSize: size * 0.1, color: "var(--slate)", fontFamily: "'Inter', sans-serif" }}>/ 100</span>
      </div>
    </div>
  );
}

function StatusBar({ score, status }: { score: number; status: "safe" | "warning" | "danger" }) {
  const [anim, setAnim] = useState(0);
  const color = status === "safe" ? "#22C55E" : status === "warning" ? "#FBBF24" : "#FF3B3B";
  useEffect(() => { const t = setTimeout(() => setAnim(score), 300); return () => clearTimeout(t); }, [score]);
  return (
    <div style={{ height: 4, borderRadius: 100, background: "var(--navy-border)", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${anim}%`, background: color, borderRadius: 100, transition: "width 1s ease" }} />
    </div>
  );
}

export default function ResultsDashboard({ results, fileName, onReset, email, setEmail, emailSubmitted, onEmailSubmit }: Props) {
  const riskCfg = RISK_CONFIG[results.riskLevel];
  const criticalCount = results.redFlags.filter(f => f.severity === "critical").length;
  const highCount = results.redFlags.filter(f => f.severity === "high").length;
  const [expandedFlag, setExpandedFlag] = useState<number | null>(null);

  return (
    <main style={{ minHeight: "100vh", background: "var(--navy)" }}>
      {/* Header */}
      <header style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--navy-border)", position: "sticky", top: 0, background: "rgba(10,15,30,0.95)", backdropFilter: "blur(12px)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "var(--amber)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
              <path d="M3 2h9l3 3v11H3V2z" stroke="#0A0F1E" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
              <path d="M12 2v4h4" stroke="#0A0F1E" strokeWidth="1.5" fill="none"/>
              <path d="M6 8h6M6 11h4" stroke="#0A0F1E" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>
            Prop<span style={{ color: "var(--amber)" }}>Scan</span>
          </span>
          <span style={{ color: "var(--navy-border)", margin: "0 4px" }}>·</span>
          <span style={{ color: "var(--slate)", fontSize: 13, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</span>
        </div>
        <button onClick={onReset} style={{ background: "var(--navy-card)", border: "1px solid var(--navy-border)", borderRadius: 8, padding: "8px 16px", color: "#fff", fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, cursor: "pointer" }}>
          ← New Scan
        </button>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>

        {/* Hero score section */}
        <div className="section-card slide-up" style={{ padding: "32px", marginBottom: 24, display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 32, alignItems: "center" }}>
          <ScoreRing score={results.overallScore} size={130} color={riskCfg.color} />

          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: riskCfg.bg, border: `1px solid ${riskCfg.color}40`, borderRadius: 100, padding: "4px 12px", marginBottom: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: riskCfg.color, display: "inline-block" }} />
              <span style={{ fontSize: 11, color: riskCfg.color, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: "0.1em" }}>
                {riskCfg.label}
              </span>
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(20px, 3vw, 28px)", letterSpacing: "-0.02em", marginBottom: 10, lineHeight: 1.2 }}>
              Proposal Health Score: <span style={{ color: riskCfg.color }}>{results.overallScore}/100</span>
            </h1>
            <p style={{ color: "var(--slate)", fontSize: 14, lineHeight: 1.6, maxWidth: 500 }}>{results.summary}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 130 }}>
            <div style={{ textAlign: "center", padding: "14px 20px", background: criticalCount > 0 ? "rgba(255,59,59,0.1)" : "var(--navy)", border: `1px solid ${criticalCount > 0 ? "rgba(255,59,59,0.3)" : "var(--navy-border)"}`, borderRadius: 10 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, color: criticalCount > 0 ? "#FF3B3B" : "var(--slate)" }}>{criticalCount}</div>
              <div style={{ fontSize: 11, color: "var(--slate)", letterSpacing: "0.05em" }}>CRITICAL</div>
            </div>
            <div style={{ textAlign: "center", padding: "14px 20px", background: highCount > 0 ? "rgba(251,191,36,0.08)" : "var(--navy)", border: `1px solid ${highCount > 0 ? "rgba(251,191,36,0.3)" : "var(--navy-border)"}`, borderRadius: 10 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, color: highCount > 0 ? "#FBBF24" : "var(--slate)" }}>{highCount}</div>
              <div style={{ fontSize: 11, color: "var(--slate)", letterSpacing: "0.05em" }}>HIGH RISK</div>
            </div>
          </div>
        </div>

        {results.truncated && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 12, color: "var(--slate)" }}>
            <Info size={15} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>This document was long enough that only the first portion was analysed. Results above may not reflect clauses later in the proposal.</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          {/* Section scores */}
          <div className="section-card" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20, letterSpacing: "-0.01em" }}>
              Section Breakdown
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {results.sections.map((s, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{s.name}</span>
                    <span style={{ fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: s.status === "safe" ? "#22C55E" : s.status === "warning" ? "#FBBF24" : "#FF3B3B" }}>
                      {s.score}/100
                    </span>
                  </div>
                  <StatusBar score={s.score} status={s.status} />
                  {s.findings.length > 0 && (
                    <ul style={{ marginTop: 8, paddingLeft: 0, listStyle: "none" }}>
                      {s.findings.slice(0, 2).map((f, j) => (
                        <li key={j} style={{ fontSize: 11, color: "var(--slate)", lineHeight: 1.5, display: "flex", gap: 6, alignItems: "flex-start" }}>
                          <span style={{ color: s.status === "danger" ? "#FF3B3B" : "var(--amber)", flexShrink: 0, marginTop: 1 }}>›</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Missing Clauses + Strengths */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {results.missingClauses.length > 0 && (
              <div className="section-card" style={{ padding: 24 }}>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={16} color="var(--danger)" /> Missing Clauses
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {results.missingClauses.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 12px", background: "rgba(255,59,59,0.06)", border: "1px solid rgba(255,59,59,0.15)", borderRadius: 8 }}>
                      <span style={{ color: "#FF3B3B", fontSize: 14, flexShrink: 0 }}>✕</span>
                      <span style={{ fontSize: 12, color: "#ccc", lineHeight: 1.5 }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {results.vendorStrengths.length > 0 && (
              <div className="section-card" style={{ padding: 24 }}>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 size={16} color="#22C55E" /> What Looks Good
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {results.vendorStrengths.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 12px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 8 }}>
                      <span style={{ color: "#22C55E", fontSize: 14, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 12, color: "#ccc", lineHeight: 1.5 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Service Completeness — is the actual proposed work technically sound & complete */}
        {results.serviceCompleteness && (
          <div
            className="section-card"
            style={{
              padding: 24,
              marginBottom: 24,
              border: `1px solid ${
                results.serviceCompleteness.status === "safe"
                  ? "rgba(34,197,94,0.25)"
                  : results.serviceCompleteness.status === "warning"
                  ? "rgba(251,191,36,0.25)"
                  : "rgba(255,59,59,0.25)"
              }`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8 }}>
                <Wrench size={16} color="#38BDF8" /> Service Completeness — {results.serviceCompleteness.detectedServiceType}
              </h2>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  color:
                    results.serviceCompleteness.status === "safe"
                      ? "#22C55E"
                      : results.serviceCompleteness.status === "warning"
                      ? "#FBBF24"
                      : "#FF3B3B",
                }}
              >
                {results.serviceCompleteness.score}/100
              </span>
            </div>

            <StatusBar score={results.serviceCompleteness.score} status={results.serviceCompleteness.status} />

            <p style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6, margin: "16px 0 20px" }}>
              {results.serviceCompleteness.summary}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {results.serviceCompleteness.coveredAreas.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: "#22C55E", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 10 }}>
                    WHAT&apos;S COVERED
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {results.serviceCompleteness.coveredAreas.map((a, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: "#ccc", lineHeight: 1.5 }}>
                        <span style={{ color: "#22C55E", flexShrink: 0 }}>✓</span>
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.serviceCompleteness.gaps.length > 0 ? (
                <div>
                  <p style={{ fontSize: 11, color: "#FF3B3B", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 10 }}>
                    GAPS A DOMAIN EXPERT WOULD FLAG
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {results.serviceCompleteness.gaps.map((g, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: "#ccc", lineHeight: 1.5 }}>
                        <span style={{ color: "#FF3B3B", flexShrink: 0 }}>✕</span>
                        {g}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 11, color: "#22C55E", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 10 }}>
                    GAPS
                  </p>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: "#ccc", lineHeight: 1.5 }}>
                    <CheckCircle2 size={14} color="#22C55E" style={{ flexShrink: 0, marginTop: 1 }} />
                    No significant gaps found — this plan appears to cover what&apos;s expected for the stated goals.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Red Flags */}
        {results.redFlags.length > 0 && (
          <div className="section-card" style={{ padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldAlert size={16} color="var(--danger)" /> Red Flags Detected ({results.redFlags.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {results.redFlags.map((flag, i) => {
                const cfg = SEVERITY_CONFIG[flag.severity];
                const isExpanded = expandedFlag === i;
                return (
                  <div
                    key={i}
                    onClick={() => setExpandedFlag(isExpanded ? null : i)}
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s ease" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: cfg.color, background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`, borderRadius: 4, padding: "2px 8px", letterSpacing: "0.08em" }}>
                          {cfg.label}
                        </span>
                        {flag.category && (
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontWeight: 700,
                              color: CATEGORY_CONFIG[flag.category].color,
                              background: `${CATEGORY_CONFIG[flag.category].color}1A`,
                              border: `1px solid ${CATEGORY_CONFIG[flag.category].color}40`,
                              borderRadius: 4,
                              padding: "2px 8px",
                              letterSpacing: "0.08em",
                            }}
                          >
                            {CATEGORY_CONFIG[flag.category].label}
                          </span>
                        )}
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: "#fff" }}>{flag.title}</span>
                      </div>
                      <span style={{ color: "var(--slate)", fontSize: 18, transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>⌄</span>
                    </div>
                    {isExpanded && (
                      <div className="fade-in" style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${cfg.border}` }}>
                        <p style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6, marginBottom: 12 }}>{flag.detail}</p>
                        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "10px 14px" }}>
                          <p style={{ fontSize: 11, color: "var(--amber)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 4 }}>RECOMMENDATION</p>
                          <p style={{ fontSize: 13, color: "#ddd", lineHeight: 1.5 }}>{flag.recommendation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Questions to ask */}
        {results.questionsToAsk.length > 0 && (
          <div className="section-card" style={{ padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8 }}>
              <MessageCircleQuestion size={16} color="var(--amber)" /> Questions to Ask Before You Sign
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
              {results.questionsToAsk.map((q, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "12px 14px", background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: 8 }}>
                  <span style={{ color: "var(--amber)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 12, flexShrink: 0, marginTop: 1 }}>Q{i + 1}</span>
                  <span style={{ fontSize: 13, color: "#ccc", lineHeight: 1.5 }}>{q}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA / Lead capture */}
        <div style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(10,15,30,0) 100%)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 16, padding: "32px", marginBottom: 24, textAlign: "center" }}>
          {!emailSubmitted ? (
            <>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 8, letterSpacing: "-0.02em" }}>
                Not confident in this proposal?
              </h3>
              <p style={{ color: "var(--slate)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                We build websites at codeq with clearly defined scope, fixed milestones, and transparent pricing.<br />
                Share your email and we&apos;ll get in touch to talk through your options.
              </p>
              <form onSubmit={onEmailSubmit} style={{ display: "flex", gap: 10, maxWidth: 400, margin: "0 auto" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: "1px solid var(--navy-border)", background: "var(--navy-card)", color: "#fff", fontFamily: "'Inter', sans-serif", fontSize: 14, outline: "none" }}
                />
                <button type="submit" style={{ padding: "12px 20px", borderRadius: 8, border: "none", background: "var(--amber)", color: "#0A0F1E", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Get in Touch
                </button>
              </form>
            </>
          ) : (
            <div>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Thanks! We&apos;ll be in touch soon.</h3>
              <p style={{ color: "var(--slate)", fontSize: 14 }}>Meanwhile — <a href="https://codeq.tech" target="_blank" rel="noopener noreferrer" style={{ color: "var(--amber)" }}>see how codeq works →</a></p>
            </div>
          )}
        </div>

        {/* Footer note */}
        <div style={{ textAlign: "center", paddingBottom: 32 }}>
          <button onClick={onReset} style={{ background: "none", border: "1px solid var(--navy-border)", borderRadius: 8, padding: "10px 24px", color: "var(--slate)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 16 }}>
            ← Scan Another Proposal
          </button>
          <p style={{ color: "var(--slate)", fontSize: 11 }}>
            PropScan is a free tool by <a href="https://codeq.tech" target="_blank" rel="noopener noreferrer" style={{ color: "var(--amber)" }}>codeq.tech</a> · Not legal advice
          </p>
        </div>
      </div>
    </main>
  );
}
