"use client";

import { useEffect, useState } from "react";

export default function WeatherNextVerification({ climb, timeZone }: any) {
  const [station, setStation] = useState("");
  const [requestedStation, setRequestedStation] = useState("");
  const [result, setResult] = useState<any>();
  useEffect(() => {
    if (!requestedStation || !timeZone) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ lat: climb.lat, lon: climb.lon, timeZone, station: requestedStation });
    fetch("/api/weather-next-history?" + query, { signal: controller.signal })
      .then(response => response.json())
      .then(data => { if (!controller.signal.aborted) setResult(data); })
      .catch(() => { if (!controller.signal.aborted) setResult({ message: "Station verification is unavailable." }); });
    return () => controller.abort();
  }, [requestedStation, timeZone, climb.lat, climb.lon]);

  return <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
    <h3 className="font-semibold">WeatherNext precipitation verification</h3>
    <p className="text-sm text-slate-600">Choose a representative ECCC station. The app samples WeatherNext at the station coordinates and matches forecast and observed hours over the last 14 complete local days. Station results describe conditions at the station.</p>
    <form className="flex flex-wrap items-end gap-2" onSubmit={event => {
      event.preventDefault();
      const id = station.trim().toUpperCase();
      if (id !== requestedStation) { setResult(undefined); setRequestedStation(id); }
    }}>
      <label className="text-sm">ECCC climate identifier
        <input required pattern="[A-Za-z0-9]{7}" maxLength={7} value={station} onChange={event => setStation(event.target.value)} className="mt-1 block rounded border px-2 py-1" />
      </label>
      <button disabled={!timeZone} className="rounded border px-3 py-1 text-sm">Compare</button>
      <a className="text-sm underline" href="https://climate.weather.gc.ca/historical_data/search_historic_data_e.html" target="_blank" rel="noreferrer">Find a station</a>
    </form>
    {requestedStation && !result && <p role="status">Matching station observations…</p>}
    {result?.message && <p role="status">{result.message}</p>}
    {result?.station && <>
      <p className="text-sm">{result.station.name} ({result.station.id}) · {result.station.lat.toFixed(3)}°, {result.station.lon.toFixed(3)}°</p>
      <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs">
        <caption className="sr-only">WeatherNext precipitation verification by fixed forecast lead</caption>
        <thead><tr>{["Lead", "Paired hours", "Hits", "Misses", "False alarms", "Complete days", "Daily bias (mm)", "Daily MAE (mm)"].map(label => <th className="p-2" key={label}>{label}</th>)}</tr></thead>
        <tbody>{result.rows.map((row: any) => <tr key={row.lead} className="border-t"><th className="p-2">{row.lead}–{row.lead + 5} h</th>
          {row.unavailable ? <td colSpan={7} className="p-2">Archive unavailable for this lead</td> :
            [row.hours, row.hits, row.misses, row.falseAlarms, row.completeDays, row.dailyBiasMm?.toFixed(1), row.dailyMaeMm?.toFixed(1)].map((value, i) => <td key={i} className="p-2">{value ?? "—"}</td>)}
        </tr>)}</tbody>
      </table></div>
      <p className="text-xs text-slate-600">Lead bands use main cycles at 00, 06, 12 and 18 UTC to cover every valid hour, including beyond interim coverage. Wet hour ≥ 0.2 mm. Daily errors require complete matched days at each lead. Positive bias means the forecast was wetter. Observation coverage can differ by lead. This comparison does not change scoring weights.</p>
      <p className="text-xs text-slate-500">Observations from Environment and Climate Change Canada. © 2026 DeepMind Technologies Limited. WeatherNext model data via the <a className="underline" href="https://developers.google.com/earth-engine/datasets/catalog/projects_gcp-public-data-weathernext_assets_weathernext_3_0_0_0p1deg">Earth Engine catalog</a> under CC BY 4.0.</p>
    </>}
  </section>;
}
