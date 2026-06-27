# PropScan — AI Proposal Health Check

> Upload a vendor proposal. Get an instant, AI-powered risk audit before you sign.

A free AI-powered forensic audit tool for vendor proposals. Built by [codeq.tech](https://codeq.tech).

## What it does

Upload any vendor proposal PDF and PropScan will:
- Score it out of 100 across 6 key dimensions
- Flag critical, high, medium, and low risk issues
- Identify missing clauses (discovery phase, IP terms, exit clauses)
- Generate pointed questions to ask before signing
- Surface vendor strengths too — it's balanced, not just negative

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **AI:** Gemini 2.5 Flash via the Google Gemini API
- **PDF parsing:** `pdf-parse`
- **Icons:** `lucide-react`
- **Deploy:** Vercel (recommended)

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd propscan
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your key:

```bash
cp .env.example .env.local
```

```
GEMINI_API_KEY=AIza...
```

Get a free key from [Google AI Studio](https://aistudio.google.com/apikey). Gemini 2.5 Flash has a free tier with daily rate limits — fine for low-to-moderate traffic, but enable billing in AI Studio if you expect heavier usage.

### 3. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

```bash
vercel --prod
```

Add `GEMINI_API_KEY` in your Vercel project's Environment Variables.

## Deploy as subdomain

To deploy as `propscan.codeq.tech`:
1. Deploy to Vercel
2. Add custom domain `propscan.codeq.tech` in Vercel dashboard
3. Add CNAME record in your DNS: `propscan` → `cname.vercel-dns.com`

## File structure

```
app/
  page.tsx           # Main upload page
  layout.tsx         # App layout + metadata
  globals.css        # Design tokens + animations
  api/
    analyze/
      route.ts       # PDF parse + Gemini API call
components/
  ScanningOverlay.tsx   # Animated scanning screen
  ResultsDashboard.tsx  # Full results UI
```

## Customisation

- **Lead capture CTA:** The email field in `ResultsDashboard.tsx` currently just confirms submission in the UI — it does not send the email anywhere yet. Wire `handleEmailSubmit` in `app/page.tsx` to your CRM/Formspree/Resend before relying on it for real leads.
- **Branding:** Change "codeq.tech" references throughout
- **Analysis depth:** Modify `ANALYSIS_PROMPT` in `app/api/analyze/route.ts`

## Known limitations

- PDF must be text-based (not a scanned image) — OCR support is planned for a future version
- Proposal text is truncated to the first ~8,000 characters before analysis; very long documents may not be fully covered (the UI flags this when it happens)
- Files are processed in memory and immediately discarded — nothing stored
- Max file size: 10MB
- Analysis typically takes 15–30 seconds

---

Built with ❤️ by [Deepak Agarwal](https://codeq.tech) · codeq.tech
