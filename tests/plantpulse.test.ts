import { describe, it, expect, afterEach } from "vitest";
import { checkFile } from "../lib/extract";
import { parseTimestamp, sortByTime } from "../lib/dates";
import { Finding } from "../lib/schema";
import { quoteExists } from "../lib/citations";
import { verify, analyze, MetaError, INSTRUCTIONS } from "../lib/meta";
import { DEMO_DOCS } from "../lib/demo";

const ref = (quote: string, docId = "shift-log") => ({ docId, page: null, quote });
const base = (over: Partial<Finding> = {}): Finding => ({ incidentTitle: "t", summary: "s", timeline: [], contradictions: [], missingInformation: [], openQuestions: [], similarIncidents: [], nextSteps: [], limitations: [], ...over });

describe("file validation", () => {
  it("accepts txt/md/pdf", () => { for (const n of ["a.txt", "b.MD", "c.pdf"]) expect(checkFile(n, 10)).toBeNull(); });
  it("rejects bad type, empty and oversize", () => {
    expect(checkFile("a.exe", 10)).toMatch(/Unsupported/);
    expect(checkFile("a.txt", 0)).toMatch(/empty/);
    expect(checkFile("a.txt", 6 * 1024 * 1024)).toMatch(/5 MB/);
  });
});
describe("dates", () => {
  it("parses and rejects", () => {
    expect(parseTimestamp("2026-03-14 03:07")).toBe(Date.UTC(2026, 2, 14, 3, 7));
    expect(parseTimestamp("14/03/2026 03:07")).toBe(Date.UTC(2026, 2, 14, 3, 7));
    expect(parseTimestamp("03:07")).toBeNull();
    expect(parseTimestamp("2026-02-31 10:00")).toBeNull();
    expect(parseTimestamp(null)).toBeNull();
  });
  it("sorts chronologically with unknown last, stable", () => {
    const r = sortByTime([{ ts: null, n: 1 }, { ts: 5, n: 2 }, { ts: 1, n: 3 }, { ts: null, n: 4 }]).map((x) => x.n);
    expect(r).toEqual([3, 2, 1, 4]);
  });
});
describe("schema", () => {
  it("accepts valid and rejects invalid", () => {
    expect(Finding.safeParse(base()).success).toBe(true);
    expect(Finding.safeParse({ summary: 1 }).success).toBe(false);
  });
});
describe("citations", () => {
  it("matches whitespace/case-insensitively", () => expect(quoteExists(DEMO_DOCS, "shift-log", "BFP-2A   TRIPPED")).toBe(true));
  it("rejects fabricated quote, unknown doc", () => {
    expect(quoteExists(DEMO_DOCS, "shift-log", "pump exploded")).toBe(false);
    expect(quoteExists(DEMO_DOCS, "nope", "BFP-2A tripped")).toBe(false);
  });
  it("respects page", () => {
    const d = [{ id: "p", name: "p", text: "a\nb", pages: ["alpha one", "beta two"] }];
    expect(quoteExists(d, "p", "beta two", 2)).toBe(true);
    expect(quoteExists(d, "p", "beta two", 1)).toBe(false);
  });
  it("verify drops unsupported items and flags live mode", () => {
    const f = base({ timeline: [
      { time: "2026-03-14 03:02", description: "trip", category: "trip", equipment: "BFP-2A", ref: ref("BFP-2A tripped") },
      { time: null, description: "fake", category: "x", equipment: null, ref: ref("invented text here") }] });
    const v = verify(f, DEMO_DOCS);
    expect(v.timeline).toHaveLength(1);
    expect(v.meta).toMatchObject({ mode: "live", droppedUnsupported: 1 });
  });
  it("verify throws if nothing supported", () => {
    expect(() => verify(base({ timeline: [{ time: null, description: "d", category: "c", equipment: null, ref: ref("zzz nothing") }] }), DEMO_DOCS)).toThrow(MetaError);
  });
});
describe("meta integration", () => {
  const saved = process.env.MODEL_API_KEY;
  afterEach(() => { process.env.MODEL_API_KEY = saved; });
  it("missing key gives not_configured, no fallback", async () => {
    delete process.env.MODEL_API_KEY;
    await expect(analyze(DEMO_DOCS)).rejects.toMatchObject({ code: "not_configured" });
  });
  it("prompt treats documents as untrusted", () => expect(INSTRUCTIONS).toMatch(/UNTRUSTED/));
});
