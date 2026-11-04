import { checkFile, extract } from "@/lib/extract";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const form = await req.formData();
  const out: { id: string; name: string; text?: string; pages?: string[]; error?: string }[] = [];
  let i = 0;
  for (const f of form.getAll("files")) {
    if (!(f instanceof File)) continue;
    const name = f.name.replace(/[\\/]/g, "_").slice(0, 120); // never used as a path; files are not stored
    const id = `doc-${Date.now().toString(36)}-${i++}`;
    const bad = checkFile(name, f.size);
    if (bad) { out.push({ id, name, error: bad }); continue; }
    try { out.push({ id, name, ...(await extract(name, new Uint8Array(await f.arrayBuffer()))) }); }
    catch (e) { out.push({ id, name, error: (e as Error).message }); }
  }
  return Response.json({ files: out });
}
