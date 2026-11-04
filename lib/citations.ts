import type { SourceDoc } from "./schema";
export const norm = (s: string) => s.toLowerCase().replace(/[\s\u00a0]+/g, " ").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim();
export function quoteExists(docs: SourceDoc[], docId: string, quote: string, page?: number | null): boolean {
  const d = docs.find((x) => x.id === docId);
  if (!d) return false;
  const q = norm(quote);
  if (q.length < 3) return false;
  const hay = page && d.pages?.[page - 1] !== undefined ? d.pages[page - 1] : d.text;
  return norm(hay).includes(q);
}
