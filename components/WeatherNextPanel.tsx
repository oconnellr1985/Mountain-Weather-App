"use client";

import React, { useState } from "react";
import { finite, WEATHER_NEXT_ID, weatherNextInsight } from "@/lib/weather-next-data";
import { CHART_AXIS_FONT_SIZE, modelLineStyle } from "@/lib/forecast-display";
import { usePlotWidth } from "./use-plot-width";

const show = (value: any, unit = "", digits = 1) => finite(value) ? value.toFixed(digits) + unit : "—";

export function WeatherNextSummary({ forecast = [] }: { forecast?: any[] }) {
  const insight = weatherNextInsight(forecast);
  if (!insight) return null;
  return <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-950">
    <strong>{insight.headline}</strong><p className="mt-1 text-xs">{insight.detail}</p>
  </div>;
}

function HourlyBand({ hours, meanKey, lowKey, highKey, title, unit, timeZone }: any) {
  const { ref: plotRef, width } = usePlotWidth();
  const values = hours.flatMap((h: any) => [h[meanKey], h[lowKey], h[highKey]]).filter(finite);
  if (!values.length) return <p className="text-sm text-slate-500">{title}: unavailable</p>;
  const lo = Math.min(...values), hi = Math.max(...values);
  const bottom = meanKey === "surfaceTempC" ? lo - Math.max((hi - lo) * 0.1, 1) : Math.max(0, lo - Math.max((hi - lo) * 0.1, 1));
  const top = hi + Math.max((hi - lo) * 0.1, 1);
  const left = 50, right = Math.max(left + 1, width - 15);
  const x = (i: number) => left + i * (right - left) / Math.max(1, hours.length - 1);
  const y = (v: number) => 195 - (v - bottom) / (top - bottom) * 170;
  const paths = (key: string) => {
    const segments: string[] = [];
    let current = "";
    hours.forEach((h: any, i: number) => {
      if (finite(h[key])) current += (current ? " L" : "M") + x(i) + "," + y(h[key]);
      else if (current) { segments.push(current); current = ""; }
    });
    if (current) segments.push(current);
    return segments;
  };
  const band = hours.every((h: any) => finite(h[lowKey]) && finite(h[highKey]))
    ? hours.map((h: any, i: number) => x(i) + "," + y(h[highKey])).concat(
      [...hours].reverse().map((h: any, i: number) => x(hours.length - 1 - i) + "," + y(h[lowKey]))).join(" ")
    : null;
  const time = (h: any) => new Date(h.validTime).toLocaleTimeString("en-CA", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false });
  const tickIndices = width < 280 ? [0, hours.length - 1] : [0, Math.floor((hours.length - 1) / 2), hours.length - 1];
  return <div className="min-w-0 rounded-xl border bg-white p-3">
    <h4 className="text-sm font-semibold">{title} · {unit}</h4>
    <div ref={plotRef} className="min-w-0"><svg viewBox={"0 0 " + width + " 240"} preserveAspectRatio="none" role="img" aria-label={title + ": hourly ensemble mean and 10th–90th percentile range"} className="h-60 w-full" data-weather-next-plot>
      <title>{title}: hourly mean and P10–P90</title>
      <desc>The shaded band is the distribution at each individual forecast hour. It is not a range for a daily total or daily maximum.</desc>
      {[bottom, (bottom + top) / 2, top].map(v => <g key={v}><line x1={left} y1={y(v)} x2={right} y2={y(v)} stroke="#e2e8f0" /><text x={left - 8} y={y(v) + 4} textAnchor="end" fontSize={CHART_AXIS_FONT_SIZE} fill="#475569">{v.toFixed(1)}</text></g>)}
      {band && <polygon points={band} fill="#f5d0fe" opacity="0.8" />}
      {paths(meanKey).map((d, i) => <path key={i} d={d} fill="none" stroke={modelLineStyle(WEATHER_NEXT_ID).color} strokeWidth="2.5" />)}
      {tickIndices.map((i, n) => <text key={n} x={x(i)} y="222" textAnchor={n === 0 ? "start" : n === tickIndices.length - 1 ? "end" : "middle"} fontSize={CHART_AXIS_FONT_SIZE} fill="#475569">{time(hours[i])}</text>)}
    </svg></div>
    <p className="text-xs text-slate-500">Magenta: ensemble mean · shaded: hourly P10–P90 · times in {timeZone}</p>
  </div>;
}

export function WeatherNextElevationNote({ climb, status = {}, compact = false }: { climb?: any; status?: any; compact?: boolean }) {
  const terrain = status.terrainContext;
  const sample = status.sampling;
  return <div className={compact ? "mb-3 rounded-xl bg-violet-50 p-3 text-xs text-violet-950" : "my-3 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-950"}>
    <p><strong>WeatherNext reference:</strong> 2m air temperature and 10m wind above the model's gridded terrain. <strong>Google model-terrain elevation: not supplied by this feed.</strong>{finite(climb?.summitM) ? " The objective target is " + climb.summitM.toLocaleString() + " m (summit)." : ""}</p>
    {sample && <p className="mt-1">Sampled cell center {sample.latitude.toFixed(3)}°, {sample.longitude.toFixed(3)}° · approximately {sample.widthKm.toFixed(1)} × {sample.heightKm.toFixed(1)} km.</p>}
    {terrain?.status === "available" ? <p className="mt-1">Independent terrain reference across this cell: mean approximately {terrain.referenceMeanM.toLocaleString()} m; range {terrain.referenceMinM.toLocaleString()}–{terrain.referenceMaxM.toLocaleString()} m (NASA/USGS SRTM DEM, sampled at 90m). These are terrain-context elevations, not a verified WeatherNext forecast altitude.</p> : <p className="mt-1">An independent terrain-elevation reference is currently unavailable.</p>}
    {!compact && <p className="mt-2">A grid cell covers valleys, slopes and peaks; selecting summit coordinates does not request the summit's actual height. The 2m/10m figures are heights above the model surface, not elevations above sea level. No summit temperature correction or wind scaling is applied. Compare precipitation and cloud traces across models; use the summit forecasts for summit temperature and wind guidance.</p>}
  </div>;
}

export default function WeatherNextPanel({ forecast = [], status = {}, climb }: { forecast?: any[]; status?: any; climb?: any }) {
  const rows = forecast.map(d => ({ day: d, value: d.modelValues?.find((v: any) => v.modelId === WEATHER_NEXT_ID) })).filter(r => r.value);
  const [chosenDate, setChosenDate] = useState("");
  const selected = rows.find(r => r.day.date === chosenDate) || rows[0];
  const value = selected?.value;
  return <section className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm" aria-label="WeatherNext 3 ensemble forecast">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="font-semibold text-slate-950">Google WeatherNext 3</h3>
        <p className="mt-1 text-sm text-slate-500">Additional ensemble guidance for this objective, at the native 0.1° surface grid.</p></div>
      <span className={"rounded-full px-3 py-1 text-xs " + (status.status === "available" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900")}>
        {status.status === "available" ? "Live model data" : status.status === "stale" ? "Stale · excluded from analysis" : "Data unavailable"}
      </span>
    </div>
    <WeatherNextElevationNote climb={climb} status={status} />
    {!rows.length ? <p className="mt-3 text-sm text-amber-900">{status.message || "WeatherNext has not returned data for this forecast. Existing model analysis remains available."}</p> : <>
      <p className="my-3 text-xs text-slate-600">Run initialized {new Date(value.runStart).toLocaleString("en-CA", { timeZone: "UTC", hour12: false })} UTC · local dates: {value.timeZone}. Complete, fresh local days contribute precipitation, cloud, pressure and solar means to consensus as one source (weight 0.75). Partial days and runs over 24 hours old are excluded.</p>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[900px] text-left text-xs"><caption className="sr-only">WeatherNext daily surface guidance and analysis coverage</caption>
          <thead className="bg-violet-50"><tr>{["Date", "2m temp mean", "10m wind peak*", "Precipitation", "Low cloud", "Pressure", "Coverage", "In analysis"].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
          <tbody>{rows.map(({ day, value: v }) => <tr key={day.date} className="border-t">
            <th className="p-2 font-medium">{day.label} · {day.date}</th>
            <td className="p-2">{show(v.surfaceTempC, "°C")}</td><td className="p-2">{show(v.surfaceWindKph, " km/h")}</td>
            <td className="p-2">{v.completeDay ? show(v.precipMm, " mm") : show(v.sampledPrecipMm, " mm") + " (partial)"}</td>
            <td className="p-2">{show(v.cloudCoverLowPct, "%", 0)}</td><td className="p-2">{show(v.pressureHpa, " hPa", 0)}</td>
            <td className="p-2">{v.hoursAvailable}/{v.expectedHours} h</td>
            <td className="p-2">{v.includeInConsensus ? "Compatible fields" : v.stale ? "No · stale" : "No · partial"}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">*Peak of hourly ensemble-mean 10m wind speeds; no gust or daily-maximum percentile is inferred. Temperature and wind are grid surface values and do not enter the summit/elevation consensus.</p>
      <div className="my-4 flex flex-wrap items-center gap-2"><label htmlFor="weather-next-day" className="text-sm font-medium">Hourly ensemble detail</label>
        <select id="weather-next-day" value={selected.day.date} onChange={e => setChosenDate(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          {rows.map(r => <option key={r.day.date} value={r.day.date}>{r.day.label} · {r.day.date}</option>)}
        </select>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <HourlyBand hours={value.hourly} meanKey="surfaceTempC" lowKey="surfaceTempP10C" highKey="surfaceTempP90C" title="2m surface temperature" unit="°C" timeZone={value.timeZone} />
        <HourlyBand hours={value.hourly} meanKey="surfaceWindKph" lowKey="surfaceWindP10Kph" highKey="surfaceWindP90Kph" title="10m surface wind" unit="km/h" timeZone={value.timeZone} />
        <HourlyBand hours={value.hourly} meanKey="precipMm" lowKey="precipP10Mm" highKey="precipP90Mm" title="Hourly precipitation" unit="mm" timeZone={value.timeZone} />
      </div>
      <p className="mt-3 text-xs text-slate-600">Percentile bands apply to individual hours. They are not summed into a daily precipitation range or treated as probabilities for a route window. Rain/snow partition and freezing level are unavailable in this feed.</p>
    </>}
    <details className="mt-4 text-xs text-slate-500"><summary className="cursor-pointer">Source, experimental status and terms</summary>
      <p className="mt-2">Source: Google Earth Engine, WeatherNext 3 gridded collection. Modified by point sampling, unit conversion and local-day aggregation, with compatible fields combined with other forecast models.</p>
      <p className="mt-2">Copyright 2024-6 Google LLC. Experimental WeatherNext output is supplied through Google Earth Engine under <a className="underline" href="https://storage.googleapis.com/weathernext-public/terms-of-use.pdf" target="_blank" rel="noreferrer">WeatherNext terms of use</a>. These predictions have not been validated for operational decisions.</p>
      <p className="mt-2">WeatherNext is an additional experimental source. Continue to review official forecasts, alerts, avalanche bulletins and observations.</p>
    </details>
  </section>;
}
