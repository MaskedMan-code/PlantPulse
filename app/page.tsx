"use client";
import { useEffect, useState } from "react";
import { Upload, FileText, Clock, AlertTriangle, GitCompare, ListChecks, Printer, LayoutDashboard, Play, Menu, X, Check, Search, PanelLeft } from "lucide-react";
import { DEMO_DOCS } from "@/lib/demo";
import type { SourceDoc, Verified } from "@/lib/schema";

type Doc = SourceDoc & { error?: string };
type Ref = { docId: string; page?: number | null; quote: string };
type Item = { text: string; done: boolean; rejected: boolean; comment: string };
const TABS = [["overview", "Overview", LayoutDashboard], ["docs", "Documents", FileText], ["timeline", "Timeline", Clock], ["contra", "Contradictions", AlertTriangle], ["similar", "Similar Incidents", GitCompare], ["check", "Checklist", ListChecks], ["export", "Export Report", Printer]] as const;
const card = "rounded-lg border border-slate-700 bg-slate-800/60 p-4";
const kind = (c: string) => (/alarm|trip/i.test(c) ? "Alarm" : /maint|work/i.test(c) ? "Maintenance" : /observ|operator/i.test(c) ? "Observation" : "Event");
function Hl({ text, q }: { text: string; q: string }) {
  const k = q.trim(); if (!k) return <>{text}</>;
  const re = new RegExp(`(${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")})`, "gi");
  return <>{text.split(re).map((t, i) => (i % 2 ? <mark key={i} className="rounded bg-amber-400/40 px-0.5 text-inherit">{t}</mark> : t))}</>;
}

export default function Home() {
  const [tab, setTab] = useState("overview");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [res, setRes] = useState<Verified | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [status, setStatus] = useState<{ status: string; model?: string } | null>(null);
  const [sel, setSel] = useState<Ref | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [theme, setThemeS] = useState("midnight"), [collapsed, setCollapsed] = useState(false), [drawer, setDrawer] = useState(false), [exp, setExp] = useState<string | null>(null), [q, setQ] = useState(""), [reviewed, setReviewed] = useState(false), [upl, setUpl] = useState("");
  useEffect(() => { setThemeS(document.documentElement.dataset.theme || "midnight"); if (window.innerWidth < 1024) setCollapsed(true); }, []);
  useEffect(() => { if (sel) setReviewed(true); }, [sel]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setSel(null); setDrawer(false); } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, []);
  const setTheme = (t: string) => { setThemeS(t); document.documentElement.dataset.theme = t; try { localStorage.setItem("pp-theme", t); } catch {} };

  useEffect(() => { fetch("/api/model-status").then((r) => r.json()).then(setStatus).catch(() => setStatus({ status: "unavailable" })); try { const s = localStorage.getItem("pp-session"); if (s) { const j = JSON.parse(s); setDocs(j.docs ?? []); setRes(j.res ?? null); setItems(j.items ?? []); } } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("pp-session", JSON.stringify({ docs, res, items })); } catch {} }, [docs, res, items]);

  const upload = async (files: FileList | File[]) => {
    const fd = new FormData(); Array.from(files).forEach((f) => fd.append("files", f));
    setUpl("Extracting text…");
    try { const j = await (await fetch("/api/extract", { method: "POST", body: fd })).json(); setDocs((d) => [...d, ...j.files]); setTab("docs"); setUpl(`Processed ${j.files.length} file(s).`); }
    catch { setUpl("Upload failed. Please try again."); }
  };
  const usable = docs.filter((d) => !d.error && d.text);
  const run = async () => {
    setErr(""); if (!usable.length) return setErr("Add at least one readable document first.");
    setBusy(true); setStage("Sending documents to Meta AI (server-side)…");
    try {
      const r = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ docs: usable.map(({ id, name, text, pages }) => ({ id, name, text, pages })) }) });
      setStage("Validating output and cross-checking quotations…");
      const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "Analysis failed.");
      setRes(j); setItems(j.nextSteps.map((text: string) => ({ text, done: false, rejected: false, comment: "" }))); setTab("timeline");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); setStage(""); }
  };
  const nm = (id: string) => docs.find((d) => d.id === id)?.name ?? id;
  const Quote = ({ r }: { r: Ref }) => <button onClick={() => setSel(r)} className="mt-2 block text-left text-sm leading-relaxed text-cyan-300 hover:underline"><span className="italic">“{r.quote}”</span><span className="block text-slate-300 not-italic">Source: {nm(r.docId)}{r.page ? `, p.${r.page}` : ""}</span></button>;
  const open = items.filter((i) => !i.done && !i.rejected).length;
  const badge = status?.status === "connected" ? ["Meta AI Connected", "bg-emerald-600"] : status?.status === "not_configured" ? ["Meta AI Not Configured", "bg-amber-600"] : status ? ["Meta AI Unavailable", "bg-red-700"] : ["Checking Meta AI…", "bg-slate-600"];
  const exportCheck = () => { const t = items.map((i) => `[${i.done ? "x" : i.rejected ? "rejected" : " "}] ${i.text}${i.comment ? ` — ${i.comment}` : ""}`).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/plain" })); a.download = "plantpulse-checklist.txt"; a.click(); };

  const total = items.filter((i) => !i.rejected).length, doneN = items.filter((i) => i.done && !i.rejected).length, rej = items.length - total, pct = total ? Math.round((doneN / total) * 100) : 0;
  const nav = (full: boolean) => (
    <nav aria-label="Primary" className="flex flex-col gap-1 p-2">
      {TABS.map(([k, l, I]) => <button key={k} onClick={() => { setTab(k); setDrawer(false); }} aria-current={tab === k ? "page" : undefined} title={l} className={`flex min-h-[44px] items-center gap-3 rounded-md px-3 text-sm transition-colors ${tab === k ? "bg-cyan-600/15 font-medium text-cyan-300 ring-1 ring-cyan-400/40" : "text-slate-300 hover:bg-slate-700/50"}`}><I size={18} aria-hidden />{full ? <span>{l}</span> : <span className="sr-only">{l}</span>}</button>)}
    </nav>
  );
  return (
    <div className="min-h-screen md:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-slate-800 focus:p-2">Skip to content</a>
      <aside className={`no-print sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-700 bg-slate-800 transition-[width] duration-200 md:flex ${collapsed ? "w-16" : "w-56"}`}>
        <div className="flex h-14 items-center gap-2 border-b border-slate-700 px-4"><span aria-hidden className="h-6 w-6 shrink-0 rounded bg-cyan-600" />{!collapsed && <span className="font-semibold">PlantPulse</span>}</div>
        {nav(!collapsed)}
        <div className="mt-auto space-y-2 p-2">
          {!collapsed && <span className={`block rounded px-2 py-1 text-xs text-white ${badge[1]}`}>{badge[0]}</span>}
          <button onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="flex min-h-[44px] w-full items-center gap-3 rounded-md px-3 text-sm text-slate-300 hover:bg-slate-700/50"><PanelLeft size={18} aria-hidden />{!collapsed && "Collapse"}</button>
        </div>
      </aside>
      {drawer && <div className="no-print fixed inset-0 z-40 md:hidden"><div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} /><div role="dialog" aria-modal="true" aria-label="Navigation" className="sheet absolute inset-y-0 left-0 w-64 border-r border-slate-700 bg-slate-800"><button onClick={() => setDrawer(false)} aria-label="Close navigation" className="m-2 flex min-h-[44px] min-w-[44px] items-center justify-center"><X /></button>{nav(true)}</div></div>}
      <div className="min-w-0 flex-1">
        <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b border-slate-700 bg-slate-800 px-3 py-2">
          <button onClick={() => setDrawer(true)} aria-label="Open navigation" className="flex min-h-[44px] min-w-[44px] items-center justify-center md:hidden"><Menu /></button>
          <div className="min-w-0 flex-1"><h1 className="truncate font-semibold">{res?.incidentTitle ?? "No investigation loaded"}</h1><p className="text-sm text-slate-400">PlantPulse · decision support only</p></div>
          <span role="status" className={`hidden rounded px-2 py-1 text-xs text-white sm:inline ${badge[1]}`}>{badge[0]}{status?.model ? ` · ${status.model}` : ""}</span>
          <select aria-label="Theme" value={theme} onChange={(e) => setTheme(e.target.value)} className="min-h-[40px] rounded border border-slate-600 bg-slate-900 px-2 text-sm"><option value="midnight">Midnight Operations</option><option value="light">Precision Light</option><option value="contrast">High Contrast</option></select>
        </header>
        <main id="main" className="mx-auto max-w-5xl space-y-4 p-4">
        {err && <div className="no-print rounded border border-red-700 bg-red-950/60 p-3 text-sm" role="alert">{err} Your documents are kept; you can retry.</div>}
        {tab === "overview" && <>
          <div className={card}>
            <h2 className="mb-1 text-lg font-semibold">{res?.incidentTitle ?? "Start an investigation"}</h2>
            <p className="mb-3 text-sm text-slate-300">{res?.summary ?? "1) Load the fictional demo incident or upload TXT/MD/PDF records. 2) Analyze with Meta AI. 3) Review timeline, contradictions and checklist."}</p>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy || !usable.length} onClick={run} className="min-h-[44px] rounded bg-cyan-600 px-4 text-sm font-medium text-white transition-opacity disabled:opacity-40">{busy ? "Analyzing…" : "Analyze Incident with Meta AI"}</button>
              <button onClick={() => { setDocs(DEMO_DOCS); setTab("docs"); }} className="flex min-h-[44px] items-center gap-1 rounded border border-slate-600 px-3 text-sm hover:bg-slate-700/50"><Play size={14} aria-hidden />Load Demo Incident</button>
              <button onClick={() => setTab("docs")} className="flex min-h-[44px] items-center gap-1 rounded border border-slate-600 px-3 text-sm hover:bg-slate-700/50"><Upload size={14} aria-hidden />Upload files</button>
            </div>
            <p role="status" className="mt-2 text-sm text-cyan-300">{busy ? stage : ""}</p>
          </div>
          <ol aria-label="Investigation workflow" className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {([["Documents", usable.length > 0], ["Analysis", !!res], ["Evidence Review", !!res && reviewed], ["Checklist", !!res && items.length > 0 && open === 0], ["Export", false]] as [string, boolean][]).map(([l, d], i) => <li key={l} className={`${card} flex items-center gap-2 text-sm`}><span aria-hidden className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${d ? "border-cyan-400 bg-cyan-600 text-white" : "border-slate-600"}`}>{d ? <Check size={14} /> : i + 1}</span><span>{l}<span className="block text-sm text-slate-400">{l === "Export" ? (res ? "Available" : "Pending") : d ? "Complete" : "Pending"}</span></span></li>)}
          </ol>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[["Source documents", usable.length], ["Timeline events", res?.timeline.length ?? "–"], ["Contradictions", res?.contradictions.length ?? "–"], ["Missing info", res?.missingInformation.length ?? "–"], ["Review tasks left", res ? open : "–"]].map(([l, v]) => <div key={l as string} className={card}><div className="text-2xl font-semibold text-cyan-300">{v}</div><div className="text-sm text-slate-400">{l}</div></div>)}
          </div>
          {res ? <p className="text-sm text-slate-400">LIVE META AI inference · model {res.meta.model} · {res.meta.droppedUnsupported} unsupported item(s) removed by citation check.</p> : <p className="text-sm text-slate-400">No analysis yet. Results appear only after a real Meta API call.</p>}
        </>}
        {tab === "docs" && <>
          <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }} className="rounded-lg border-2 border-dashed border-slate-600 p-6 text-center text-sm focus-within:ring-2 focus-within:ring-cyan-400">
            <Upload className="mx-auto mb-1" size={20} aria-hidden /><label className="cursor-pointer font-medium text-cyan-300 underline">Choose files<input type="file" multiple accept=".txt,.md,.pdf" className="sr-only" onChange={(e) => e.target.files && upload(e.target.files)} /></label> or drag and drop
            <p className="text-sm text-slate-400">TXT, MD, PDF · up to 5 MB each</p><p role="status" className="text-xs text-cyan-300">{upl}</p>
          </div>
          <div className="flex items-center gap-2 rounded border border-slate-600 bg-slate-900 px-3"><Search size={16} aria-hidden /><input aria-label="Search document text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search document text" className="min-h-[44px] flex-1 bg-transparent outline-none" /></div>
          {docs.length === 0 ? <p className="text-slate-400">No documents yet. Upload files or load the demo incident.</p> : docs.filter((d) => !q || d.text?.toLowerCase().includes(q.toLowerCase())).map((d) => <div key={d.id} className={card}><div className="flex flex-wrap items-center justify-between gap-2"><b>{d.name}</b>{d.error ? <span className="text-xs text-red-400">✖ Failed</span> : <span className="text-xs text-emerald-400">✔ Extracted</span>}</div>{d.error ? <p className="text-sm text-red-400">{d.error}</p> : <><p className="text-sm text-slate-400">{d.text.length.toLocaleString()} characters{d.pages ? ` · ${d.pages.length} pages` : ""} · id {d.id}</p><pre tabIndex={0} className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-300"><Hl text={d.text.slice(0, q ? 20000 : 1500)} q={q} /></pre></>}</div>)}
        </>}
        {tab === "timeline" && (!res ? <Empty /> : (() => {
          type TL = Verified["timeline"][number] & { ts: number | null };
          const tl = res.timeline as unknown as TL[];
          const ev = (e: TL, key: string) => { const k = kind(e.category), isOpen = exp === key; return (
            <li key={key} className="relative ml-6 pb-4"><span aria-hidden className="absolute -left-[2.15rem] flex h-6 w-6 items-center justify-center rounded-full border border-cyan-400 bg-slate-900 text-[10px] font-bold text-cyan-300">{k[0]}</span>
              <div className={`${card} transition-shadow ${sel?.quote === e.ref.quote ? "ring-2 ring-cyan-400" : "hover:shadow-md"}`}>
                <button aria-expanded={isOpen} onClick={() => setExp(isOpen ? null : key)} className="flex w-full items-start justify-between gap-2 text-left"><span><b className="text-cyan-300">{e.time ?? "Time not stated"}</b><span className="block text-sm">{e.description}</span></span><span className="shrink-0 rounded border border-slate-600 px-2 text-xs">{k}</span></button>
                {isOpen && <div className="mt-2 space-y-1 text-sm text-slate-300"><p>Category: {e.category}</p>{e.equipment && <p>Equipment: {e.equipment}</p>}<p>Source: {nm(e.ref.docId)}{e.ref.page ? `, p.${e.ref.page}` : ""}</p></div>}
                <Quote r={e.ref} />
              </div></li>); };
          const timed = tl.filter((e) => e.ts !== null), undated = tl.filter((e) => e.ts === null);
          return <div>{timed.length > 0 && <ol aria-label="Timed events" className="border-l-2 border-slate-700">{timed.map((e, i) => ev(e, "t" + i))}</ol>}{undated.length > 0 && <><h3 className="mb-2 mt-4 font-semibold">Undated observations</h3><ol className="border-l-2 border-dashed border-slate-700">{undated.map((e, i) => ev(e, "u" + i))}</ol></>}</div>;
        })())}
        {tab === "contra" && (!res ? <Empty /> : res.contradictions.length === 0 ? <p className="text-slate-400">No evidence-backed contradictions survived verification.</p> : <>
          <p className="text-sm text-slate-400">“Source Verified” means the quoted text was found in the document. It does not confirm the discrepancy is real; each item needs human review.</p>
          {res.contradictions.map((c, i) => <section key={i} aria-label={`Discrepancy ${i + 1}`} className={`${card} border-l-4 border-l-amber-500`}>
            <div className="mb-2 flex flex-wrap items-center gap-2"><h3 className="font-semibold">Discrepancy {i + 1}: {nm(c.refA.docId)} vs {nm(c.refB.docId)}</h3><span className="rounded border border-emerald-500 px-2 text-xs">✓ Source Verified</span><span className="rounded border border-amber-500 px-2 text-xs">⚠ Requires Human Review</span><span className="text-sm text-slate-400">Model’s preliminary assessment: {c.status === "verified" ? "direct conflict" : "possible conflict"} (not independently confirmed)</span></div>
            <div className="grid gap-3 md:grid-cols-2">{[{ l: "Claim A", t: c.claimA, r: c.refA }, { l: "Claim B", t: c.claimB, r: c.refB }].map((x) => <div key={x.l} className="rounded-md border border-slate-600 bg-slate-900 p-3"><div className="text-sm text-slate-400">{x.l}</div><p className="text-sm">{x.t}</p><Quote r={x.r} /></div>)}</div>
            <p className="mt-2 text-sm text-slate-300">{c.explanation}</p></section>)}</>)}
        {tab === "similar" && (!res ? <Empty /> : res.similarIncidents.length === 0 ? <p className="text-slate-400">No verified historical comparisons.</p> : <>
          <p className="text-sm text-slate-400">Contextual similarity only. Similar symptoms do not establish an identical root cause.</p>
          <div className="space-y-4">{res.similarIncidents.map((s, i) => <section key={i} className={`${card} space-y-3`}><h3 className="text-lg font-semibold">{s.incidentName}</h3><div className="grid gap-4 md:grid-cols-3"><div><h4 className="mb-1 text-sm font-semibold text-cyan-300">Similar observed symptoms</h4><p className="text-sm leading-relaxed">{s.similarSymptoms}</p></div><div><h4 className="mb-1 text-sm font-semibold text-cyan-300">Important differences</h4><p className="text-sm leading-relaxed">{s.differences}</p></div><div><h4 className="mb-1 text-sm font-semibold text-amber-300">Uncertainty and limitations</h4><p className="text-sm leading-relaxed">{s.uncertainty}</p></div></div><div className="border-t border-slate-700 pt-2"><h4 className="text-sm font-semibold">Supporting record</h4><Quote r={s.ref} /></div></section>)}</div></>)}
        {tab === "check" && (!res ? <Empty /> : <>
          <p className="text-sm text-slate-400">Evidence requests and human review only — never equipment operating instructions.</p>
          <div className={card}><div className="flex justify-between text-sm"><span>Progress</span><span>{doneN} of {total} complete{rej ? ` · ${rej} rejected` : ""}</span></div><div role="progressbar" aria-label="Checklist completion" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-2 rounded bg-slate-700"><div className="h-2 rounded bg-cyan-400 transition-[width] duration-200" style={{ width: `${pct}%` }} /></div></div>
          {items.map((it, i) => { const upd = (p: Partial<Item>) => setItems((a) => a.map((x, j) => (j === i ? { ...x, ...p } : x))); return <div key={i} className={`${card} transition-opacity ${it.rejected ? "opacity-60" : ""}`}><label className="flex cursor-pointer gap-3 text-sm"><input type="checkbox" disabled={it.rejected} checked={it.done} onChange={(e) => upd({ done: e.target.checked })} style={{ accentColor: "rgb(var(--c400))" }} className="mt-0.5 h-6 w-6 shrink-0" /><span className={it.done || it.rejected ? "line-through" : ""}>{it.text}</span></label>{it.rejected && <p className="mt-1 text-xs text-red-400">✖ Rejected</p>}<div className="mt-2 flex gap-2"><input aria-label="Comment" value={it.comment} onChange={(e) => upd({ comment: e.target.value })} placeholder="Comment" className="min-h-[40px] flex-1 rounded border border-slate-600 bg-slate-900 px-2 text-sm" /><button onClick={() => { if (it.rejected || window.confirm("Reject this suggested item? You can restore it later.")) upd({ rejected: !it.rejected }); }} className="min-h-[40px] px-2 text-sm text-red-400">{it.rejected ? "Restore" : "Reject"}</button></div></div>; })}
          <button onClick={exportCheck} className="min-h-[44px] rounded border border-slate-600 px-3 text-sm">Export checklist (.txt)</button></>)}
        {tab === "export" && (!res ? <Empty /> : <>
          <button onClick={() => window.print()} className="no-print flex min-h-[44px] items-center gap-1 rounded bg-cyan-600 px-4 text-sm text-white"><Printer size={16} aria-hidden />Print / Save as PDF</button>
          <article className="report mx-auto max-w-3xl space-y-3 rounded bg-white p-8 text-sm leading-relaxed text-black shadow-lg" style={{ fontFamily: "Georgia, serif" }}>
            <header className="border-b-2 border-black pb-2"><p className="text-xs uppercase tracking-widest">Incident Investigation Report · Draft for human review</p><h2 className="text-2xl font-bold">{res.incidentTitle}</h2><p className="text-xs">Generated {new Date().toLocaleDateString()} · {usable.length} source documents · Model {res.meta.model} (live Meta AI)</p></header>
            <h3 className="text-base font-bold">1. Executive summary</h3><p>{res.summary}</p>
            <h3 className="text-base font-bold">2. Timeline</h3><ul className="list-disc space-y-1 pl-5">{res.timeline.map((e, i) => <li key={i}><b>{e.time ?? "Undated"}</b> — {e.description}<blockquote className="border-l-4 border-gray-400 pl-3 italic">“{e.ref.quote}” ({nm(e.ref.docId)}{e.ref.page ? `, p.${e.ref.page}` : ""})</blockquote></li>)}</ul>
            <h3 className="text-base font-bold">3. Contradictions (require human review)</h3><ul className="list-disc space-y-1 pl-5">{res.contradictions.map((c, i) => <li key={i}>{c.claimA} <i>vs</i> {c.claimB}. {c.explanation}<blockquote className="border-l-4 border-gray-400 pl-3 italic">“{c.refA.quote}” ({nm(c.refA.docId)}) / “{c.refB.quote}” ({nm(c.refB.docId)})</blockquote></li>)}</ul>
            <h3 className="text-base font-bold">4. Missing information</h3><ul className="list-disc pl-5">{res.missingInformation.map((m, i) => <li key={i}>{m}</li>)}</ul>
            <h3 className="text-base font-bold">5. Historical comparisons</h3><ul className="list-disc pl-5">{res.similarIncidents.map((s, i) => <li key={i}><b>{s.incidentName}</b>: {s.similarSymptoms} Differences: {s.differences} {s.uncertainty}</li>)}</ul>
            <h3 className="text-base font-bold">6. Investigation checklist</h3><ul className="pl-1">{items.map((it, i) => <li key={i}>{it.done ? "☑" : it.rejected ? "☒" : "☐"} {it.text}{it.comment ? ` — ${it.comment}` : ""}</li>)}</ul>
            <h3 className="text-base font-bold">7. Source references</h3><ul className="list-disc pl-5">{usable.map((d) => <li key={d.id}>{d.name} ({d.id})</li>)}</ul>
            <h3 className="text-base font-bold">8. AI usage and limitations</h3><p>Findings were generated by {res.meta.model} through the Meta Model API. Quotations were machine-checked against source text; interpretation was not. This is decision support only; no root cause is confirmed. {res.limitations.join(" ")}</p>
            <p className="print-only">PlantPulse · AI-assisted draft · human review required</p>
          </article></>)}
        {sel && <aside role="dialog" aria-label="Source evidence" className="sheet no-print fixed inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-auto rounded-t-xl border-t border-slate-600 bg-slate-900 p-4 shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-96 md:rounded-none md:border-l md:border-t-0"><button autoFocus onClick={() => setSel(null)} aria-label="Close evidence" className="float-right flex min-h-[44px] min-w-[44px] items-center justify-center"><X /></button><h3 className="font-semibold">{nm(sel.docId)}</h3><p className="my-2 rounded bg-cyan-900/30 p-2 text-sm">“{sel.quote}”</p><pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300"><Hl text={docs.find((d) => d.id === sel.docId)?.text ?? ""} q={sel.quote} /></pre></aside>}
        </main>
      </div>
    </div>
  );
  function Empty() { return <p className="text-slate-400">Run an analysis first (Overview → Analyze Incident with Meta AI).</p>; }
}
