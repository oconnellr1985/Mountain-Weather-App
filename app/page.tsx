"use client";
// @ts-nocheck

import React, { useEffect, useMemo, useState } from "react";

const climbs = [
  // Added Washington Cascades spring ski + alpine objectives
  { id: "robson-kain", name: "Mount Robson — Kain Face", region: "Canadian Rockies", lat: 53.11, lon: -119.156, summitM: 3954, style: "mixed alpine / ice", routeType: "mixed_alpine_ice", defaultMode: "summer", activeFromMonth: 7, thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 0, maxPrecipMm3Day: 0, minFreezingLevelM: 2800, maxFreezingLevelM: 4300, idealFreezingLevelM: 3600, minSummitTempC: -15, idealSummitTempMinC: -10, maxSummitTempC: 2, coldSummitPenaltyPerC: 0.25, windPenaltyPerKph: 0.12, precipPenaltyPerMm: 0.45, strictNoPrecip: true, requiresOvernightFreeze: true, requiresClearSkies: true } },
  { id: "sir-donald-nw-ridge", name: "Mount Sir Donald — NW Ridge", region: "Selkirks", lat: 51.263, lon: -117.437, summitM: 3284, style: "pure alpine rock", routeType: "pure_rock", defaultMode: "summer", activeFromMonth: 7, thresholds: { maxSummitWindKph: 35, maxPrecipMm24h: 0, maxPrecipMm3Day: 0, minFreezingLevelM: 3400, maxFreezingLevelM: 5200, windPenaltyPerKph: 0.06, precipPenaltyPerMm: 1.2, rockDryObjective: true, minSummitTempC: 1, idealSummitTempC: 8, idealValleyTempC: 30, strictNoPrecip: true, requiresClearSkies: true } },
  { id: "bugaboo-spire", name: "Bugaboo Spire — Kain Route", region: "Purcells", lat: 50.736, lon: -116.771, summitM: 3204, style: "pure alpine rock", routeType: "pure_rock", defaultMode: "summer", activeFromMonth: 7, thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 0.5, maxPrecipMm3Day: 1, minFreezingLevelM: 3200, maxFreezingLevelM: 5000, minSummitTempC: 0, idealSummitTempC: 6, precipPenaltyPerMm: 0.9, rockDryObjective: true, requiresClearSkies: true } },
  { id: "adams-sw-chutes", name: "Mount Adams — SW Chutes", region: "Washington Cascades", lat: 46.202, lon: -121.49, summitM: 3743, style: "spring ski mountaineering / corn cycle", routeType: "ski_corn", defaultMode: "winter", activeFromMonth: 1, thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 0.5, maxPrecipMm3Day: 1.5, minFreezingLevelM: 2600, maxFreezingLevelM: 4300, idealFreezingLevelM: 3800, windPenaltyPerKph: 0.11, precipPenaltyPerMm: 0.55, skiCornObjective: true, idealPressureHpa: 1018, idealMidTempMinC: -4, idealMidTempMaxC: 7, idealSummitTempMinC: -8, idealSummitTempMaxC: 4, excessiveSummitTempC: 7, requiresOvernightFreeze: true, requiresClearSkies: true } },
  { id: "temple-aemmer", name: "Mount Temple — Aemmer Couloir", region: "Canadian Rockies", lat: 51.35, lon: -116.207, summitM: 3544, style: "winter alpine / steep snow", routeType: "mixed_alpine_ice", defaultMode: "winter", activeFromMonth: 1, thresholds: { maxSummitWindKph: 35, maxPrecipMm24h: 2, maxPrecipMm3Day: 4, minFreezingLevelM: 1200, maxFreezingLevelM: 3300, idealFreezingLevelM: 2600, minSummitTempC: -18, maxSummitTempC: 0, requiresOvernightFreeze: true, requiresClearSkies: true } },
  { id: "st-helens-worm-flows", name: "Mount St Helens — Worm Flows", region: "Washington Cascades", lat: 46.191, lon: -122.194, summitM: 2549, style: "spring ski mountaineering / corn cycle", routeType: "ski_corn", defaultMode: "winter", activeFromMonth: 1, thresholds: { maxSummitWindKph: 35, maxPrecipMm24h: 0.5, maxPrecipMm3Day: 1.5, minFreezingLevelM: 1800, maxFreezingLevelM: 3200, idealFreezingLevelM: 2550, windPenaltyPerKph: 0.09, precipPenaltyPerMm: 0.5, skiCornObjective: true, idealPressureHpa: 1018, idealMidTempMinC: -4, idealMidTempMaxC: 8, idealSummitTempMinC: -8, idealSummitTempMaxC: 5, excessiveSummitTempC: 8, requiresOvernightFreeze: true, requiresClearSkies: true } },
  { id: "liberty-pass-birthday-tour", name: "Liberty Pass — Birthday Tour", region: "Washington Cascades", lat: 48.52, lon: -120.66, summitM: 2135, style: "spring ski tour / corn cycle", routeType: "ski_corn", defaultMode: "winter", activeFromMonth: 1, thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 0.5, maxPrecipMm3Day: 1.5, minFreezingLevelM: 1500, maxFreezingLevelM: 2800, idealFreezingLevelM: 2200, windPenaltyPerKph: 0.10, precipPenaltyPerMm: 0.5, skiCornObjective: true, idealPressureHpa: 1018, idealMidTempMinC: -4, idealMidTempMaxC: 7, idealSummitTempMinC: -8, idealSummitTempMaxC: 5, excessiveSummitTempC: 8, requiresOvernightFreeze: true, requiresClearSkies: true } },
  { id: "north-twin-north-face", name: "North Twin, WA — North Face", region: "Washington Cascades", lat: 48.762, lon: -121.689, summitM: 2026, style: "spring ski mountaineering / corn cycle", routeType: "ski_corn", defaultMode: "winter", activeFromMonth: 1, thresholds: { maxSummitWindKph: 35, maxPrecipMm24h: 0.75, maxPrecipMm3Day: 2, minFreezingLevelM: 1200, maxFreezingLevelM: 2600, idealFreezingLevelM: 2100, windPenaltyPerKph: 0.10, precipPenaltyPerMm: 0.55, skiCornObjective: true, idealPressureHpa: 1018, idealMidTempMinC: -4, idealMidTempMaxC: 7, idealSummitTempMinC: -8, idealSummitTempMaxC: 5, excessiveSummitTempC: 8, requiresOvernightFreeze: true, requiresClearSkies: true } },
  { id: "shuksan-north-face", name: "Mount Shuksan — North Face", region: "Washington Cascades", lat: 48.832, lon: -121.602, summitM: 2783, style: "spring ski mountaineering / glaciated corn cycle", routeType: "ski_corn", defaultMode: "winter", activeFromMonth: 1, thresholds: { maxSummitWindKph: 35, maxPrecipMm24h: 0.75, maxPrecipMm3Day: 2, minFreezingLevelM: 1700, maxFreezingLevelM: 3300, idealFreezingLevelM: 2800, windPenaltyPerKph: 0.10, precipPenaltyPerMm: 0.6, skiCornObjective: true, idealPressureHpa: 1018, idealMidTempMinC: -4, idealMidTempMaxC: 7, idealSummitTempMinC: -9, idealSummitTempMaxC: 4, excessiveSummitTempC: 7, requiresOvernightFreeze: true, requiresClearSkies: true } },
  { id: "rainier-fuhrer-finger", name: "Mount Rainier — Fuhrer Finger", region: "Washington Cascades", lat: 46.852, lon: -121.76, summitM: 4392, style: "spring ski mountaineering / corn cycle", routeType: "ski_corn", defaultMode: "winter", activeFromMonth: 1, thresholds: { maxSummitWindKph: 35, maxPrecipMm24h: 0.75, maxPrecipMm3Day: 2, minFreezingLevelM: 3000, maxFreezingLevelM: 4700, idealFreezingLevelM: 4300, windPenaltyPerKph: 0.11, precipPenaltyPerMm: 0.65, skiCornObjective: true, idealPressureHpa: 1018, idealMidTempMinC: -5, idealMidTempMaxC: 6, idealSummitTempMinC: -12, idealSummitTempMaxC: 2, excessiveSummitTempC: 5, requiresOvernightFreeze: true, requiresClearSkies: true } },
];

const FORECAST_MODEL_CATALOG = [
  { id: "gfs", label: "GFS", provider: "NOAA via Open-Meteo", maxLeadDays: 16, regions: ["global"] },
  { id: "gem_global", label: "GEM Global / GDPS", provider: "ECCC via Open-Meteo", maxLeadDays: 10, regions: ["global"] },
  { id: "gem_regional", label: "GEM Regional / RDPS", provider: "ECCC via Open-Meteo", maxLeadDays: 3.5, regions: ["canada"] },
  { id: "gem_hrdps_continental", label: "HRDPS Continental", provider: "ECCC via Open-Meteo", maxLeadDays: 2, regions: ["canada"] },
  { id: "nam_conus", label: "NAM CONUS", provider: "NOAA via Open-Meteo", maxLeadDays: 4, regions: ["usa"] },
  { id: "gfs_hrrr", label: "HRRR", provider: "NOAA via Open-Meteo", maxLeadDays: 2, regions: ["usa"] },
  { id: "noaa_rap", label: "RAP", provider: "NOAA direct connector required", maxLeadDays: 1, regions: ["usa"] },
  { id: "ecmwf_ifs025", label: "ECMWF IFS", provider: "ECMWF via Open-Meteo", maxLeadDays: 15, regions: ["global"] },
  { id: "ecmwf_aifs025", label: "ECMWF AIFS", provider: "ECMWF via Open-Meteo", maxLeadDays: 15, regions: ["global"] },
];

function Card({ children, className = "" }) { return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>; }
function CardContent({ children, className = "" }) { return <div className={className}>{children}</div>; }
function Button({ children, variant = "solid", className = "", ...props }) { const styles = variant === "outline" ? "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50" : "bg-slate-900 text-white hover:bg-slate-700"; return <button className={`rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`} {...props}>{children}</button>; }
function Badge({ children, className = "", variant = "solid" }) { const styles = variant === "outline" ? "border border-slate-300 bg-white text-slate-700" : variant === "secondary" ? "bg-slate-100 text-slate-700" : "bg-slate-900 text-white"; return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles} ${className}`}>{children}</span>; }
function SelectBox({ value, onChange, options, className = "" }) { return <select value={value} onChange={(e) => onChange(e.target.value)} className={`rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${className}`}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>; }
function Icon({ children, className = "h-4 w-4" }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>; }
const AlertIcon = (p) => <Icon {...p}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></Icon>;
const MountainIcon = (p) => <Icon {...p}><path d="m8 21 4-7 4 7" /><path d="M3 21 12 3l9 18" /><path d="M12 3v11" /></Icon>;
const SunIcon = (p) => <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M2 12h2" /><path d="M20 12h2" /></Icon>;
const WindIcon = (p) => <Icon {...p}><path d="M3 8h12a3 3 0 1 0-3-3" /><path d="M3 12h17" /><path d="M3 16h12a3 3 0 1 1-3 3" /></Icon>;
const SnowIcon = (p) => <Icon {...p}><path d="M12 2v20" /><path d="M2 12h20" /><path d="m17 5-10 14" /><path d="m7 5 10 14" /></Icon>;
const RainIcon = (p) => <Icon {...p}><path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9" /><path d="M8 19v1" /><path d="M16 19v1" /><path d="M12 21v1" /></Icon>;
const GaugeIcon = (p) => <Icon {...p}><path d="M12 14l4-4" /><path d="M3.3 19a9 9 0 1 1 17.4 0" /><path d="M5 19h14" /></Icon>;
const TrendIcon = (p) => <Icon {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M14 7h7v7" /></Icon>;
const ShieldIcon = (p) => <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></Icon>;

const clampScore = (value) => Math.max(0, Math.min(10, Number(value) || 0));
const avg = (values = []) => { const clean = values.filter((v) => typeof v === "number" && Number.isFinite(v)); return clean.length ? clean.reduce((s, v) => s + v, 0) / clean.length : 0; };
const spread = (values = []) => { const clean = values.filter((v) => typeof v === "number" && Number.isFinite(v)); return clean.length > 1 ? Math.max(...clean) - Math.min(...clean) : 0; };
function getObjectiveRegion(climb) { if (climb.region.includes("Washington")) return "usa"; if (climb.region.includes("Canadian") || climb.region.includes("Selkirks") || climb.region.includes("Purcells")) return "canada"; return "global"; }
function modelAppliesToClimb(model, climb) { if (!model || !climb) return false; const region = getObjectiveRegion(climb); return model.regions.includes("global") || model.regions.includes(region); }
function scoreColor(score, inverse = false) { const v = inverse ? 10 - score : score; return v >= 7.5 ? "text-emerald-700" : v >= 5 ? "text-yellow-700" : "text-red-700"; }
function dangerStyle(d) { if (d <= 0) return { backgroundColor: "#e5e7eb", color: "#111827", border: "1px solid #cbd5e1" }; if (d === 1) return { backgroundColor: "#00a651", color: "#fff" }; if (d === 2) return { backgroundColor: "#fff200", color: "#111827" }; if (d === 3) return { backgroundColor: "#f7941d", color: "#111827" }; if (d === 4) return { backgroundColor: "#ed1c24", color: "#fff" }; return { backgroundColor: "#000", color: "#fff" }; }
function DangerBadge({ rating }) { const labels = ["No Rating", "Low", "Moderate", "Considerable", "High", "Extreme"]; return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" style={dangerStyle(rating)}>{labels[rating] || "No Rating"}</span>; }

async function fetchJsonSafe(url) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, data: null, error: data.error || `${response.status} ${response.statusText}` };
    return { ok: true, data, error: "" };
  } catch (error) {
    return { ok: false, data: null, error: error?.message || "Network request failed" };
  }
}

async function fetchWeatherFromBackend(climb) {
  const url = `/api/weather?climbId=${encodeURIComponent(climb.id)}&lat=${climb.lat}&lon=${climb.lon}&summitM=${climb.summitM}&region=${encodeURIComponent(getObjectiveRegion(climb))}`;
  const result = await fetchJsonSafe(url);
  if (!result.ok) return { ok: false, forecast: [], history: [], source: "NO DATA", unavailableModels: [], error: `Weather backend failed: ${result.error}` };
  const data = result.data || {};
  if (!Array.isArray(data.forecast) || data.forecast.length < 3) return { ok: false, forecast: [], history: [], source: data.source || "NO DATA", unavailableModels: data.unavailableModels || [], error: "Weather backend returned insufficient forecast data." };
  return { ok: true, forecast: data.forecast, history: Array.isArray(data.history) ? data.history : [], source: data.source || "Weather backend", unavailableModels: data.unavailableModels || [], error: "" };
}

async function fetchAvalancheFromBackend(climb) {
  const url = `/api/avalanche?climbId=${encodeURIComponent(climb.id)}&lat=${climb.lat}&lon=${climb.lon}&region=${encodeURIComponent(getObjectiveRegion(climb))}`;
  const result = await fetchJsonSafe(url);
  if (!result.ok) return { ok: false, avalancheHistory: [], source: "NO LIVE AVALANCHE DATA", summary: { headline: `Live avalanche data unavailable: ${result.error}`, riskScore: 0, last: { alpine: 0, problems: [] }, persistentDays: 0, windSlabDays: 0 }, error: result.error };
  const data = result.data || {};
  return { ok: true, avalancheHistory: Array.isArray(data.avalancheHistory) ? data.avalancheHistory : [], source: data.source || "Live avalanche API", summary: data.summary || { headline: "No current avalanche bulletin was returned for this objective.", riskScore: 0, last: { alpine: 0, problems: [] }, persistentDays: 0, windSlabDays: 0 }, error: "" };
}

function meanDayValue(day, lowKey, highKey) { return ((day[lowKey] || 0) + (day[highKey] || 0)) / 2; }
function daySummitTemp(day) { return meanDayValue(day, "summitTempGfsC", "summitTempEcmwfC"); }
function dayMidTemp(day) { return meanDayValue(day, "midTempGfsC", "midTempEcmwfC"); }
function dayValleyTemp(day) { return meanDayValue(day, "valleyTempGfsC", "valleyTempEcmwfC"); }
function dayPrecip(day) { return meanDayValue(day, "precipGfsMm", "precipEcmwfMm"); }
function dayWind(day) { return meanDayValue(day, "summitWindGfsKph", "summitWindEcmwfKph"); }
function distancePenalty(value, ideal, tolerance, weight = 1) { if (typeof value !== "number" || typeof ideal !== "number") return 0; const delta = Math.abs(value - ideal); return Math.max(0, delta - tolerance) * weight; }
function routeTypeLabel(climb) {
  if (climb.routeType === "ski_corn") return "Corn-cycle ski objective";
  if (climb.routeType === "pure_rock") return "Dry warm rock objective";
  if (climb.routeType === "mixed_alpine_ice") return "Mixed alpine / ice objective";
  return "General alpine objective";
}
function routeTypeDescription(climb) {
  if (climb.routeType === "ski_corn") return "Overnight freeze + daytime thaw near summit for corn timing.";
  if (climb.routeType === "pure_rock") return "Dry, warm, no precip, freezing level above route.";
  if (climb.routeType === "mixed_alpine_ice") return "Clear, low precip, manageable wind, useful freeze/refreeze.";
  return "General alpine objective.";
}
function scoreWindowForDays(climb, forecastDays = []) {
  if (!climb || forecastDays.length === 0) return 0;
  const t = climb.thresholds || {};
  const routeType = climb.routeType || "general_alpine";
  const windThreshold = t.maxSummitWindKph ?? 35;
  const dailyPrecipThreshold = t.maxPrecipMm24h ?? 2;
  const maxPrecip3Day = t.maxPrecipMm3Day ?? dailyPrecipThreshold * forecastDays.length;
  const cumulativePrecip = forecastDays.reduce((s, d) => s + dayPrecip(d), 0);
  const windPenalty = forecastDays.reduce((s, d) => s + Math.max(0, (dayWind(d) - windThreshold) * (t.windPenaltyPerKph ?? 0.08)), 0);
  const dailyPrecipPenalty = forecastDays.reduce((s, d) => s + Math.max(0, (dayPrecip(d) - dailyPrecipThreshold) * (t.precipPenaltyPerMm ?? 0.5)), 0);
  const cumulativePrecipPenalty = Math.max(0, (cumulativePrecip - maxPrecip3Day) * (t.precipPenaltyPerMm ?? 0.5));
  const strictPrecipPenalty = t.strictNoPrecip && cumulativePrecip > 0 ? 0.8 + cumulativePrecip * 0.35 : 0;
  let routePenalty = 0;

  if (routeType === "ski_corn") {
    // Goal: overnight freeze, clear/high pressure, then daytime warming with freezing level near the summit.
    // For spring ski objectives, summit temps near/just above 0°C can be GOOD, not bad.
    routePenalty += forecastDays.reduce((s, d) => {
      const summitTemp = daySummitTemp(d);
      const summitLow = typeof d.summitTempMinAvgC === "number" ? d.summitTempMinAvgC : summitTemp;
      const summitHigh = typeof d.summitTempMaxAvgC === "number" ? d.summitTempMaxAvgC : summitTemp;
      const midTemp = dayMidTemp(d);
      const freezingLevel = d.freezingLevelM || 0;
      let p = 0;
      if ((d.pressureHpa || 0) < (t.idealPressureHpa ?? 1018)) p += 0.35;
      p += distancePenalty(freezingLevel, t.idealFreezingLevelM ?? climb.summitM, 500, 0.001);
      if (freezingLevel > (t.maxFreezingLevelM ?? climb.summitM + 500)) p += 0.8 + (freezingLevel - (t.maxFreezingLevelM ?? climb.summitM + 500)) * 0.0008;
      if (freezingLevel < (t.minFreezingLevelM ?? climb.summitM - 1200)) p += 0.5;
      if (summitLow > -0.5) p += 1.0;
      if (summitHigh < -1.5) p += 0.8;
      if (summitHigh > (t.excessiveSummitTempC ?? 7)) p += 1.0 + (summitHigh - (t.excessiveSummitTempC ?? 7)) * 0.25;
      if (summitTemp < (t.idealSummitTempMinC ?? -10)) p += Math.min(1.0, ((t.idealSummitTempMinC ?? -10) - summitTemp) * 0.10);
      if (midTemp < (t.idealMidTempMinC ?? -4)) p += 0.4;
      if (midTemp > (t.idealMidTempMaxC ?? 7)) p += 0.5;
      return s + p;
    }, 0);
  } else if (routeType === "pure_rock") {
    // Goal: dry, clear, warm rock. Freezing level should be above summit and summit temps should be above freezing.
    routePenalty += forecastDays.reduce((s, d) => {
      const summitTemp = daySummitTemp(d);
      const valleyTemp = dayValleyTemp(d);
      const precip = dayPrecip(d);
      const freezingLevel = d.freezingLevelM || 0;
      let p = 0;
      if (precip > 0) p += 1.5 + precip * (t.precipPenaltyPerMm ?? 1.0);
      if (summitTemp < (t.minSummitTempC ?? 0)) p += 2.5 + Math.abs(summitTemp - (t.minSummitTempC ?? 0)) * 0.7;
      if (summitTemp < (t.idealSummitTempC ?? 6)) p += Math.max(0, ((t.idealSummitTempC ?? 6) - summitTemp) * 0.18);
      if (freezingLevel < (t.minFreezingLevelM ?? climb.summitM + 100)) p += 1.5;
      if (valleyTemp < (t.idealValleyTempC ?? 25)) p += Math.min(1.5, ((t.idealValleyTempC ?? 25) - valleyTemp) * 0.08);
      return s + p;
    }, 0);
  } else if (routeType === "mixed_alpine_ice") {
    // Goal: clear weather, low precip, manageable wind, and a freeze/refreeze without extreme cold or sloppy heat.
    routePenalty += forecastDays.reduce((s, d) => {
      const summitTemp = daySummitTemp(d);
      const freezingLevel = d.freezingLevelM || 0;
      let p = 0;
      if (summitTemp < (t.minSummitTempC ?? -18)) p += 1.0 + ((t.minSummitTempC ?? -18) - summitTemp) * 0.18;
      if (typeof t.maxSummitTempC === "number" && summitTemp > t.maxSummitTempC) p += 1.0 + (summitTemp - t.maxSummitTempC) * 0.3;
      if (freezingLevel > (t.maxFreezingLevelM ?? climb.summitM + 300)) p += 1.0;
      if (freezingLevel < (t.minFreezingLevelM ?? climb.summitM - 1200)) p += 0.4;
      if (typeof t.idealFreezingLevelM === "number") p += distancePenalty(freezingLevel, t.idealFreezingLevelM, 700, 0.0008);
      return s + p;
    }, 0);
  } else {
    routePenalty += forecastDays.reduce((s, d) => s + ((d.freezingLevelM < (t.minFreezingLevelM ?? 0) || d.freezingLevelM > (t.maxFreezingLevelM ?? 9999)) ? 0.8 : 0), 0);
  }

  return clampScore(10 - windPenalty - dailyPrecipPenalty - cumulativePrecipPenalty - strictPrecipPenalty - routePenalty);
}
function scoreImmediateGoWindow(climb, forecast = []) {
  if (!forecast.length) return 0;
  const routeType = climb.routeType || "general_alpine";
  const daysToScore = routeType === "ski_corn" ? forecast.slice(0, 2) : forecast.slice(0, 1);
  return scoreWindowForDays(climb, daysToScore);
}
function scorePatternStability(climb, forecast = []) { return scoreWindowForDays(climb, forecast.slice(0, 3)); }
function scoreWindow(climb, forecast = []) { return scorePatternStability(climb, forecast); }
function watchStatusForWindow(bestWindow) {
  if (!bestWindow || !bestWindow.label || bestWindow.label === "NO DATA") return "NO DATA";
  if (bestWindow.leadDays <= 2) return "Immediate / verify now";
  if (bestWindow.leadDays <= 5) return "Approaching — watch closely";
  if (bestWindow.leadDays <= 10) return "Forming — monitor model agreement";
  return "Early signal — low confidence watch";
}
function scoreConfidence(history = [], forecast = [], startIndex = 0) { const recent = history.slice(-4); const modelWindow = forecast.slice(startIndex, startIndex + 5); const modelSpread = avg(modelWindow.map((d) => d.modelStats ? d.modelStats.windSpreadKph + d.modelStats.precipSpreadMm * 4 + d.modelStats.tempSpreadC * 1.5 : Math.abs((d.summitWindGfsKph || 0) - (d.summitWindEcmwfKph || 0)) + Math.abs((d.precipGfsMm || 0) - (d.precipEcmwfMm || 0)) * 4 + Math.abs((d.summitTempGfsC || 0) - (d.summitTempEcmwfC || 0)) * 1.5)); const historyBonus = recent.length ? 0.8 : 0; return clampScore(8.2 + historyBonus - modelSpread * 0.08 - startIndex * 0.35); }
function findBestUpcomingWindow(climb, history = [], forecast = [], windowLength = 3) { if (forecast.length < windowLength) return { label: "NO DATA", windowLength: 0, leadDays: 0, quality: 0, confidence: 0 }; const candidates = []; for (let start = 0; start <= forecast.length - windowLength; start++) { const quality = scoreWindowForDays(climb, forecast.slice(start, start + windowLength)); const confidence = scoreConfidence(history, forecast, start); candidates.push({ startDay: start + 1, endDay: start + windowLength, windowLength, leadDays: start + 1, quality, confidence, selectionScore: quality * 3 + confidence * 0.25 - (start + 1) * 0.08, label: `D+${start + 1} to D+${start + windowLength}` }); } const positive = candidates.filter((c) => c.quality > 0.25); return (positive.length ? positive : candidates).sort((a, b) => b.selectionScore - a.selectionScore)[0]; }
function classifyPattern(history = [], forecast = []) { if (!history.length || forecast.length < 3) return "insufficient data"; const recent = history.slice(-5); const dryDays = recent.filter((d) => (d.observedPrecipMm || 0) < 2).length; const highPressureDays = recent.filter((d) => (d.pressureHpa || 0) >= 1018).length; const upcomingDry = forecast.slice(0, 3).filter((d) => ((d.precipGfsMm || 0) + (d.precipEcmwfMm || 0)) / 2 < 2).length; if (dryDays >= 4 && highPressureDays >= 4 && upcomingDry >= 3) return "entrenched high pressure"; if (dryDays <= 2 && upcomingDry >= 2) return "short clearing blip after storm cycle"; return "unstable transition"; }

function runTests() {
  const robson = climbs[0];
  const sirD = climbs.find((c) => c.id === "sir-donald-nw-ridge");
  const adams = climbs.find((c) => c.id === "adams-sw-chutes");
  console.assert(scoreWindowForDays(robson, [{ summitWindGfsKph: 5, summitWindEcmwfKph: 5, summitTempGfsC: -30, summitTempEcmwfC: -30, precipGfsMm: 0, precipEcmwfMm: 0, freezingLevelM: 3600, pressureHpa: 1030 }, { summitWindGfsKph: 5, summitWindEcmwfKph: 5, summitTempGfsC: -30, summitTempEcmwfC: -30, precipGfsMm: 0, precipEcmwfMm: 0, freezingLevelM: 3600, pressureHpa: 1030 }, { summitWindGfsKph: 5, summitWindEcmwfKph: 5, summitTempGfsC: -30, summitTempEcmwfC: -30, precipGfsMm: 0, precipEcmwfMm: 0, freezingLevelM: 3600, pressureHpa: 1030 }]) < 7, "Robson -30C should not score as strong");
  console.assert(scoreWindowForDays(sirD, [{ summitWindGfsKph: 10, summitWindEcmwfKph: 10, summitTempGfsC: -1, summitTempEcmwfC: -1, valleyTempGfsC: 18, valleyTempEcmwfC: 18, precipGfsMm: 0, precipEcmwfMm: 0, freezingLevelM: 2900, pressureHpa: 1025 }]) < 6, "Pure rock below-freezing summit should score poorly");
  console.assert(scoreWindowForDays(adams, [{ summitWindGfsKph: 10, summitWindEcmwfKph: 10, summitTempGfsC: -1, summitTempEcmwfC: 0, summitTempMinAvgC: -5, summitTempMaxAvgC: 3.4, midTempGfsC: 1, midTempEcmwfC: 2, precipGfsMm: 0, precipEcmwfMm: 0.1, freezingLevelM: 3800, pressureHpa: 1022 }]) > 7, "Corn objective should reward overnight freeze plus daytime summit thaw near 0C");
  console.assert(findBestUpcomingWindow(robson, [], []).label === "NO DATA", "No forecast should return NO DATA window");
  console.assert(modelAppliesToClimb(FORECAST_MODEL_CATALOG.find((m) => m.id === "gfs_hrrr"), climbs.find((c) => c.id === "adams-sw-chutes")), "HRRR should apply to US objectives");
  console.assert(modelAppliesToClimb(FORECAST_MODEL_CATALOG.find((m) => m.id === "gem_hrdps_continental"), climbs.find((c) => c.id === "robson-kain")), "HRDPS should apply to Canadian objectives");
  console.assert(climbs.find((c) => c.id === "st-helens-worm-flows")?.routeType === "ski_corn", "St Helens Worm Flows should be a corn-cycle ski objective");
  console.assert(climbs.find((c) => c.id === "shuksan-north-face")?.routeType === "ski_corn", "Shuksan North Face should be treated as a spring ski / corn-cycle objective");
  console.assert(climbs.find((c) => c.id === "rainier-fuhrer-finger")?.routeType === "ski_corn", "Rainier Fuhrer Finger should be treated as a spring ski / corn-cycle objective");
  console.assert(climbs.find((c) => c.id === "north-twin-north-face")?.routeType === "ski_corn", "North Twin North Face should be treated as a spring ski / corn-cycle objective");
}

function MetricCard({ icon: IconComponent, label, value, detail, className = "" }) { return <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-sm text-slate-500"><IconComponent />{label}</div><div className={`mt-2 text-2xl font-semibold ${className}`}>{value}</div><div className="mt-1 text-sm text-slate-500">{detail}</div></CardContent></Card>; }

function MiniLineChart({ data = [], series = [], labelKey = "label", minOverride, maxOverride }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const width = 720, height = 230, padding = 28;
  const valid = (v) => typeof v === "number" && Number.isFinite(v);
  const allValues = series.flatMap((s) => data.map((d) => d[s.key]).filter(valid));
  const minValue = minOverride ?? Math.min(...allValues, 0);
  const maxValue = maxOverride ?? Math.max(...allValues, 1);
  const range = Math.max(1, maxValue - minValue);
  const xFor = (i) => padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2);
  const yFor = (value) => height - padding - ((value - minValue) / range) * (height - padding * 2);
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;
  function segmentsFor(s) { const segments = []; let current = []; data.forEach((d, i) => { const value = d[s.key]; if (valid(value)) current.push(`${xFor(i)},${yFor(value)}`); else if (current.length) { segments.push(current); current = []; } }); if (current.length) segments.push(current); return segments; }
  function move(e) { if (!data.length) return; const rect = e.currentTarget.getBoundingClientRect(); const x = ((e.clientX - rect.left) / rect.width) * width; const ratio = Math.max(0, Math.min(1, (x - padding) / (width - padding * 2))); setHoverIndex(Math.round(ratio * (data.length - 1))); }
  return <div className="relative h-72 rounded-xl border bg-white p-3"><svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full cursor-crosshair" preserveAspectRatio="none" onMouseMove={move} onMouseLeave={() => setHoverIndex(null)}>{[0, .25, .5, .75, 1].map((t) => <line key={t} x1={padding} x2={width - padding} y1={padding + t * (height - padding * 2)} y2={padding + t * (height - padding * 2)} stroke="currentColor" className="text-slate-200" />)}{series.map((s, si) => segmentsFor(s).map((points, pi) => <polyline key={`${s.key}-${pi}`} points={points.join(" ")} fill="none" stroke="currentColor" className={s.className || "text-slate-800"} strokeWidth="3" strokeDasharray={si === 1 ? "6 6" : si === 2 ? "3 6" : ""} vectorEffect="non-scaling-stroke" />))}{hoverIndex !== null && <line x1={xFor(hoverIndex)} x2={xFor(hoverIndex)} y1={padding} y2={height - padding} stroke="currentColor" className="text-slate-400" strokeDasharray="4 4" />}</svg><div className="grid" style={{ gridTemplateColumns: `repeat(${data.length || 1}, minmax(0, 1fr))` }}>{data.map((d, i) => <div key={d[labelKey]} className={`truncate text-center text-[10px] ${hoverIndex === i ? "font-semibold text-slate-900" : "text-slate-500"}`}>{d[labelKey]}</div>)}</div><div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">{series.map((s, i) => <div key={s.key} className="flex items-center gap-1"><span className={`inline-block h-2 w-6 rounded ${i === 1 ? "border-t-2 border-dashed border-slate-500" : i === 2 ? "border-t-2 border-dotted border-slate-400" : "bg-slate-800"}`} />{s.label}</div>)}</div>{hovered && <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg"><div className="mb-1 font-semibold text-slate-900">{hovered[labelKey]} {hovered.date ? `· ${hovered.date}` : ""}</div>{series.map((s) => { const raw = hovered[s.key]; if (!valid(raw)) return <div key={s.key} className="text-slate-400">{s.label}: <strong>NO DATA</strong></div>; const value = Number.isInteger(raw) ? raw : raw.toFixed(1); return <div key={s.key} className="text-slate-700">{s.label}: <strong>{value}{s.unit ? ` ${s.unit}` : ""}</strong></div>; })}</div>}</div>;
}

function WindowTimeline({ forecast = [], bestWindow, source }) { const dayCount = forecast.length; return <div className="rounded-2xl border bg-white p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-semibold">{dayCount}-day window watch</h3><p className="text-sm text-slate-500">Shows aggregate window signal. Missing/out-of-range model values are excluded, not treated as zeros.</p><p className="mt-1 text-xs text-slate-400">Source: {source}</p></div><Badge variant="secondary">Best: {bestWindow.label} ({bestWindow.windowLength} days)</Badge></div><div className="overflow-x-auto pb-2"><div className="grid gap-2" style={{ minWidth: `${Math.max(1120, dayCount * 108)}px`, gridTemplateColumns: `repeat(${dayCount || 1}, minmax(0, 1fr))` }}>{forecast.map((d, i) => { const wind = Math.round(((d.summitWindGfsKph || 0) + (d.summitWindEcmwfKph || 0)) / 2); const temp = (((d.summitTempGfsC || 0) + (d.summitTempEcmwfC || 0)) / 2).toFixed(1); const precip = (((d.precipGfsMm || 0) + (d.precipEcmwfMm || 0)) / 2).toFixed(1); const tempMin = typeof d.summitTempMinAvgC === "number" ? d.summitTempMinAvgC.toFixed(1) : "—"; const tempMax = typeof d.summitTempMaxAvgC === "number" ? d.summitTempMaxAvgC.toFixed(1) : "—"; const inBest = i + 1 >= bestWindow.startDay && i + 1 <= bestWindow.endDay; return <div key={d.label} className={`rounded-xl border p-2 text-center text-xs ${inBest ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><div className="font-semibold">{d.label}</div><div className="text-[10px] text-slate-400">{d.date || ""}</div><div className="mt-1 text-slate-600">Wind {wind} kph</div><div className="text-slate-600">Avg {temp}°C</div><div className="text-slate-600">Swing {tempMin} / {tempMax}°C</div><div className="text-slate-600">Precip {precip} mm</div><div className="text-slate-600">Models {d.modelStats?.modelCount || 0}</div></div>; })}</div></div></div>; }

function getAvailableModelLabels(forecast = []) { const labels = []; forecast.forEach((day) => (day.modelValues || []).forEach((model) => { if (!labels.find((item) => item.id === model.modelId)) labels.push({ id: model.modelId, label: model.modelLabel }); })); return labels; }
function RawModelLineChart({ forecast = [], metricKey, title, unit, note }) { const modelLabels = getAvailableModelLabels(forecast); const classNames = ["text-slate-900", "text-emerald-700", "text-blue-700", "text-amber-700", "text-purple-700", "text-rose-700", "text-cyan-700", "text-lime-700", "text-orange-700", "text-fuchsia-700"]; const data = forecast.map((day) => { const row = { label: day.label, date: day.date }; modelLabels.forEach((model) => { const value = day.modelValues?.find((item) => item.modelId === model.id)?.[metricKey]; row[model.id] = typeof value === "number" && Number.isFinite(value) ? Number(value.toFixed(1)) : null; }); return row; }); const series = modelLabels.map((model, i) => ({ key: model.id, label: model.label, unit, className: classNames[i % classNames.length] })); return <Card><CardContent className="p-5"><h3 className="mb-2 font-semibold">{title}</h3>{note && <p className="mb-3 text-sm text-slate-500">{note}</p>}<MiniLineChart data={data} series={series} /></CardContent></Card>; }

function ModelAvailabilityPanel({ forecast = [], climb, unavailableModels = [] }) { const applicableModels = FORECAST_MODEL_CATALOG.filter((model) => modelAppliesToClimb(model, climb)); return <Card><CardContent className="p-5"><h3 className="mb-2 font-semibold">Model availability and agreement</h3><p className="mb-4 text-sm text-slate-500">Short-range models should only appear inside their valid lead time. If a model is outside its horizon, it is blank—not zero.</p><div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[1100px] text-xs"><thead className="bg-slate-100 text-left text-slate-600"><tr><th className="p-2">Model</th><th className="p-2">Provider</th>{forecast.map((day) => <th key={day.label} className="p-2 text-center">{day.label}</th>)}</tr></thead><tbody>{applicableModels.map((model) => <tr key={model.id} className="border-t"><td className="p-2 font-medium">{model.label}</td><td className="p-2 text-slate-500">{model.provider}</td>{forecast.map((day) => { const value = day.modelValues?.find((m) => m.modelId === model.id); const withinLead = day.dayIndex <= model.maxLeadDays; return <td key={`${model.id}-${day.label}`} className="p-2 text-center">{value ? <div className="rounded-lg bg-emerald-50 px-1 py-1 text-[10px] text-emerald-900">{Math.round(value.summitWindKph)}kph<br />{value.summitTempC?.toFixed?.(1) ?? "—"}°C<br />{value.precipMm?.toFixed?.(1) ?? "—"}mm</div> : withinLead ? <span className="text-red-600">unavail</span> : <span className="text-slate-300">—</span>}</td>; })}</tr>)}</tbody></table></div>{unavailableModels.length > 0 && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Unavailable/planned: {unavailableModels.join("; ")}</div>}</CardContent></Card>; }

function routeElevationProfile(climb) {
  const profiles = {
    "adams-sw-chutes": { entranceM: 3740, exitM: 2100, descentLabel: "Summit / SW Chutes entrance → Morrison Creek exit", aspect: "S–SW", slopeDeg: 35, climbHours: 6.5, skiHours: 2.5 },
    "st-helens-worm-flows": { entranceM: 2549, exitM: 1500, descentLabel: "Summit rim → Worm Flows / Marble Mountain", aspect: "S", slopeDeg: 28, climbHours: 4.5, skiHours: 1.5 },
    "liberty-pass-birthday-tour": { entranceM: 2135, exitM: 1500, descentLabel: "Liberty Pass high point → Birthday Tour exit", aspect: "S–E", slopeDeg: 28, climbHours: 3.5, skiHours: 1.5 },
    "north-twin-north-face": { entranceM: 2026, exitM: 850, descentLabel: "North Face top → valley exit", aspect: "N", slopeDeg: 40, climbHours: 5.5, skiHours: 2.5 },
    "shuksan-north-face": { entranceM: 2783, exitM: 1350, descentLabel: "Summit / NF top → White Salmon exit", aspect: "N", slopeDeg: 40, climbHours: 6.5, skiHours: 2.5 },
    "rainier-fuhrer-finger": { entranceM: 4392, exitM: 1700, descentLabel: "Summit / Fuhrer Finger → Nisqually Bridge", aspect: "S–SW", slopeDeg: 38, climbHours: 8.5, skiHours: 3.5 },
  };
  return profiles[climb.id] || { entranceM: climb.summitM, exitM: Math.max(1000, climb.summitM - 1200), descentLabel: "High point → exit", aspect: "solar", slopeDeg: 32, climbHours: 5, skiHours: 2 };
}

function estimateTempAtElevation(day, elevationM, climb) {
  const summitAvg = daySummitTemp(day);
  const deltaM = climb.summitM - elevationM;
  return summitAvg + (deltaM / 1000) * 6.5;
}
function estimateLowAtElevation(day, elevationM, climb) {
  const summitLow = typeof day.summitTempMinAvgC === "number" ? day.summitTempMinAvgC : daySummitTemp(day) - 3;
  return summitLow + ((climb.summitM - elevationM) / 1000) * 6.5;
}
function estimateHighAtElevation(day, elevationM, climb) {
  const summitHigh = typeof day.summitTempMaxAvgC === "number" ? day.summitTempMaxAvgC : daySummitTemp(day) + 3;
  return summitHigh + ((climb.summitM - elevationM) / 1000) * 6.5;
}
function degToRad(v) { return v * Math.PI / 180; }
function radToDeg(v) { return v * 180 / Math.PI; }
function saturationVaporPressureHpa(tC) { return 6.112 * Math.exp((17.67 * tC) / (tC + 243.5)); }
function pressureAtElevationHpa(elevationM) { return 1013.25 * Math.pow(1 - 2.25577e-5 * elevationM, 5.25588); }
function wetBulbApproxC(tC, rhPct) {
  const rh = Math.max(1, Math.min(100, rhPct || 70));
  // Stull-style closed-form wet bulb approximation, close enough for browser-side timing guidance.
  return tC * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) + Math.atan(tC + rh) - Math.atan(rh - 1.676331) + 0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) - 4.686035;
}
function estimateSolarPosition(lat, lon, dateObj, hour) {
  const start = new Date(Date.UTC(dateObj.getUTCFullYear(), 0, 0));
  const dayOfYear = Math.floor((dateObj - start) / 86400000);
  const b = (2 * Math.PI / 365) * (dayOfYear - 81);
  const decl = degToRad(23.45 * Math.sin(b));
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  const lst = hour + lon / 15 + eot / 60;
  const omega = degToRad(15 * (lst - 12));
  const phi = degToRad(lat);
  const sinElev = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(omega);
  const elevationRad = Math.asin(Math.max(-1, Math.min(1, sinElev)));
  const cosAz = (Math.sin(decl) - Math.sin(elevationRad) * Math.sin(phi)) / Math.max(0.0001, Math.cos(elevationRad) * Math.cos(phi));
  let az = radToDeg(Math.acos(Math.max(-1, Math.min(1, cosAz))));
  if (omega > 0) az = 360 - az;
  return { elevationDeg: radToDeg(elevationRad), azimuthDeg: az };
}
function aspectToDegrees(aspect = "S") {
  const a = String(aspect).toUpperCase();
  if (a.includes("SW")) return 225;
  if (a.includes("SE")) return 135;
  if (a.includes("NW")) return 315;
  if (a.includes("NE")) return 45;
  if (a.includes("N")) return 0;
  if (a.includes("E")) return 90;
  if (a.includes("W")) return 270;
  return 180;
}
function calculateRadiativeEquivalentC({ airTempC, rhPct, cloudFraction, lat, lon, dateObj, hour, slopeDeg, aspectDeg }) {
  const solar = estimateSolarPosition(lat, lon, dateObj, hour);
  const alpha = degToRad(Math.max(0, solar.elevationDeg));
  const beta = degToRad(slopeDeg || 30);
  const gammaS = degToRad(solar.azimuthDeg);
  const gammaA = degToRad(aspectDeg || 180);
  const cosI = Math.max(0, Math.cos(beta) * Math.sin(alpha) + Math.sin(beta) * Math.cos(alpha) * Math.cos(gammaS - gammaA));
  const cloud = Math.max(0, Math.min(1, cloudFraction ?? 0.35));
  const albedo = 0.62;
  const kRad = 8.0;
  const swNet = 1361 * cosI * (1 - 0.65 * cloud * cloud) * (1 - albedo);
  const tAirK = airTempC + 273.15;
  const tSnowK = 273.15;
  const ea = saturationVaporPressureHpa(airTempC) * Math.max(1, Math.min(100, rhPct || 70)) / 100;
  const epsClear = 0.51 + 0.066 * Math.sqrt(Math.max(0, ea));
  const epsAtm = (1 - cloud) * epsClear + cloud;
  const svf = Math.pow(Math.cos(beta / 2), 2);
  const sigma = 5.67e-8;
  const lwNet = sigma * (svf * epsAtm * Math.pow(tAirK, 4) + (1 - svf) * 0.98 * Math.pow(tAirK, 4) - Math.pow(tSnowK, 4));
  return { shortwaveEqC: swNet / kRad, longwaveEqC: lwNet / kRad, solarElevationDeg: solar.elevationDeg, cosIncidence: cosI };
}
function cornDensityForClimb(climb) {
  if (climb.id === "rainier-fuhrer-finger" || climb.id === "adams-sw-chutes") return 0.48;
  if (climb.id === "shuksan-north-face" || climb.id === "north-twin-north-face") return 0.42;
  return 0.38;
}
function cornThresholdsForDensity(rho) {
  const density = Math.max(0.3, Math.min(0.55, rho || 0.4));
  const kM = 2.0 * density + 0.1;
  const kF = 10.0 * density + 0.5;
  const startFhrs = 133.33 * density + 13.34;
  const dMaxCm = Math.max(0.5, 9.27 * density - 1.58);
  const endFhrs = (dMaxCm * 43.2) / kM;
  return { density, kM, kF, startFhrs, endFhrs, dMaxCm };
}
function makeCornHourly(day, climb, elevationM, kind) {
  const profile = routeElevationProfile(climb);
  const low = estimateLowAtElevation(day, elevationM, climb);
  const high = estimateHighAtElevation(day, elevationM, climb);
  const precip = dayPrecip(day);
  const wind = dayWind(day);
  const rh = day.rhPct ?? day.relativeHumidityPct ?? 70;
  const cloud = Math.max(0, Math.min(1, (day.cloudCoverPct ?? day.cloudPct ?? 35) / 100));
  const rho = cornDensityForClimb(climb);
  const thresholds = cornThresholdsForDensity(rho);
  const dateObj = day.date ? new Date(`${day.date}T12:00:00Z`) : new Date();
  let meltFhrs = 0;
  let freezeFhrs = 0;
  return Array.from({ length: 16 }, (_, idx) => {
    const hour = idx + 5;
    const dayCurve = Math.sin(Math.max(0, Math.min(Math.PI, ((hour - 6) / 12) * Math.PI)));
    const airTempC = low + (high - low) * dayCurve;
    const wetBulbC = wetBulbApproxC(airTempC, rh);
    const radiative = calculateRadiativeEquivalentC({ airTempC, rhPct: rh, cloudFraction: cloud, lat: climb.lat, lon: climb.lon, dateObj, hour, slopeDeg: profile.slopeDeg, aspectDeg: aspectToDegrees(profile.aspect) });
    const windCoolingC = Math.max(0, wind - 20) * 0.035;
    const precipCoolingC = precip * 0.35;
    const effectiveTempC = wetBulbC + radiative.shortwaveEqC + radiative.longwaveEqC - windCoolingC - precipCoolingC;
    const effectiveF = effectiveTempC * 9 / 5 + 32;
    if (effectiveF > 32) meltFhrs += effectiveF - 32;
    if (effectiveF < 32) freezeFhrs += 32 - effectiveF;
    const meltCdays = meltFhrs / 43.2;
    const freezeCdays = freezeFhrs / 43.2;
    const meltDepthCm = thresholds.kM * meltCdays;
    const refreezeDepthCm = thresholds.kF * Math.sqrt(Math.max(0, freezeCdays));
    let state = "Frozen";
    if (meltFhrs >= thresholds.startFhrs && meltFhrs <= thresholds.endFhrs && effectiveTempC >= -0.25 && refreezeDepthCm >= 0.5) state = "Prime corn";
    if (meltFhrs > thresholds.endFhrs || meltDepthCm > thresholds.dMaxCm || effectiveTempC > 5) state = "Too soft / wet";
    if (effectiveTempC < -0.25 && hour >= 10) state = "Icy / delayed";
    return { hour, label: `${hour}:00`, effectiveTempC: Number(effectiveTempC.toFixed(1)), airTempC: Number(airTempC.toFixed(1)), wetBulbC: Number(wetBulbC.toFixed(1)), shortwaveEqC: Number(radiative.shortwaveEqC.toFixed(1)), longwaveEqC: Number(radiative.longwaveEqC.toFixed(1)), meltIntegralFhrs: Number(meltFhrs.toFixed(1)), freezeIntegralFhrs: Number(freezeFhrs.toFixed(1)), meltDepthCm: Number(meltDepthCm.toFixed(2)), refreezeDepthCm: Number(refreezeDepthCm.toFixed(2)), density: Number(rho.toFixed(2)), startThresholdFhrs: Number(thresholds.startFhrs.toFixed(1)), endThresholdFhrs: Number(thresholds.endFhrs.toFixed(1)), solarElevationDeg: Number(radiative.solarElevationDeg.toFixed(1)), state };
  });
}
function analyzeCornDay(climb, day) {
  const profile = routeElevationProfile(climb);
  const entrance = makeCornHourly(day, climb, profile.entranceM, "entrance");
  const exit = makeCornHourly(day, climb, profile.exitM, "exit");
  const primeEntrance = entrance.filter((h) => h.state === "Prime corn");
  const primeExit = exit.filter((h) => h.state === "Prime corn");
  const entranceStart = primeEntrance[0]?.hour || null;
  const entranceEnd = primeEntrance[primeEntrance.length - 1]?.hour || null;
  const exitStart = primeExit[0]?.hour || null;
  const exitEnd = primeExit[primeExit.length - 1]?.hour || null;
  const targetSki = entranceStart ? Math.max(9, entranceStart) : null;
  const startClimb = targetSki ? Math.max(1, Math.round(targetSki - profile.climbHours)) : null;
  const exitTarget = targetSki ? Math.round(targetSki + profile.skiHours) : null;
  const refreezeScore = clampScore(10 - Math.max(0, estimateLowAtElevation(day, profile.entranceM, climb) + 2) * 1.8 - Math.max(0, dayPrecip(day) - 0.2) * 2);
  const cornScore = clampScore((primeEntrance.length * 1.2) + (primeExit.length * 0.6) + refreezeScore * 0.35 - Math.max(0, dayWind(day) - 30) * 0.15 - dayPrecip(day) * 1.2);
  let interpretation = "No clear corn window detected yet.";
  if (cornScore >= 7 && targetSki) interpretation = `Best signal: aim to start skiing the entrance around ${targetSki}:00. Start climbing around ${startClimb}:00, reach the high point by ${Math.max(targetSki - 1, 6)}:00, and be exiting lower terrain by about ${exitTarget}:00.`;
  else if (refreezeScore < 5) interpretation = "Weak overnight refreeze signal. Expect poor supportability early and higher wet-loose/slush risk once solar input starts.";
  else if (!targetSki && primeExit.length) interpretation = "Lower route may soften, but the high entrance looks icy or delayed. Consider a later ski drop only if wind/visibility and wet-loose hazard remain acceptable.";
  else if (targetSki) interpretation = `Marginal corn signal. Entrance may come in around ${targetSki}:00, but the usable window looks narrow or uncertain.`;
  return { profile, day, entrance, exit, entranceStart, entranceEnd, exitStart, exitEnd, targetSki, startClimb, exitTarget, refreezeScore, cornScore, interpretation };
}
function analyzeCornCycle(climb, forecast = []) {
  if (climb.routeType !== "ski_corn" || !forecast.length) return null;
  const days = forecast.slice(0, 7).map((day) => analyzeCornDay(climb, day));
  const best = [...days].sort((a, b) => b.cornScore - a.cornScore)[0];
  return { ...best, days };
}
function cornCellClass(state) {
  if (state === "Prime corn") return "border-emerald-400 bg-emerald-500 text-white";
  if (state.includes("soft")) return "border-orange-300 bg-orange-300 text-orange-950";
  if (state.includes("Icy")) return "border-blue-200 bg-blue-300 text-blue-950";
  return "border-slate-200 bg-slate-100 text-slate-600";
}
function CornCycleHeatmap({ title, elevationM, days = [], field = "entrance" }) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 5);
  return <Card><CardContent className="p-5"><h3 className="mb-1 font-semibold">{title}</h3><p className="mb-4 text-sm text-slate-500">Elevation: {elevationM} m · 7-day view · green = estimated prime corn window.</p><div className="overflow-x-auto"><div className="min-w-[980px]"><div className="grid gap-1" style={{ gridTemplateColumns: "90px repeat(16, minmax(44px, 1fr))" }}><div></div>{hours.map((h) => <div key={h} className="text-center text-[10px] font-medium text-slate-500">{h}:00</div>)}{days.map((day) => <React.Fragment key={`${field}-${day.day.date || day.day.label}`}><div className="flex flex-col justify-center rounded-lg bg-slate-50 px-2 text-xs"><span className="font-semibold text-slate-900">{day.day.label}</span><span className="text-[10px] text-slate-500">{day.day.date}</span></div>{day[field].map((h) => <div key={`${day.day.label}-${field}-${h.hour}`} title={`${day.day.label} ${h.label}: ${h.state}; effective ${h.effectiveTempC}°C`} className={`h-12 rounded-md border p-1 text-center text-[9px] leading-tight ${cornCellClass(h.state)}`}><div className="font-semibold">{h.effectiveTempC}°</div><div className="truncate">{h.state === "Prime corn" ? "Prime" : h.state.includes("soft") ? "Wet" : h.state.includes("Icy") ? "Icy" : "Frozen"}</div></div>)}</React.Fragment>)}</div></div></div></CardContent></Card>;
}
function CornCycleCurveGraph({ title, elevationM, days = [], field = "entrance" }) {
  const [hover, setHover] = useState(null);
  const width = 980, height = 260, pad = 34;
  const rows = days.flatMap((day, dayIndex) => day[field].map((h, hourIndex) => ({ ...h, dayIndex, hourIndex, dayLabel: day.day.label, date: day.day.date })));
  const temps = rows.map((r) => r.effectiveTempC).filter((v) => typeof v === "number" && Number.isFinite(v));
  const minT = Math.min(-6, ...temps) - 1;
  const maxT = Math.max(6, ...temps) + 1;
  const totalSlots = Math.max(1, days.length * 16 - 1);
  const xFor = (dayIndex, hourIndex) => pad + ((dayIndex * 16 + hourIndex) / totalSlots) * (width - pad * 2);
  const yFor = (temp) => height - pad - ((temp - minT) / Math.max(1, maxT - minT)) * (height - pad * 2);
  const points = rows.map((r) => `${xFor(r.dayIndex, r.hourIndex)},${yFor(r.effectiveTempC)}`).join(" ");
  function handleMove(e) {
    if (!rows.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const ratio = Math.max(0, Math.min(1, (x - pad) / (width - pad * 2)));
    const index = Math.round(ratio * totalSlots);
    const row = rows[Math.max(0, Math.min(rows.length - 1, index))];
    setHover(row);
  }
  const hoverX = hover ? xFor(hover.dayIndex, hover.hourIndex) : null;
  const hoverY = hover ? yFor(hover.effectiveTempC) : null;
  return <Card><CardContent className="p-5"><h3 className="mb-1 font-semibold">{title}</h3><p className="mb-3 text-sm text-slate-500">Elevation: {elevationM} m · 7-day Ullr-style effective snow-temperature curve. Green vertical bands = calculated prime corn windows.</p><div className="relative overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="min-w-[980px] w-full h-72 rounded-xl border bg-white cursor-crosshair" onMouseMove={handleMove} onMouseLeave={() => setHover(null)}><line x1={pad} x2={width - pad} y1={yFor(0)} y2={yFor(0)} className="stroke-slate-400" strokeDasharray="5 5" /><text x={pad + 4} y={yFor(0) - 6} className="fill-slate-500 text-[11px]">0°C effective</text>{days.map((day, dayIndex) => <g key={`${field}-day-${day.day.label}`}><line x1={xFor(dayIndex, 0)} x2={xFor(dayIndex, 0)} y1={pad} y2={height - pad} className="stroke-slate-200" /><text x={xFor(dayIndex, 0) + 4} y={height - 10} className="fill-slate-500 text-[10px]">{day.day.label}</text></g>)}{rows.map((r) => r.state === "Prime corn" ? <rect key={`${field}-prime-${r.dayIndex}-${r.hourIndex}`} x={xFor(r.dayIndex, r.hourIndex) - 4} y={pad} width="8" height={height - pad * 2} className="fill-emerald-200 opacity-70" /> : null)}<polyline points={points} fill="none" className="stroke-slate-900" strokeWidth="3" vectorEffect="non-scaling-stroke" />{rows.map((r, i) => <circle key={`${field}-dot-${r.dayIndex}-${r.hourIndex}`} cx={xFor(r.dayIndex, r.hourIndex)} cy={yFor(r.effectiveTempC)} r={i % 2 === 0 ? "2.5" : "1.8"} className={r.state === "Prime corn" ? "fill-emerald-600" : r.state.includes("soft") ? "fill-orange-500" : r.state.includes("Icy") ? "fill-blue-500" : "fill-slate-400"} />)}{hover && <g><line x1={hoverX} x2={hoverX} y1={pad} y2={height - pad} className="stroke-slate-500" strokeDasharray="4 4" /><circle cx={hoverX} cy={hoverY} r="5" className="fill-white stroke-slate-900" strokeWidth="2" /></g>}</svg>{hover && <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg"><div className="mb-1 font-semibold text-slate-950">{hover.dayLabel} · {hover.date} · {hover.label}</div><div>State: <strong>{hover.state}</strong></div><div>Effective temp: <strong>{hover.effectiveTempC} °C</strong></div><div>Air / wet-bulb: <strong>{hover.airTempC} / {hover.wetBulbC} °C</strong></div><div>Melt integral: <strong>{hover.meltIntegralFhrs} F-hrs</strong></div><div>Refreeze depth: <strong>{hover.refreezeDepthCm} cm</strong></div><div>Melt depth: <strong>{hover.meltDepthCm} cm</strong></div><div>Solar elevation: <strong>{hover.solarElevationDeg}°</strong></div><div className="mt-1 text-slate-500">Prime threshold: {hover.startThresholdFhrs}–{hover.endThresholdFhrs} F-hrs</div></div>}</div><div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600"><span className="inline-flex items-center gap-1"><span className="h-3 w-5 rounded bg-emerald-200" />Prime corn band</span><span className="inline-flex items-center gap-1"><span className="h-3 w-5 rounded bg-blue-300" />Icy/delayed</span><span className="inline-flex items-center gap-1"><span className="h-3 w-5 rounded bg-orange-300" />Too soft/wet</span></div></CardContent></Card>;
}
function CornCycleGraph({ title, elevationM, rows = [] }) {
  return <Card><CardContent className="p-5"><h3 className="mb-1 font-semibold">{title}</h3><p className="mb-4 text-sm text-slate-500">Elevation: {elevationM} m · green bands indicate estimated prime corn.</p><div className="grid grid-cols-16 gap-1">{rows.map((h) => <div key={h.hour} className={`rounded-lg border p-2 text-center text-[10px] ${h.state === "Prime corn" ? "border-emerald-400 bg-emerald-100 text-emerald-950" : h.state.includes("soft") ? "border-orange-300 bg-orange-50 text-orange-900" : h.state.includes("Icy") ? "border-blue-200 bg-blue-50 text-blue-900" : "border-slate-200 bg-slate-50 text-slate-600"}`}><div className="font-semibold">{h.label}</div><div>{h.effectiveTempC}°C</div><div className="mt-1">{h.state}</div></div>)}</div></CardContent></Card>;
}
function CornCyclePanel({ climb, forecast }) {
  const analysis = analyzeCornCycle(climb, forecast);
  if (!analysis) return <div className="rounded-2xl border bg-white p-5 text-sm text-slate-700">Corn-cycle analysis is only shown for ski-corn objectives with live forecast data.</div>;
  const bestDayLabel = `${analysis.day.label}${analysis.day.date ? ` · ${analysis.day.date}` : ""}`;
  return <div className="space-y-4"><div className="grid gap-4 md:grid-cols-4"><MetricCard icon={SunIcon} label="Best 7-day Corn Score" value={`${analysis.cornScore.toFixed(1)} / 10`} detail={bestDayLabel} className={scoreColor(analysis.cornScore)} /><MetricCard icon={SnowIcon} label="Best Refreeze Score" value={`${analysis.refreezeScore.toFixed(1)} / 10`} detail="Overnight supportability" className={scoreColor(analysis.refreezeScore)} /><MetricCard icon={MountainIcon} label="Best Ski Entrance" value={analysis.targetSki ? `${analysis.targetSki}:00` : "No clear time"} detail={`${analysis.profile.entranceM} m · ${analysis.profile.aspect}`} /><MetricCard icon={TrendIcon} label="Best Exit Target" value={analysis.exitTarget ? `${analysis.exitTarget}:00` : "No clear time"} detail={`${analysis.profile.exitM} m lower route`} /></div><Card><CardContent className="p-5"><h3 className="font-semibold">7-day corn-cycle interpretation</h3><p className="mt-2 text-slate-700">{analysis.interpretation}</p><p className="mt-2 text-sm text-slate-500">Best-day strategy is based on {bestDayLabel}. The graphs and heatmaps compare the entrance/high point and the lower exit elevation across the next 7 forecast days. Green means the Ullr-style surface-state model estimates a prime corn window; blue is delayed/icy; orange is too soft/wet. Hover over the curve for time, effective temp, melt/refreeze values, and surface-state interpretation.</p></CardContent></Card><div className="grid gap-4"><CornCycleCurveGraph title="Entrance / high-point 7-day corn curve" elevationM={analysis.profile.entranceM} days={analysis.days} field="entrance" /><CornCycleCurveGraph title="Exit / lower-route 7-day corn curve" elevationM={analysis.profile.exitM} days={analysis.days} field="exit" /><CornCycleHeatmap title="Entrance / high-point corn heatmap" elevationM={analysis.profile.entranceM} days={analysis.days} field="entrance" /><CornCycleHeatmap title="Exit / lower-route corn heatmap" elevationM={analysis.profile.exitM} days={analysis.days} field="exit" /></div><Card><CardContent className="p-5"><h3 className="mb-2 font-semibold">Best-day route timing strategy — {bestDayLabel}</h3><div className="grid gap-3 md:grid-cols-4 text-sm"><div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-500">Start climbing</div><div className="text-xl font-semibold">{analysis.startClimb ? `${analysis.startClimb}:00` : "—"}</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-500">Reach entrance</div><div className="text-xl font-semibold">{analysis.targetSki ? `${Math.max(analysis.targetSki - 1, 6)}:00` : "—"}</div></div><div className="rounded-xl bg-emerald-50 p-3"><div className="text-emerald-700">Start skiing</div><div className="text-xl font-semibold text-emerald-900">{analysis.targetSki ? `${analysis.targetSki}:00` : "—"}</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-500">Clear lower route</div><div className="text-xl font-semibold">{analysis.exitTarget ? `${analysis.exitTarget}:00` : "—"}</div></div></div></CardContent></Card></div>;
}

function AlertRulePanel({ climb, mode, setMode }) { const [emailEnabled, setEmailEnabled] = useState(true); const [smsEnabled, setSmsEnabled] = useState(false); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [activeFrom, setActiveFrom] = useState(climb.activeFromMonth || 1); const [minQuality, setMinQuality] = useState(8); const [minConfidence, setMinConfidence] = useState(5.5); useEffect(() => { setActiveFrom(climb.activeFromMonth || 1); if (climb.defaultMode) setMode(climb.defaultMode); }, [climb.id]); const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; async function sendTestAlert() { const message = `Mountain Window Test Alert: ${climb.name} ${mode} window watch. Quality threshold ${minQuality}, confidence threshold ${minConfidence}.`; try { const response = await fetch("/api/send-alert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailEnabled ? email : "", phone: "", message }) }); const data = await response.json().catch(() => ({})); if (!response.ok || data.error) throw new Error(data.error || "Alert failed to send"); alert(`Test alert sent${data.id ? ` via Resend ID: ${data.id}` : "."}`); } catch (error) { alert(`Alert failed: ${error.message || "unknown error"}`); } } return <Card><CardContent className="p-5"><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h3 className="font-semibold">Objective-specific alert rule</h3><p className="text-sm text-slate-500">Manual test alerts can send by email through /api/send-alert. Automatic watch alerts are not active yet; they require saved alert rules plus the cron/check-alerts workflow.</p></div><Badge variant="secondary">Manual test only — no automatic alerts yet</Badge></div><div className="grid gap-4 md:grid-cols-3"><div><label className="mb-1 block text-xs font-medium text-slate-500">Objective</label><div className="rounded-xl border bg-slate-50 px-3 py-2 text-sm">{climb.name}</div></div><div><label className="mb-1 block text-xs font-medium text-slate-500">Window type</label><SelectBox className="w-full" value={mode} onChange={setMode} options={[{ value: "summer", label: "Summer alpine" }, { value: "winter", label: "Winter / ski" }]} /></div><div><label className="mb-1 block text-xs font-medium text-slate-500">Start watching</label><SelectBox className="w-full" value={String(activeFrom)} onChange={(v) => setActiveFrom(Number(v))} options={months.map((m, i) => ({ value: String(i + 1), label: m }))} /></div><div><label className="mb-1 block text-xs font-medium text-slate-500">Minimum quality</label><input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" type="number" min="0" max="10" step="0.5" value={minQuality} onChange={(e) => setMinQuality(e.target.value)} /></div><div><label className="mb-1 block text-xs font-medium text-slate-500">Minimum confidence</label><input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" type="number" min="0" max="10" step="0.5" value={minConfidence} onChange={(e) => setMinConfidence(e.target.value)} /></div><div><label className="mb-1 block text-xs font-medium text-slate-500">Delivery methods</label><div className="flex flex-wrap gap-3 rounded-xl border bg-slate-50 px-3 py-2 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} /> Email</label><label className="flex items-center gap-2 text-slate-400"><input type="checkbox" checked={false} disabled /> Text disabled for now</label></div></div><div><label className="mb-1 block text-xs font-medium text-slate-500">Email</label><input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} /></div><div><label className="mb-1 block text-xs font-medium text-slate-500">Future SMS / app notification target</label><input className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-400" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Disabled for now" disabled /></div><div className="flex items-end"><Button className="w-full" onClick={sendTestAlert}>Send test alert</Button></div></div></CardContent></Card>; }

function MapPickerPlaceholder({ onSelect }) { return <Card><CardContent className="p-5"><h3 className="font-semibold">Select from map</h3><p className="text-sm text-slate-500">Prototype placeholder: click a route card. Later this becomes a real map.</p><div className="relative mt-4 h-72 overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-200 via-slate-100 to-emerald-100 p-4">{climbs.map((c, i) => <button key={c.id} onClick={() => onSelect(c.id)} className="absolute rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-left text-xs shadow hover:bg-white" style={{ left: `${8 + (i % 3) * 30}%`, top: `${24 + Math.floor(i / 3) * 28}%` }}><div className="font-semibold text-slate-900">{c.name.split(" — ")[0]}</div><div className="text-slate-500">{c.region}</div></button>)}</div></CardContent></Card>; }
function TabButton({ active, onClick, children }) { return <button onClick={onClick} className={`rounded-xl px-3 py-2 text-sm font-medium ${active ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-100"}`}>{children}</button>; }

export default function MountainWindowApp() {
  useEffect(() => { runTests(); }, []);
  const [climbId, setClimbId] = useState("robson-kain");
  const [mode, setMode] = useState("winter");
  const [tab, setTab] = useState("forecast");
  const [refreshCount, setRefreshCount] = useState(0);
  const [weatherState, setWeatherState] = useState({ loading: true, error: "", data: null });
  const [avalancheState, setAvalancheState] = useState({ loading: true, error: "", data: null });
  const selectedClimbId = climbId === "map" ? "robson-kain" : climbId;
  const climb = climbs.find((c) => c.id === selectedClimbId) || climbs[0];

  useEffect(() => {
    let cancelled = false;
    setWeatherState({ loading: true, error: "", data: null });
    fetchWeatherFromBackend(climb).then((result) => { if (cancelled) return; if (result.ok) setWeatherState({ loading: false, error: "", data: result }); else setWeatherState({ loading: false, error: result.error, data: result }); });
    return () => { cancelled = true; };
  }, [climb.id, refreshCount]);

  useEffect(() => {
    let cancelled = false;
    setAvalancheState({ loading: true, error: "", data: null });
    fetchAvalancheFromBackend(climb).then((result) => { if (cancelled) return; setAvalancheState({ loading: false, error: result.ok ? "" : result.error, data: result }); });
    return () => { cancelled = true; };
  }, [climb.id, refreshCount]);

  const hasLiveData = !!weatherState.data?.ok;
  const forecast = hasLiveData ? weatherState.data.forecast : [];
  const history = hasLiveData ? weatherState.data.history : [];
  const source = hasLiveData ? weatherState.data.source : "NO DATA";
  const unavailableModels = weatherState.data?.unavailableModels || [];
  const avalancheHistory = avalancheState.data?.avalancheHistory || [];
  const avalanche = avalancheState.data?.summary || { headline: "No live avalanche data loaded.", riskScore: 0, last: { alpine: 0, problems: [] }, persistentDays: 0, windSlabDays: 0 };
  const hasAvalancheData = avalancheState.data?.ok && avalancheHistory.length > 0;

  const immediateGoQuality = useMemo(() => hasLiveData ? scoreImmediateGoWindow(climb, forecast) : 0, [climb, forecast, hasLiveData]);
  const windowQuality = useMemo(() => hasLiveData ? scorePatternStability(climb, forecast) : 0, [climb, forecast, hasLiveData]);
  const bestWindow = useMemo(() => hasLiveData ? findBestUpcomingWindow(climb, history, forecast) : { label: "NO DATA", windowLength: 0, leadDays: 0, quality: 0, confidence: 0 }, [climb, history, forecast, hasLiveData]);
  const pattern = useMemo(() => hasLiveData ? classifyPattern(history, forecast) : "NO DATA", [history, forecast, hasLiveData]);
  const recommendation = useMemo(() => {
    if (!hasLiveData) return "NO DATA — live weather could not be retrieved. Do not use this tool for decision making.";
    if (climb.routeType === "pure_rock" && bestWindow.quality >= 7) return `${climb.name}: ${bestWindow.label} is the better dry-rock signal. Require no precip, warm rock, and freezing levels above the summit.`;
    if (climb.routeType === "ski_corn" && bestWindow.quality >= 7.5) return `${climb.name}: ${bestWindow.label} may have the better corn-cycle signal. Look for overnight refreeze, freezing level rising close to the summit, light wind, and controlled daytime softening.`;
    if (climb.routeType === "mixed_alpine_ice" && bestWindow.quality >= 7) return `${climb.name}: ${bestWindow.label} may be a mixed alpine window. Look for clear weather, low precip, manageable wind, and a good overnight freeze without extreme summit cold.`;
    if (bestWindow.leadDays >= 6 && bestWindow.quality >= 8 && bestWindow.confidence >= 5.5) return `Early signal: a strong ${bestWindow.label} window may be forming. Watch closely but do not commit yet.`;
    if (mode === "winter" && avalanche.riskScore >= 7) return "Weather may be improving, but avalanche context is still a primary constraint. Manual bulletin review required.";
    if (immediateGoQuality >= 8) return "Immediate operational window looks good. Review detailed forecast, snow/route conditions, avalanche context, and timing now.";
    if (windowQuality >= 8 && bestWindow.confidence >= 7) return "The next 72h pattern is strong. Review detailed forecast and route-specific constraints.";
    if (windowQuality >= 6 || immediateGoQuality >= 6) return "Marginal or route-dependent window. Watch model convergence, timing, and recent observations.";
    return "No strong immediate window identified. Keep monitoring for model agreement and pressure trend changes.";
  }, [hasLiveData, climb.id, climb.routeType, bestWindow, windowQuality, immediateGoQuality, mode, avalanche.riskScore]);

  const combinedChart = forecast.map((d) => ({ label: d.label, date: d.date, summitWindAvg: Math.round(((d.summitWindGfsKph || 0) + (d.summitWindEcmwfKph || 0)) / 2), midWindAvg: Math.round(((d.midWindGfsKph || 0) + (d.midWindEcmwfKph || 0)) / 2), valleyWindAvg: Math.round(((d.valleyWindGfsKph || 0) + (d.valleyWindEcmwfKph || 0)) / 2), summitTempAvg: Number((((d.summitTempGfsC || 0) + (d.summitTempEcmwfC || 0)) / 2).toFixed(1)), summitTempMinAvg: d.summitTempMinAvgC ?? null, summitTempMaxAvg: d.summitTempMaxAvgC ?? null, summitRainAvg: Number((((d.summitRainGfsMm || 0) + (d.summitRainEcmwfMm || 0)) / 2).toFixed(1)), summitSnowAvg: Number((((d.summitSnowGfsCm || 0) + (d.summitSnowEcmwfCm || 0)) / 2).toFixed(1)), freezingLevelM: d.freezingLevelM ?? null, pressureHpa: d.pressureHpa ?? null }));

  return <div className="min-h-screen bg-slate-50 p-4 md:p-8"><div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="flex items-center gap-2 text-sm font-medium text-slate-600"><MountainIcon /> Mountain Window Intelligence</div><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Weather + Avalanche Window Prototype</h1><p className="mt-2 max-w-3xl text-slate-600">Decision-support dashboard for alpine climbing and ski mountaineering windows. Weather data now comes through backend routes using direct national-model feeds via Open-Meteo, requested at the objective summit elevation where supported. If live weather data fails, scoring is disabled and NO DATA is shown.</p></div><div className="flex flex-col gap-2 sm:flex-row"><SelectBox className="w-[280px]" value={climbId} onChange={(v) => { setClimbId(v); if (v === "map") setTab("map"); }} options={[{ value: "map", label: "Select from map…" }, ...climbs.map((c) => ({ value: c.id, label: c.name }))]} /><SelectBox className="w-[180px]" value={mode} onChange={setMode} options={[{ value: "summer", label: "Summer alpine" }, { value: "winter", label: "Winter / ski" }]} /></div></div>
    <Card><CardContent className="p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="text-xl font-semibold text-slate-950">{climb.name}</h2><p className="text-sm text-slate-600">{climb.region} · {climb.summitM} m · {climb.lat.toFixed(3)}, {climb.lon.toFixed(3)} · {climb.style} · {routeTypeLabel(climb)}</p></div><div className="flex flex-wrap gap-2"><Badge variant="secondary">Pattern: {pattern}</Badge><Badge variant="secondary">Best watch: {bestWindow.label}</Badge><Badge variant="outline">Mode: {mode}</Badge><Badge>Manual review required</Badge><button onClick={() => setRefreshCount((n) => n + 1)} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">{weatherState.loading ? "Loading…" : "Refresh live forecast"}</button></div></div></CardContent></Card>
    <div className="grid gap-4 md:grid-cols-6"><MetricCard icon={MountainIcon} label="Objective Type" value={routeTypeLabel(climb)} detail={routeTypeDescription(climb)} /><MetricCard icon={SunIcon} label="Immediate Go Window" value={hasLiveData ? `${immediateGoQuality.toFixed(1)} / 10` : "NO DATA"} detail={climb.routeType === "ski_corn" ? "Next 24–48 hrs" : "Next 24 hrs"} className={scoreColor(immediateGoQuality)} /><MetricCard icon={GaugeIcon} label="72h Pattern Stability" value={hasLiveData ? `${windowQuality.toFixed(1)} / 10` : "NO DATA"} detail="Next 3-day block" className={scoreColor(windowQuality)} /><MetricCard icon={TrendIcon} label="Best Upcoming Window" value={hasLiveData ? `${bestWindow.quality.toFixed(1)} / 10` : "NO DATA"} detail={hasLiveData ? `${bestWindow.label} · ${watchStatusForWindow(bestWindow)}` : "NO DATA"} className={scoreColor(bestWindow.quality)} /><MetricCard icon={GaugeIcon} label="Forecast Confidence" value={hasLiveData ? `${bestWindow.confidence.toFixed(1)} / 10` : "NO DATA"} detail="Lead-time penalty + model spread" className={scoreColor(bestWindow.confidence)} /><MetricCard icon={ShieldIcon} label="Avalanche Risk Context" value={hasAvalancheData ? `${avalanche.riskScore.toFixed(1)} / 10` : "NO LIVE DATA"} detail={mode === "winter" ? avalanche.headline : "Hidden in summer mode"} className={scoreColor(avalanche.riskScore, true)} /><MetricCard icon={TrendIcon} label="Pattern State" value={hasLiveData ? pattern : "NO DATA"} detail="Lookback + forecast" /></div>
    <Card><CardContent className="p-5"><div className="flex gap-3"><AlertIcon className="mt-1 h-5 w-5 text-amber-600" /><div><h3 className="font-semibold text-slate-950">Interpretation</h3><p className="mt-1 text-slate-700">{recommendation}</p><p className="mt-2 text-sm text-slate-500">The app alerts on “possible window forming,” not “safe to go.” Final decisions require human review of route conditions, observations, avalanche problems, glacier hazards, and team capability.</p></div></div></CardContent></Card>
    {!hasLiveData && <div className="rounded-2xl border border-red-500 bg-red-50 p-6 text-sm text-red-900"><strong>DATA ERROR — DO NOT USE THIS TOOL</strong><div className="mt-2">{weatherState.error || "Live weather data could not be retrieved."}</div><div className="mt-2">All scoring, windows, and recommendations are disabled.</div></div>}
    {hasLiveData && <><WindowTimeline forecast={forecast} bestWindow={bestWindow} source={source} /><div className="grid gap-4 lg:grid-cols-2"><RawModelLineChart forecast={forecast} metricKey="summitTempC" unit="°C" title="Raw model traces: summit temperature" note="Actual per-model values returned by the backend connector. Missing values are shown as gaps, not zeros." /><RawModelLineChart forecast={forecast} metricKey="summitWindKph" unit="kph" title="Raw model traces: summit wind" note="Use this to see convergence or model disagreement." /></div><ModelAvailabilityPanel forecast={forecast} climb={climb} unavailableModels={unavailableModels} /></>}
    <AlertRulePanel climb={climb} mode={mode} setMode={setMode} />
    <div className="grid grid-cols-7 gap-2 rounded-2xl bg-white p-1 shadow-sm"><TabButton active={tab === "forecast"} onClick={() => setTab("forecast")}>Forecast</TabButton><TabButton active={tab === "corn"} onClick={() => setTab("corn")}>Corn Cycle</TabButton><TabButton active={tab === "lookback"} onClick={() => setTab("lookback")}>14-day lookback</TabButton><TabButton active={tab === "avalanche"} onClick={() => setTab("avalanche")}>Avalanche</TabButton><TabButton active={tab === "alerts"} onClick={() => setTab("alerts")}>Alerts</TabButton><TabButton active={tab === "map"} onClick={() => setTab("map")}>Map</TabButton><TabButton active={tab === "logic"} onClick={() => setTab("logic")}>Scoring logic</TabButton></div>
    {tab === "forecast" && <div className="grid gap-4 lg:grid-cols-2"><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><WindIcon /> Forecast: wind by elevation</h3><MiniLineChart data={combinedChart} series={[{ key: "summitWindAvg", label: "Summit wind", unit: "kph", className: "text-slate-900" }, { key: "midWindAvg", label: "Mid-mountain wind", unit: "kph", className: "text-slate-500" }, { key: "valleyWindAvg", label: "Valley wind", unit: "kph", className: "text-slate-400" }]} minOverride={0} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><SunIcon /> Forecast: summit temperature swing</h3><MiniLineChart data={combinedChart} series={[{ key: "summitTempAvg", label: "Summit avg", unit: "°C", className: "text-slate-900" }, { key: "summitTempMinAvg", label: "Summit low", unit: "°C", className: "text-slate-500" }, { key: "summitTempMaxAvg", label: "Summit high", unit: "°C", className: "text-slate-400" }]} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><RainIcon /> Forecast: summit rain</h3><MiniLineChart data={combinedChart} series={[{ key: "summitRainAvg", label: "Summit rain", unit: "mm", className: "text-slate-900" }]} minOverride={0} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><SnowIcon /> Forecast: summit snow</h3><MiniLineChart data={combinedChart} series={[{ key: "summitSnowAvg", label: "Summit snow", unit: "cm", className: "text-slate-900" }]} minOverride={0} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><MountainIcon /> Freezing level</h3><MiniLineChart data={combinedChart} series={[{ key: "freezingLevelM", label: "Freezing level", unit: "m", className: "text-slate-900" }]} minOverride={0} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><GaugeIcon /> Pressure</h3><MiniLineChart data={combinedChart} series={[{ key: "pressureHpa", label: "Pressure", unit: "hPa", className: "text-slate-900" }]} /></CardContent></Card></div>}
    {tab === "corn" && <CornCyclePanel climb={climb} forecast={forecast} />}
    {tab === "lookback" && <div className="rounded-2xl border bg-white p-5 text-sm text-slate-700">Lookback uses only backend-supplied observed/history data. If your backend route does not supply history yet, this section will remain limited.</div>}
    {tab === "avalanche" && <div className="grid gap-4 lg:grid-cols-3"><Card className="lg:col-span-2"><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><SnowIcon /> Live avalanche bulletin</h3>{!hasAvalancheData && <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><strong>NO LIVE AVALANCHE DATA IN SCORING</strong><div className="mt-2">{avalancheState.error || avalanche.headline}</div></div>}{hasAvalancheData && <><div className="mb-3 text-sm text-slate-600">Source: {avalancheState.data?.source}</div><div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-100 text-left text-slate-600"><tr><th className="p-3">Valid / Issued</th><th className="p-3">Alpine</th><th className="p-3">Treeline</th><th className="p-3">Problems</th><th className="p-3">Summary</th></tr></thead><tbody>{avalancheHistory.map((d) => <tr key={d.label} className="border-t"><td className="p-3 font-medium">{d.label}</td><td className="p-3"><DangerBadge rating={d.alpine || 0} /></td><td className="p-3"><DangerBadge rating={d.treeline || 0} /></td><td className="p-3">{(d.problems || []).join(", ") || "—"}</td><td className="p-3 text-slate-600">{d.note}</td></tr>)}</tbody></table></div></>}</CardContent></Card><Card><CardContent className="space-y-4 p-5"><h3 className="font-semibold">Avalanche summary</h3><div><div className="text-sm text-slate-500">Current alpine rating</div><div className="mt-1"><DangerBadge rating={avalanche.last?.alpine || 0} /></div></div><p className="text-sm text-slate-700">{avalanche.headline}</p>{avalancheState.loading && <p className="text-xs text-slate-500">Loading avalanche feed…</p>}</CardContent></Card></div>}
    {tab === "alerts" && <AlertRulePanel climb={climb} mode={mode} setMode={setMode} />}
    {tab === "map" && <MapPickerPlaceholder onSelect={(id) => { setClimbId(id); setTab("forecast"); }} />}
    {tab === "logic" && <Card><CardContent className="space-y-5 p-5"><h3 className="font-semibold">How this version scores route types and time horizons</h3><p className="text-slate-600"><strong>Corn-cycle ski objectives</strong> reward overnight freeze, high pressure, light wind, low precip, and daytime warming/freezing level rising close to the summit. Summit highs near or slightly above 0°C can improve corn timing; the model penalizes no refreeze, excessive heat, wind, or new precip.</p><p className="text-slate-600"><strong>Pure rock objectives</strong> heavily reward dry, clear, warm weather with freezing levels above the summit and penalize any precip or below-freezing summit temperatures.</p><p className="text-slate-600"><strong>Mixed alpine / ice objectives</strong> reward clear weather, low precip, manageable wind, and a useful freeze/refreeze while penalizing both extreme cold and sloppy warm conditions.</p><p className="text-slate-600"><strong>Immediate Go Window</strong> is route-operational: for corn skiing it emphasizes the next 24–48 hours; for rock or alpine routes it emphasizes the next day. <strong>72h Pattern Stability</strong> is stricter and asks whether the whole next 3-day block is clean.</p><p className="text-slate-600"><strong>Best Upcoming Window</strong> still uses a 3-day pattern window so you can see a possible D+11 to D+13 setup forming before it enters the immediate timeframe.</p><p className="text-slate-600">Backend failures are displayed as NO DATA. Short-range model gaps are displayed as gaps/unavailable, not zero wind, zero temperature, or zero pressure.</p></CardContent></Card>}
  </div></div>;
}
