/** Deterministic parser: ISO-like "YYYY-MM-DD HH:mm(:ss)" or "DD/MM/YYYY HH:mm". Returns UTC-agnostic epoch ms or null. Never guesses missing dates. */
export function parseTimestamp(s: string | null | undefined): number | null {
  if (!s) return null;
  let m = s.match(/(\d{4})-(\d{2})-(\d{2})[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  let y, mo, d, h, mi, se;
  if (m) [, y, mo, d, h, mi, se] = m;
  else if ((m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})[\s,]+(\d{1,2}):(\d{2})(?::(\d{2}))?/))) [, d, mo, y, h, mi, se] = m;
  else return null;
  const t = Date.UTC(+y!, +mo! - 1, +d!, +h!, +mi!, +(se ?? 0));
  const dt = new Date(t);
  return dt.getUTCMonth() === +mo! - 1 && +h! < 24 && +mi! < 60 ? t : null;
}
export function sortByTime<T extends { ts: number | null }>(items: T[]): T[] {
  return items.map((x, i) => ({ x, i })).sort((a, b) => (a.x.ts === null ? 1 : 0) - (b.x.ts === null ? 1 : 0) || (a.x.ts ?? 0) - (b.x.ts ?? 0) || a.i - b.i).map((o) => o.x);
}
