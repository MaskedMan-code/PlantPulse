import { extractText, getDocumentProxy } from "unpdf";
export const MAX_BYTES = 5 * 1024 * 1024;
export const ALLOWED = [".txt", ".md", ".pdf"];
export type Extracted = { text: string; pages?: string[] };
export function checkFile(name: string, size: number): string | null {
  const ext = name.toLowerCase().slice(name.lastIndexOf("."));
  if (!ALLOWED.includes(ext)) return `Unsupported type "${ext}". Use TXT, MD or PDF.`;
  if (size === 0) return "File is empty.";
  if (size > MAX_BYTES) return "File exceeds 5 MB.";
  return null;
}
export async function extract(name: string, buf: Uint8Array): Promise<Extracted> {
  if (name.toLowerCase().endsWith(".pdf")) {
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: false });
    const pages = text.map((t) => t.trim());
    const joined = pages.join("\n");
    if (!joined.trim()) throw new Error("No readable text in PDF (scanned?).");
    return { text: joined, pages };
  }
  const t = new TextDecoder().decode(buf);
  if (!t.trim()) throw new Error("File has no readable text.");
  return { text: t };
}
