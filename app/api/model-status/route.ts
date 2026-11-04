import { checkStatus, modelName, MetaError } from "@/lib/meta";
export const maxDuration = 30;
export async function GET() {
  try { await checkStatus(); return Response.json({ status: "connected", model: modelName() }); }
  catch (e) { const code = e instanceof MetaError ? e.code : "unavailable"; return Response.json({ status: code === "not_configured" ? "not_configured" : "unavailable", model: modelName(), reason: code }); }
}
