"use client";

import { useEffect, useState } from "react";
import { finite } from "@/lib/weather-next-data";

export default function WeatherNextInterim({ climb, timeZone, mainStart, mainHours }: any) {
  const [result, setResult] = useState<any>();
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ lat: climb.lat, lon: climb.lon, timeZone, mode: "interim" });
    fetch("/api/weather-next-history?" + query, { signal: controller.signal })
      .then(response => response.json())
      .then(data => { if (!controller.signal.aborted) setResult(data); })
      .catch(() => { if (!controller.signal.aborted) setResult({ message: "Interim guidance is unavailable." }); });
    return () => controller.abort();
  }, [climb.lat, climb.lon, timeZone]);

  if (!result) return <p role="status">Loading the latest interim cycle…</p>;
  if (result.status !== "available" || Date.parse(result.runStart) <= Date.parse(mainStart)) {
    return <p role="status">{result.message || "No newer interim cycle is available."}</p>;
  }
  const mainByTime = new Map<string, number>(mainHours.map((hour: any) => [hour.validTime, hour.precipMm]));
  const pairs = result.hours.flatMap((hour: any) => {
    const main = mainByTime.get(hour.validTime);
    return Date.parse(hour.validTime) > Date.now() && finite(main) && finite(hour.precipMm)
      ? [{ time: hour.validTime, main, interim: hour.precipMm }] : [];
  }).sort((a: any, b: any) => a.time.localeCompare(b.time));
  const publicationLag = (result.ingestionTime - Date.parse(result.runStart)) / 3600000;
  const local = (time: string) => new Date(time).toLocaleString("en-CA", { timeZone, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short" });
  return <div className="space-y-2 text-sm">
    <p>Main initialized {mainStart} · interim initialized {result.runStart} · interim valid through {result.latestValidTime} (UTC).</p>
    {finite(result.ingestionTime) && publicationLag >= 0 && <p>The 48-hour asset reached Earth Engine {publicationLag.toFixed(1)} hours after initialization.</p>}
    <p>{pairs.length} matched future hours. First and last wet hours below refer to the matched period and use ≥ 0.2 mm in one hour.</p>
    {pairs.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-xs">
      <thead><tr>{["Cycle", "First wet hour ending", "Last wet hour ending", "Total over matched hours"].map(label => <th className="p-2" key={label}>{label}</th>)}</tr></thead>
      <tbody>{(["main", "interim"] as const).map(key => {
        const wet = pairs.filter((pair: any) => pair[key] >= 0.2);
        return <tr key={key} className="border-t"><th className="p-2 capitalize">{key}</th><td className="p-2">{wet.length ? local(wet[0].time) : "None"}</td><td className="p-2">{wet.length ? local(wet[wet.length - 1].time) : "None"}</td><td className="p-2">{pairs.reduce((total: number, pair: any) => total + pair[key], 0).toFixed(1)} mm</td></tr>;
      })}</tbody>
    </table></div>}
    <p className="text-xs text-slate-600">Grid-area precipitation guidance. The interim cycle is for comparison only and does not change window scores or alerts.</p>
  </div>;
}
