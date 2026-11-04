# PlantPulse
AI-assisted incident investigation for power-plant maintenance engineers. Loads shift logs, trip reports, work orders, manuals and historical incidents; asks **Meta Muse Spark (`muse-spark-1.3`)** via the Meta Responses API (OpenAI-compatible SDK, `https://api.meta.ai/v1`, server-side only) for a structured timeline, contradictions, missing info, historical comparisons and a human-review checklist. Every quotation is machine-checked against the source text; unsupported items are dropped. **Decision support only — not a safety-critical system; no root cause is ever confirmed by the tool.** All demo data is fictional.

## Run (Windows PowerShell)
    npm install
    Copy-Item .env.example .env.local   # then set MODEL_API_KEY (from https://dev.meta.ai/docs/quickstart)
    npm run dev                          # http://localhost:3000
    npm run typecheck; npm run lint; npm test; npm run build

Click **Load Demo Incident** → **Analyze Incident with Meta AI**. Export: Export Report tab → Print / Save as PDF.

## Deploy
Push to https://github.com/MaskedMan-code/plantpulse, import into Vercel, add `MODEL_API_KEY` and `META_MODEL` env vars.
    git init; git add .; git commit -m "PlantPulse MVP"; git branch -M main
    git remote add origin https://github.com/MaskedMan-code/plantpulse.git; git push -u origin main

## Known limitations
No SAMPLE DEMO precomputed-results mode (live Meta only). Historical incidents: one fictional record bundled in the demo set. Live Meta calls are untested (see TESTING notes below). Scanned PDFs are rejected (no OCR). The Responses API call shape follows the docs as described in the brief and has not been verified against the live service.

## Testing
`npm test` → 12 unit tests (file validation, timestamps, ordering, schema, citations, invalid-citation rejection, missing key, untrusted-content prompt). No live-API or browser tests were run.
