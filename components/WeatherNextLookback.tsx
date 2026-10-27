"use client";
import { useEffect, useState } from "react";
import { finite } from "@/lib/weather-next-data";
const show = (v: any, digits = 1) => finite(v) ? v.toFixed(digits) : "—";
export default function WeatherNextLookback({ climb, timeZone, history, Chart }: any) {
  const [state, setState] = useState<any>({ loading: true });
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    if (!timeZone) { setState({ loading: false, message: "Waiting for the objective's forecast time zone." }); return; }
    const query = new URLSearchParams({ lat: String(climb.lat), lon: String(climb.lon), timeZone });
    fetch("/api/weather-next-history?" + query, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("Archive request failed");
      const data = await response.json();
      if (!controller.signal.aborted) setState({ loading: false, ...data });
    }).catch(() => { if (!controller.signal.aborted) setState({ loading: false, message: "WeatherNext historical guidance could not be loaded; the other lookback data remains available." }); });
    return () => controller.abort();
  }, [climb.id, timeZone]);
  const rows = state.rows || [];
  const data = rows.map((r: any) => ({ ...r, referencePrecipMm: history.find((h: any) => h.date === r.date)?.observedPrecipMm ?? null }));
  const paired = data.filter((r: any) => finite(r.precipMm) && finite(r.referencePrecipMm));
  const wnTotal = paired.reduce((s: number, r: any) => s + r.precipMm, 0), referenceTotal = paired.reduce((s: number, r: any) => s + r.referencePrecipMm, 0);
  return <section className="space-y-4 rounded-2xl border border-fuchsia-200 bg-white p-5 shadow-sm" aria-label="WeatherNext historical guidance">
    <div><h3 className="font-semibold">WeatherNext 3 · 14-day historical comparison</h3><p className="mt-2 text-sm text-slate-600">Archived one-hour-ahead ensemble forecasts, not observations. Temperature and wind refer to the native grid surface, with no summit adjustment.</p>
      <p className="mt-2 text-xs text-slate-500">Use this layer to cross-check precipitation timing and broad cloud/pressure patterns. It does not alter the summit snow, refreeze or melt scores above. Missing hours remain gaps.</p></div>
    {state.loading ? <p className="text-sm text-slate-600" role="status">Loading WeatherNext archive…</p> : state.status !== "available" ? <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="status">{state.message || "WeatherNext archive unavailable."}</p> : <>
      <p className="rounded-xl bg-fuchsia-50 p-3 text-sm text-fuchsia-950">{state.daysAvailable}/14 complete local days · {state.timeZone}.{paired.length ? ` Across ${paired.length} matching complete precipitation days, WeatherNext totals ${wnTotal.toFixed(1)} mm versus ${referenceTotal.toFixed(1)} mm in the Open-Meteo recent-past layer (${(wnTotal - referenceTotal) >= 0 ? "+" : ""}${(wnTotal - referenceTotal).toFixed(1)} mm).` : " No complete overlapping precipitation days are available for comparison."}</p>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0"><h4 className="mb-3 text-sm font-semibold">Daily precipitation · mm</h4><Chart data={data} labelKey="label" minOverride={0} series={[{ key: "precipMm", label: "WeatherNext total", unit: "mm", color: "#a21caf" }, { key: "referencePrecipMm", label: "Open-Meteo recent past", unit: "mm", color: "#2563eb", dash: "7 4" }]} /></div>
        <div className="min-w-0"><h4 className="mb-3 text-sm font-semibold">WeatherNext grid surface temperature · °C</h4><Chart data={data} labelKey="label" series={[{ key: "surfaceTempMinC", label: "Hourly-mean minimum", unit: "°C", color: "#a21caf", dash: "7 4" }, { key: "surfaceTempMaxC", label: "Hourly-mean maximum", unit: "°C", color: "#a21caf" }]} /></div>
        <div className="min-w-0"><h4 className="mb-3 text-sm font-semibold">WeatherNext 10m surface wind · km/h</h4><Chart data={data} labelKey="label" minOverride={0} series={[{ key: "surfaceWindKph", label: "Peak hourly ensemble mean", unit: "km/h", color: "#a21caf" }]} /></div>
      </div>
      <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[850px] text-left text-xs"><caption className="sr-only">WeatherNext historical surface guidance by local day</caption><thead className="bg-fuchsia-50"><tr>{["Date", "Hours / expected", "2m low / high °C", "10m peak km/h", "Precip mm", "Cloud %", "Low cloud %", "Pressure hPa"].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{rows.map((r: any) => <tr key={r.date} className="border-t"><th className="p-2 font-medium">{r.date}</th><td className="p-2">{r.hoursAvailable}/{r.expectedHours} · precip {r.precipHoursAvailable}/{r.expectedHours}</td><td className="p-2">{show(r.surfaceTempMinC)} / {show(r.surfaceTempMaxC)}</td><td className="p-2">{show(r.surfaceWindKph)}</td><td className="p-2">{show(r.precipMm)}</td><td className="p-2">{show(r.cloudCoverPct, 0)}</td><td className="p-2">{show(r.cloudCoverLowPct, 0)}</td><td className="p-2">{show(r.pressureHpa, 0)}</td></tr>)}</tbody></table></div>
      <details className="text-xs text-slate-500"><summary className="cursor-pointer">Source and method</summary><p className="mt-2">{state.note} Daily temperature extremes are extremes of hourly ensemble means, not member extremes; wind is not a gust. Precipitation intervals ending at local midnight count toward the preceding day.</p><p className="mt-2">{state.attribution}</p><a className="mt-2 inline-block underline" href="https://developers.google.com/earth-engine/datasets/catalog/projects_gcp-public-data-weathernext_assets_weathernext_3_0_0_0p1deg" target="_blank" rel="noreferrer">Google dataset and licence</a></details>
    </>}
  </section>;
}
