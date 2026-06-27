"use client";

import { useState, useCallback, useRef } from "react";
import { Search, CreditCard, AlertTriangle, ClipboardList, Copyright, Timer, type LucideIcon } from "lucide-react";
import ResultsDashboard from "@/components/ResultsDashboard";
import ScanningOverlay from "@/components/ScanningOverlay";

export interface AnalysisResult {
  overallScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  sections: {
    name: string;
    score: number;
    status: "safe" | "warning" | "danger";
    findings: string[];
  }[];
  redFlags: {
    severity: "critical" | "high" | "medium" | "low";
    category?: "contractual" | "technical";
    title: string;
    detail: string;
    recommendation: string;
  }[];
  missingClauses: string[];
  questionsToAsk: string[];
  vendorStrengths: string[];
  serviceCompleteness?: {
    detectedServiceType: string;
    score: number;
    status: "safe" | "warning" | "danger";
    summary: string;
    coveredAreas: string[];
    gaps: string[];
  };
  truncated?: boolean;
}

const SCAN_ITEMS: { icon: LucideIcon; label: string; desc: string }[] = [
  { icon: Search, label: "Scope Clarity", desc: "Vague deliverables, undefined revision limits, and scope creep traps" },
  { icon: CreditCard, label: "Payment Terms", desc: "Net-90 delays, missing deposits, ambiguous milestone triggers" },
  { icon: AlertTriangle, label: "Red Flag Language", desc: "Weasel words like 'reasonable', 'as needed', 'client's discretion'" },
  { icon: ClipboardList, label: "Missing Clauses", desc: "Discovery phase, change request process, termination rights" },
  { icon: Copyright, label: "IP Ownership", desc: "Ownership before payment, background IP grabs, broad licensing" },
  { icon: Timer, label: "Timeline Realism", desc: "Promises of fast + cheap + quality — flagged when all three appear" },
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === "application/pdf") {
      setFile(dropped);
      setError(null);
    } else {
      setError("Please upload a PDF file.");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setError(null);
    } else if (selected) {
      setError("Please upload a PDF file.");
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setIsScanning(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }
      const data = await res.json();
      setResults(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResults(null);
    setError(null);
    setEmailSubmitted(false);
    setEmail("");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSubmitted(true);
  };

  if (isScanning) return <ScanningOverlay fileName={file?.name || ""} />;
  if (results) return (
    <ResultsDashboard
      results={results}
      fileName={file?.name || ""}
      onReset={handleReset}
      email={email}
      setEmail={setEmail}
      emailSubmitted={emailSubmitted}
      onEmailSubmit={handleEmailSubmit}
    />
  );

  return (
    <main style={{ minHeight: "100vh", background: "var(--navy)", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--navy-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 32, height: 32, background: "var(--amber)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 2h9l3 3v11H3V2z" stroke="#0A0F1E" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
              <path d="M12 2v4h4" stroke="#0A0F1E" strokeWidth="1.5" fill="none"/>
              <path d="M6 8h6M6 11h4" stroke="#0A0F1E" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
            Prop<span style={{ color: "var(--amber)" }}>Scan</span>
          </span>
        </div>
        <a href="https://codeq.tech" target="_blank" rel="noopener noreferrer" style={{ color: "var(--slate)", fontSize: 13, fontFamily: "'Inter', sans-serif", textDecoration: "none" }}>
          by codeq.tech ↗
        </a>
      </header>

      <section style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px 40px" }}>
        <div style={{ maxWidth: 640, width: "100%", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245, 166, 35, 0.1)", border: "1px solid rgba(245, 166, 35, 0.25)", borderRadius: 100, padding: "6px 14px", marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--amber)", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "var(--amber)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
              Free AI Audit — No Account Needed
            </span>
          </div>

          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(36px, 6vw, 58px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: 20, color: "#fff" }}>
            Upload the proposal.<br />
            <span style={{ color: "var(--amber)" }}>Know what you&apos;re</span><br />
            signing before you sign it.
          </h1>

          <p style={{ color: "var(--slate)", fontSize: 17, lineHeight: 1.65, marginBottom: 48, fontFamily: "'Inter', sans-serif" }}>
            PropScan audits vendor proposals for missing clauses, payment risks, scope gaps, and IP issues — in under 60 seconds.
          </p>

          <div
            className={`drop-zone${isDragOver ? " drag-over" : ""}`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => inputRef.current?.click()}
            style={{ borderRadius: 16, padding: "48px 32px", cursor: "pointer", position: "relative", overflow: "hidden", marginBottom: 16 }}
          >
            <input ref={inputRef} type="file" accept=".pdf" onChange={handleFileChange} style={{ display: "none" }} />
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(42,58,92,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(42,58,92,0.2) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
            {file ? (
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#22C55E" strokeWidth="1.5"/>
                    <path d="M14 2v6h6M9 13l2 2 4-4" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ color: "#22C55E", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{file.name}</p>
                <p style={{ color: "var(--slate)", fontSize: 13 }}>{(file.size / 1024).toFixed(0)} KB — Click to change</p>
              </div>
            ) : (
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 15V3m0 0L8 7m4-4l4 4" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Drop your proposal PDF here</p>
                <p style={{ color: "var(--slate)", fontSize: 13 }}>or click to browse — PDF only, up to 10MB</p>
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: "rgba(255,59,59,0.1)", border: "1px solid rgba(255,59,59,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#FF3B3B", fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={!file}
            style={{ width: "100%", padding: "16px 32px", borderRadius: 10, border: "none", background: file ? "var(--amber)" : "var(--navy-border)", color: file ? "#0A0F1E" : "var(--slate)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, cursor: file ? "pointer" : "not-allowed", letterSpacing: "-0.01em", transition: "all 0.2s ease", marginBottom: 16 }}
          >
            {file ? "Run Forensic Audit →" : "Upload a PDF to begin"}
          </button>

          <p style={{ color: "var(--slate)", fontSize: 12, fontFamily: "'Inter', sans-serif" }}>
            Your file is analysed and immediately discarded. Nothing is stored.
          </p>
        </div>
      </section>

      <section style={{ padding: "40px 24px 60px", maxWidth: 900, margin: "0 auto", width: "100%" }}>
        <p style={{ textAlign: "center", color: "var(--slate)", fontSize: 11, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 28 }}>
          What we scan for
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {SCAN_ITEMS.map((item, i) => (
            <div key={i} className="section-card" style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <item.icon size={18} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{item.label}</p>
                <p style={{ color: "var(--slate)", fontSize: 12, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--navy-border)", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
        <span style={{ color: "var(--slate)", fontSize: 12 }}>
          © 2026 PropScan · A free tool by{" "}
          <a href="https://codeq.tech" target="_blank" rel="noopener noreferrer" style={{ color: "var(--amber)", textDecoration: "none" }}>codeq.tech</a>
        </span>
        <span style={{ color: "var(--slate)", fontSize: 12 }}>Not legal advice. Use alongside a lawyer for high-stakes contracts.</span>
      </footer>
    </main>
  );
}
