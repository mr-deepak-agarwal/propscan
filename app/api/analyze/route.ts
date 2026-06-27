import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";
export const maxDuration = 60;

const ANALYSIS_PROMPT = `You are a forensic proposal auditor with 20 years of experience reviewing vendor contracts and proposals. You have seen every trick vendors use to exploit clients — vague scope, payment traps, IP grabs, missing discovery phases, and unrealistic timelines.

Analyse the following proposal document text and return a JSON object with this exact structure. Be specific, direct, and genuinely useful. Do NOT be generic. Reference actual text from the proposal where possible.

Return ONLY valid JSON with no markdown, no preamble, no backticks.

{
  "overallScore": <integer 0-100, where 100 = perfect proposal, 0 = complete disaster>,
  "riskLevel": <"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">,
  "summary": <2-3 sentence plain English summary of what this proposal gets right and wrong>,
  "sections": [
    {
      "name": <one of: "Scope Definition" | "Payment Terms" | "Timeline & Delivery" | "IP & Ownership" | "Legal Protections" | "Transparency">,
      "score": <integer 0-100>,
      "status": <"safe" | "warning" | "danger">,
      "findings": [<specific finding strings, 1-3 items>]
    }
  ],
  "redFlags": [
    {
      "severity": <"critical" | "high" | "medium" | "low">,
      "title": <short flag title, max 8 words>,
      "detail": <2-3 sentence explanation of why this is dangerous, referencing specific proposal language if found>,
      "recommendation": <specific action the client should take or demand>
    }
  ],
  "missingClauses": [<list of important clauses absent from the proposal, be specific>],
  "questionsToAsk": [<5-8 pointed questions the client should ask the vendor before signing>],
  "vendorStrengths": [<genuine positives found in the proposal, 2-4 items, or empty array if none>]
}

Scoring guide:
- 85-100: Excellent, professional proposal with clear terms
- 65-84: Good with minor gaps
- 45-64: Concerning — significant issues need addressing
- 25-44: High risk — major red flags, negotiate hard or walk away  
- 0-24: Critical — do not sign without complete renegotiation

Red flag severity:
- critical: Could result in financial loss, IP theft, or project failure with no recourse
- high: Significant risk requiring mandatory negotiation
- medium: Should be clarified or modified before signing
- low: Minor issue, worth noting but not a dealbreaker

Be blunt. If this is a bad proposal, say so clearly. If it's a good one, acknowledge that too.`;

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } catch {
    throw new Error("Could not read PDF. Please ensure it is a text-based PDF, not a scanned image.");
  } finally {
    await parser.destroy();
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
    }

    // Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const proposalText = await extractTextFromPDF(buffer);

    if (!proposalText || proposalText.trim().length < 100) {
      return NextResponse.json({ error: "Could not extract text from PDF. It may be a scanned image — please use a text-based PDF." }, { status: 400 });
    }

    // Truncate to avoid token limits (keep first ~8000 chars which is ~2000 tokens)
    const MAX_CHARS = 8000;
    const truncatedText = proposalText.slice(0, MAX_CHARS);
    const wasTruncated = proposalText.length > MAX_CHARS;

    // Call the Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API configuration error" }, { status: 500 });
    }

    const GEMINI_MODEL = "gemini-2.5-flash";
    const callGemini = () =>
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${ANALYSIS_PROMPT}\n\n---PROPOSAL TEXT START---\n${truncatedText}\n---PROPOSAL TEXT END---`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      });

    // One retry on transient failure (network blip / 5xx) before giving up
    let response = await callGemini();
    if (!response.ok && response.status >= 500) {
      response = await callGemini();
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Gemini API error:", errorBody);
      return NextResponse.json({ error: "Analysis service unavailable. Please try again." }, { status: 500 });
    }

    const geminiData = await response.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON from Gemini's response
    let analysisResult;
    try {
      // Strip any markdown fences, in case the model adds them anyway
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysisResult = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini response:", rawText.slice(0, 500));
      return NextResponse.json({ error: "Failed to parse analysis results. Please try again." }, { status: 500 });
    }

    if (wasTruncated) {
      analysisResult.truncated = true;
    }

    // Validate required fields
    if (!analysisResult.overallScore || !analysisResult.riskLevel || !analysisResult.sections) {
      return NextResponse.json({ error: "Incomplete analysis received. Please try again." }, { status: 500 });
    }

    return NextResponse.json(analysisResult);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error occurred";
    console.error("PropScan API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
