import { z } from "zod";
import { SourceDoc } from "@/lib/schema";
import { analyze, MetaError } from "@/lib/meta";
export const maxDuration = 90;
export const runtime = "nodejs";
const Body = z.object({ docs: z.array(SourceDoc).min(1).max(12) });
export async function POST(req: Request) {
  let body; try { body = Body.parse(await req.json()); } catch { return Response.json({ error: "Invalid request: provide 1-12 non-empty documents." }, { status: 400 }); }
  if (body.docs.reduce((n, d) => n + d.text.length, 0) > 300_000) return Response.json({ error: "Documents exceed the 300k character limit." }, { status: 413 });
  try { return Response.json(await analyze(body.docs)); }
  catch (e) {
    const err = e instanceof MetaError ? e : new MetaError("unavailable", "Analysis failed.");
    return Response.json({ error: err.message, code: err.code }, { status: err.code === "not_configured" ? 503 : err.code === "rate_limited" ? 429 : 502 });
  }
}
