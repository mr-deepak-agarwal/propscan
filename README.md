# PropScan — AI Proposal Health Check

> "Upload the proposal. We'll tell you if you're about to get screwed."

A free AI-powered forensic audit tool for vendor proposals. Built by [codeq.tech](https://codeq.tech).

## What it does

Upload any vendor proposal PDF and PropScan will:
- Score it out of 100 across 6 key dimensions
- Flag critical, high, medium, and low risk issues
- Identify missing clauses (discovery phase, IP terms, exit clauses)
- Generate pointed questions to ask before signing
- Surface vendor strengths too — it's balanced, not just negative

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **AI:** Claude claude-sonnet-4-6 via Anthropic API
- **PDF parsing:** `pdf-parse`
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
ANTHROPIC_API_KEY=sk-ant-...
```

Get your API key from [console.anthropic.com](https://console.anthropic.com).

### 3. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

```bash
vercel --prod
```

Add `ANTHROPIC_API_KEY` in your Vercel project's Environment Variables.

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
      route.ts       # PDF parse + Claude API call
components/
  ScanningOverlay.tsx   # Animated scanning screen
  ResultsDashboard.tsx  # Full results UI
```

## Customisation

- **Lead capture CTA:** Edit the email capture section in `ResultsDashboard.tsx` to connect to your CRM/Formspree/Resend
- **Branding:** Change "codeq.tech" references throughout
- **Analysis depth:** Modify `ANALYSIS_PROMPT` in `app/api/analyze/route.ts`

## Notes

- PDF must be text-based (not a scanned image)
- Files are processed in memory and immediately discarded — nothing stored
- Max file size: 10MB
- Analysis typically takes 15–30 seconds

---

Built with ❤️ by [Deepak Agarwal](https://codeq.tech) · codeq.tech
