import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

export const runtime = "nodejs";
export const maxDuration = 60;

const ANALYSIS_PROMPT = `You are acting as TWO experts reviewing the same proposal:

1. A forensic proposal auditor with 20 years of experience reviewing vendor contracts. You have seen every trick vendors use to exploit clients — vague scope, payment traps, IP grabs, missing discovery phases, and unrealistic timelines. This persona judges CONTRACTUAL RISK: terms, ownership, payment, legal protection.

2. A senior domain expert in whatever specific service the proposal is selling (SEO, software development, marketing, design, construction, legal, consulting, etc). This persona judges TECHNICAL / SERVICE COMPLETENESS: is the proposed scope of work actually sufficient, current, and well-structured to achieve the client's stated goals? Would an expert in that field consider anything important missing, outdated, or under-scoped — regardless of how the contract terms read?

These two judgments are independent. A proposal can have excellent contract terms but a technically incomplete plan, or vice versa. Evaluate both honestly. If the technical/service plan genuinely covers everything a competent practitioner would include for the stated goals, say so plainly and score it well — do not invent gaps to seem thorough. If it is missing things a domain expert would expect, name them specifically.

Analyse the following proposal document text and return a JSON object with this exact structure. Be specific, direct, and genuinely useful. Do NOT be generic. Reference actual text from the proposal where possible.

Return ONLY valid JSON with no markdown, no preamble, no backticks.

{
  "overallScore": <integer 0-100, where 100 = perfect proposal, 0 = complete disaster. This should weigh BOTH contractual risk and service completeness>,
  "riskLevel": <"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">,
  "summary": <2-3 sentence plain English summary covering both the contractual quality AND whether the proposed work itself is technically sound and complete>,
  "sections": [
    {
      "name": <one of: "Scope Definition" | "Payment Terms" | "Timeline & Delivery" | "IP & Ownership" | "Legal Protections" | "Transparency">,
      "score": <integer 0-100>,
      "status": <"safe" | "warning" | "danger">,
      "findings": [<specific finding strings, MAXIMUM 3 items>]
    }
  ],
  "serviceCompleteness": {
    "detectedServiceType": <short label for the service being sold, e.g. "SEO & Digital Growth", "Software Development", "Brand Design">,
    "score": <integer 0-100, how complete and technically sound the proposed work plan is for achieving the stated goals, as judged by a domain expert in this service>,
    "status": <"safe" | "warning" | "danger">,
    "summary": <2-3 sentences: does this plan cover everything a domain expert would expect for these goals? Be direct — if it's genuinely thorough, say that clearly; if not, say what's missing>,
    "coveredAreas": [<specific things the plan DOES correctly include, that matter for this service type, MAXIMUM 6>],
    "gaps": [<specific things a domain expert would expect that are MISSING, outdated, or under-scoped for the stated goals — MAXIMUM 6, empty array if the plan is genuinely complete>]
  },
  "redFlags": [<the most important issues only, MAXIMUM 10 — prioritise by severity and real-world impact, do not pad with minor items>
    {
      "severity": <"critical" | "high" | "medium" | "low">,
      "category": <"contractual" | "technical" — "contractual" for legal/payment/IP/scope-language risks, "technical" for gaps or weaknesses in the actual proposed service work>,
      "title": <short flag title, max 8 words>,
      "detail": <2-3 sentence explanation of why this is dangerous, referencing specific proposal language if found>,
      "recommendation": <specific action the client should take or demand>
    }
  ],
  "missingClauses": [<list of important contractual clauses absent from the proposal, be specific, MAXIMUM 8>],
  "questionsToAsk": [<5-8 pointed questions the client should ask the vendor before signing, covering both contract terms AND technical/service gaps>],
  "vendorStrengths": [<genuine positives found in the proposal, MAXIMUM 5, or empty array if none>]
}

Scoring guide for overallScore:
- 85-100: Excellent — strong contract terms AND a technically complete, expert-level service plan
- 65-84: Good with minor gaps in either area
- 45-64: Concerning — significant issues in contract terms or service completeness (or both)
- 25-44: High risk — major red flags, negotiate hard or walk away
- 0-24: Critical — do not sign without complete renegotiation

Scoring guide for serviceCompleteness.score specifically (independent of contract terms):
- 85-100: A domain expert would consider this plan thorough and well-structured for the stated goals
- 65-84: Solid plan with a few notable gaps or outdated tactics
- 45-64: Several important elements missing or under-scoped for the goals stated
- 0-44: Plan is fundamentally incomplete, generic, or unlikely to achieve the stated goals as scoped

Red flag severity:
- critical: Could result in financial loss, IP theft, project failure, or wasted spend with no recourse
- high: Significant risk requiring mandatory negotiation or clarification
- medium: Should be clarified or modified before signing
- low: Minor issue, worth noting but not a dealbreaker

Be blunt in both directions. If the contract terms are bad, say so. If the technical plan is incomplete or generic for the stated goals, say so specifically — name what's missing the way a domain expert would. If everything is genuinely well covered, say that clearly too instead of manufacturing concerns.`;

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const uint8 = new Uint8Array(buffer);
    const pdf = await getDocumentProxy(uint8);
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  } catch (err) {
    console.error("unpdf extraction failed:", err);
    throw new Error("Could not read PDF. Please ensure it is a text-based PDF, not a scanned image.");
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

    // gemini-2.5-flash supports a ~1M token input context window, so there's
    // no need to aggressively truncate normal proposal documents. This cap
    // exists only to protect against pathologically large uploads (the file
    // size check above already caps at 10MB) driving up latency/cost — it
    // should essentially never trigger for a real vendor proposal.
    const MAX_CHARS = 150000;
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
            maxOutputTokens: 16384,
            responseMimeType: "application/json",
            thinkingConfig: {
              thinkingBudget: 0,
            },
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
    const candidate = geminiData.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text || "";
    const finishReason = candidate?.finishReason;

    if (finishReason === "MAX_TOKENS") {
      console.error("Gemini hit MAX_TOKENS. Raw text so far:", rawText.slice(0, 500));
      return NextResponse.json(
        { error: "Analysis response was too long and got cut off. Please try again." },
        { status: 500 }
      );
    }

    // Parse JSON from Gemini's response
    let analysisResult;
    try {
      // Strip any markdown fences, in case the model adds them anyway
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysisResult = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error(
        "Failed to parse Gemini response. Error:",
        parseErr,
        "Raw text:",
        rawText.slice(0, 1000)
      );
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
