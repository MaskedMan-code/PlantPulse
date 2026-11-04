import { z } from "zod";
export const SourceDoc = z.object({ id: z.string().min(1).max(64), name: z.string().max(200), text: z.string().min(1), pages: z.array(z.string()).optional() });
export type SourceDoc = z.infer<typeof SourceDoc>;
const Ref = z.object({ docId: z.string(), page: z.number().int().positive().nullish(), quote: z.string().min(3) });
export const Finding = z.object({
  incidentTitle: z.string(), summary: z.string(),
  timeline: z.array(z.object({ time: z.string().nullable(), description: z.string(), category: z.string(), equipment: z.string().nullable(), ref: Ref })),
  contradictions: z.array(z.object({ claimA: z.string(), refA: Ref, claimB: z.string(), refB: Ref, explanation: z.string(), status: z.enum(["verified", "suspected"]) })),
  missingInformation: z.array(z.string()), openQuestions: z.array(z.string()),
  similarIncidents: z.array(z.object({ incidentName: z.string(), similarSymptoms: z.string(), differences: z.string(), uncertainty: z.string(), ref: Ref })),
  nextSteps: z.array(z.string()), limitations: z.array(z.string()),
});
export type Finding = z.infer<typeof Finding>;
export type Verified = Finding & { meta: { mode: "live"; model: string; droppedUnsupported: number }; timeline: (Finding["timeline"][number] & { ts: number | null; verified: true })[] };
