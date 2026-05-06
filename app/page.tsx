"use client";
import { useEffect, useMemo, useState } from "react";
import { climbs } from "@/lib/climbs";

function Card({ children, className="" }: any) { return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>; }
function Button({ children, ...props }: any) { return <button {...props} className={`rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-400 ${props.className||""}`}>{children}</button>; }
function Select({ value, onChange }: any) { return <select value={value} onChange={e=>onChange(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">{climbs.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>; }
const n = (v:any, d=1) => typeof v === "number" ? v.toFixed(d) : "—";

function MiniChart({ data, keyName, unit, label }: any) {
  const values = data.map((d:any)=>Number(d[keyName]||0));
  const min = Math.min(...values, 0); const max = Math.max(...values, 1); const range = Math.max(1, max-min);
  const width=760, height=220, pad=28;
  const x=(i:number)=>pad+(i/Math.max(1,data.length-1))*(width-pad*2);
  const y=(v:number)=>height-pad-((v-min)/range)*(height-pad*2);
  const pts=data.map((d:any,i:number)=>`${x(i)},${y(Number(d[keyName]||0))}`).join(" ");
  return <Card className="p-5"><h3 className="mb-3 font-semibold">{label}</h3><svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full"><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-900" />{data.map((d:any,i:number)=><circle key={d.label} cx={x(i)} cy={y(Number(d[keyName]||0))} r="4"><title>{`${d.label} ${d.date}: ${n(d[keyName])} ${unit}`}</title></circle>)}</svg><div className="grid text-[10px] text-slate-500" style={{gridTemplateColumns:`repeat(${data.length || 1},1fr)`}}>{data.map((d:any)=><div key={d.label} className="text-center">{d.label}</div>)}</div></Card>;
}

export default function Page() {
  const [climbId, setClimbId] = useState("adams-sw-chutes");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState("");
  const climb = climbs.find(c=>c.id===climbId) || climbs[0];
  async function load() {
    setLoading(true); setError(""); setData(null);
    const res = await fetch(`/api/weather?climbId=${climbId}`);
    const json = await res.json();
    if (!json.ok) setError(json.error || "NO DATA"); else setData(json);
    setLoading(false);
  }
  useEffect(()=>{ load(); }, [climbId]);
  const chart = useMemo(()=> (data?.forecast || []).map((d:any)=>({
    label:d.label, date:d.date,
    summitWind: Math.round(((d.summitWindGfsKph||0)+(d.summitWindEcmwfKph||0))/2),
    summitTemp: +(((d.summitTempGfsC||0)+(d.summitTempEcmwfC||0))/2).toFixed(1),
    summitTempLow: d.summitTempMinAvgC,
    summitTempHigh: d.summitTempMaxAvgC,
    precip: +(((d.precipGfsMm||0)+(d.precipEcmwfMm||0))/2).toFixed(1),
    pressure: d.pressureHpa,
    freezingLevel: d.freezingLevelM,
    models: d.modelStats?.modelCount || 1,
    modelValues: d.modelValues || []
  })), [data]);
  async function sendTest() {
    setTestResult("Sending…");
    const res = await fetch("/api/send-test-alert", { method: "POST" });
    const json = await res.json();
    setTestResult(json.ok ? "Test alert sent by email and SMS." : `Failed: ${json.error}`);
  }
  return <main className="min-h-screen bg-slate-50 p-4 md:p-8"><div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-medium text-slate-600">Mountain Window Intelligence</p><h1 className="text-3xl font-bold">Weather Window App</h1><p className="mt-2 max-w-3xl text-slate-600">Live Open-Meteo data, route-specific scoring, and Resend/Twilio alert plumbing. This is decision support only; manual review is required.</p></div><div className="flex gap-2"><Select value={climbId} onChange={setClimbId}/><Button onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</Button></div></div>
    <Card className="p-5"><h2 className="text-xl font-semibold">{climb.name}</h2><p className="text-sm text-slate-600">{climb.region} · {climb.summitM} m · {climb.lat}, {climb.lon}</p></Card>
    {error && <div className="rounded-2xl border border-red-500 bg-red-50 p-5 text-red-900"><strong>DATA ERROR — DO NOT USE THIS TOOL</strong><div>{error}</div></div>}
    {data && <>
      <div className="grid gap-4 md:grid-cols-4"><Card className="p-5"><div className="text-sm text-slate-500">Immediate Window</div><div className="text-3xl font-semibold">{n(data.immediateQuality)}/10</div></Card><Card className="p-5"><div className="text-sm text-slate-500">Best Window</div><div className="text-xl font-semibold">{data.best.label}</div><div>{n(data.best.quality)}/10 · conf {n(data.best.confidence)}</div></Card><Card className="p-5"><div className="text-sm text-slate-500">Models</div><div className="text-3xl font-semibold">{chart[0]?.models || 0}</div><div className="text-xs text-slate-500">Models vary by lead time</div></Card><Card className="p-5"><div className="text-sm text-slate-500">Source</div><div className="text-xs text-slate-700">{data.source}</div></Card></div>
      <div className="overflow-x-auto rounded-2xl border bg-white p-4"><h3 className="mb-3 font-semibold">Window watch</h3><div className="grid min-w-[1200px] gap-2" style={{gridTemplateColumns:`repeat(${chart.length || 1}, 1fr)`}}>{chart.map((d:any, i:number)=>{ const inBest=i+1>=data.best.startDay && i+1<=data.best.endDay; return <div key={d.label} className={`rounded-xl border p-2 text-center text-xs ${inBest?"border-emerald-500 bg-emerald-50":"bg-slate-50"}`}><div className="font-bold">{d.label}</div><div className="text-[10px] text-slate-400">{d.date}</div><div>{d.summitWind} kph</div><div>Avg {n(d.summitTemp)}°C</div><div>Low/High {n(d.summitTempLow)}/{n(d.summitTempHigh)}°C</div><div>{n(d.precip)} mm</div><div>{d.models} models</div></div>})}</div></div>
      <div className="grid gap-4 lg:grid-cols-2"><MiniChart data={chart} keyName="summitTemp" unit="°C" label="Summit temperature avg"/><MiniChart data={chart} keyName="summitWind" unit="kph" label="Summit wind"/><MiniChart data={chart} keyName="precip" unit="mm" label="Summit precip"/><MiniChart data={chart} keyName="freezingLevel" unit="m" label="Freezing level"/></div>
      <Card className="p-5"><h3 className="mb-3 font-semibold">Raw model table</h3><div className="overflow-x-auto"><table className="min-w-[1000px] text-xs"><thead><tr><th className="p-2 text-left">Day</th><th className="p-2 text-left">Models</th></tr></thead><tbody>{chart.map((d:any)=><tr key={d.label} className="border-t"><td className="p-2 font-medium">{d.label} {d.date}</td><td className="p-2">{d.modelValues.map((m:any)=>`${m.modelLabel}: ${Math.round(m.summitWindKph)}kph, ${n(m.summitTempC)}°C, ${n(m.precipMm)}mm`).join(" | ")}</td></tr>)}</tbody></table></div></Card>
    </>}
    <Card className="p-5"><h3 className="font-semibold">Alerts</h3><p className="mt-1 text-sm text-slate-600">Once environment variables are set in Vercel, this sends a real test email and SMS.</p><div className="mt-3 flex items-center gap-3"><Button onClick={sendTest}>Send test alert</Button><span className="text-sm text-slate-600">{testResult}</span></div><p className="mt-3 text-xs text-slate-500">Automated checks run through /api/check-alerts?secret=YOUR_CRON_SECRET. Add this to Vercel Cron after deployment.</p></Card>
  </div></main>;
}
