import type { SourceDoc } from "./schema";
// ALL CONTENT IS FICTIONAL. No root cause is predetermined.
export const DEMO_DOCS: SourceDoc[] = [
{ id: "shift-log", name: "Shift Operator Log - Unit 2 (fictional).txt", text: `SHIFT LOG - Unit 2 - Night shift, Harbor Ridge Power Station (FICTIONAL)
2026-03-14 02:10 Unit 2 at 182 MW. Boiler feedwater pump BFP-2A running, BFP-2B standby.
2026-03-14 02:41 Operator R. Almeida noted a "humming noise, louder than usual" near BFP-2A.
2026-03-14 02:55 Drum level trending down slowly. Standby pump BFP-2B started manually.
2026-03-14 03:02 BFP-2A tripped. Unit load reduced to 90 MW per procedure.
2026-03-14 03:20 Unit stabilised at 90 MW. Shift supervisor informed.` },
{ id: "trip-report", name: "Equipment Trip Report BFP-2A (fictional).txt", text: `EQUIPMENT TRIP REPORT - BFP-2A (FICTIONAL)
DCS first-out alarm: low lube oil pressure. Trip time recorded by DCS: 2026-03-14 03:07.
Operator comment: "No unusual vibration or noise observed before trip."
Bearing temperature high alarm cleared before trip; value not recorded in this report.
Standby pump BFP-2B started automatically after trip.` },
{ id: "work-order", name: "Maintenance Work Order WO-48213 (fictional).txt", text: `WORK ORDER WO-48213 - BFP-2A lube oil filter inspection (FICTIONAL)
Opened: 2026-03-02. Scheduled: 2026-03-10. Status: CLOSED 2026-03-10.
Task: Inspect lube oil filter differential pressure and replace if required.
Technician remarks: "Filter replaced." Inspection result field: [blank]. Oil sample sent: not stated.
Alignment check on coupling: not performed this cycle.` },
{ id: "manual", name: "BFP Technical Manual Excerpt (fictional).txt", text: `BFP-2A/2B MANUAL EXCERPT (FICTIONAL)
Section 7.2: Low lube oil pressure trip setpoint is 0.8 bar.
Section 7.4: Bearing temperature alarm at 85 C; trip at 95 C.
Section 9.1: Abnormal humming may result from several mechanical or hydraulic conditions and requires inspection to localise.
Section 9.3: Lube oil filter differential pressure above 1.5 bar indicates a clogged filter.` },
{ id: "hist-2024", name: "Historical Incident HI-2024-07 (fictional).txt", text: `HISTORICAL INCIDENT HI-2024-07 - BFP-1A trip (FICTIONAL, kind: historical)
Pump tripped on low lube oil pressure. Operators reported a "high-pitched whine" beforehand.
Findings: oil cooler fouling and a degraded bearing were both documented. Filter had been replaced the previous month.
Contributing factor weighting was not finalised in the report.` },
];
