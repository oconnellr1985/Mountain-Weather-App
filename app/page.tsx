"use client";
// @ts-nocheck

import React, { useEffect, useMemo, useState } from "react";

const climbs = [
  // Added Washington Cascades spring ski + alpine objectives
  { id: "robson-kain", name: "Mount Robson — Kain Face", region: "Canadian Rockies", lat: 53.11, lon: -119.156, summitM: 3954, style: "mixed alpine / ice", routeType: "mixed_alpine_ice", defaultMode: "summer", activeFromMonth: 7, thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 0, maxPrecipMm3Day: 0, minFreezingLevelM: 2800, maxFreezingLevelM: 4300, idealFreezingLevelM: 3600, minSummitTempC: -15, idealSummitTempMinC: -10, maxSummitTempC: 2, coldSummitPenaltyPerC: 0.25, windPenaltyPerKph: 0.12, precipPenaltyPerMm: 0.45, strictNoPrecip: true, requiresOvernightFreeze: true, requiresClearSkies: true } },
  { id: "sir-donald-nw-ridge", name: "Mount Sir Donald — NW Ridge", region: "Selkirks", lat: 51.263, lon: -117.437, summitM: 3284, style: "pure alpine rock", routeType: "pure_rock", defaultMode: "summer", activeFromMonth: 7, thresholds: { maxSummitWindKph: 35, maxPrecipMm24h: 0, maxPrecipMm3Day: 0, minFreezingLevelM: 3400, maxFreezingLevelM: 5200, windPenaltyPerKph: 0.06, precipPenaltyPerMm: 1.2, rockDryObjective: true, minSummitTempC: 1, idealSummitTempC: 8, idealValleyTempC: 30, strictNoPrecip: true, requiresClearSkies: true } },
  { id: "bugaboo-spire", name: "Bugaboo Spire — Kain Route", region: "Purcells", lat: 50.736, lon: -116.771, summitM: 3204, style: "pure alpine rock", routeType: "pure_rock", defaultMode: "summer", activeFromMonth: 7, thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 0.5, maxPrecipMm3Day: 1, minFreezingLevelM: 3200, maxFreezingLevelM: 5000, minSummitTempC: 0, idealSummitTempC: 6, precipPenaltyPerMm: 0.9, rockDryObjective: true, requiresClearSkies: true } },
  { id: "adams-sw-chutes", name: "Mount Adams — SW Chutes", region: "Washington Cascades", lat: 46.202, lon: -121.49, summitM: 3743, style: "spring ski mountaineering / corn cycle", routeType: "ski_corn", defaultMode: "winter", activeFromMonth: 1, thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 0.5, maxPrecipMm3Day: 1.5, minFreezingLevelM: 2600, maxFreezingLevelM: 4300, idealFreezingLevelM: 3800, windPenaltyPerKph: 0.11, precipPenaltyPerMm: 0.55, skiCornObjective: true, idealPressureHpa: 1018, idealMidTempMinC: -4, idealMidTempMaxC: 7, idealSummitTempMinC: -8, idealSummitTempMaxC: 4, excessiveSummitTempC: 7, requiresOvernightFreeze: true, requiresClearSkies: true } },
  { id: "temple-aemmer", name: "Mount Temple — Aemmer Couloir", region: "Canadian Rockies", lat: 51.35, lon: -116.207, summitM: 3544, style: "Canadian Rockies powder / steep ski objective", routeType: "powder_ski", defaultMode: "winter", activeFromMonth: 1, thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 20, maxPrecipMm3Day: 35, minNewSnow24hCm: 8, idealNewSnow24hCm: 15, maxNewSnow24hCm: 20, minFreezingLevelM: 800, maxFreezingLevelM: 2200, idealFreezingLevelM: 1600, minSummitTempC: -18, maxSummitTempC: -3, maxAvalancheRiskScore: 5.5, requiresAvalancheModerateOrLower: true, continentalSnowpack: true, windPenaltyPerKph: 0.14, precipPenaltyPerMm: 0.35 } },
  { id: "swiss-couloir", name: "Swiss Couloir — Rogers Pass", region: "Selkirks", lat: 51.3556, lon: -117.5311, summitM: 3167, style: "south-facing winter powder / steep ski objective", routeType: "powder_ski", defaultMode: "winter", activeFromMonth: 12, thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 20, maxPrecipMm3Day: 35, minNewSnow24hCm: 6, idealNewSnow24hCm: 12, maxNewSnow24hCm: 20, minFreezingLevelM: 600, maxFreezingLevelM: 1800, idealFreezingLevelM: 1200, minSummitTempC: -20, maxSummitTempC: -4, maxAvalancheRiskScore: 5.5, requiresAvalancheModerateOrLower: true, solarSensitivePowder: true, southFacingPowder: true, windPenaltyPerKph: 0.16, precipPenaltyPerMm: 0.35 } },
  { id: "rogers-three-passes", name: "Three Passes Traverse — Rogers Pass", region: "Selkirks", lat: 51.288677, lon: -117.62186, summitM: 2678, style: "winter / spring ski traverse with Catamount North Face descent; strongly snow-coverage sensitive at both low-elevation ends", routeType: "winter_traverse", defaultMode: "winter", activeFromMonth: 2, thresholds: { maxSummitWindKph: 35, maxPrecipMm24h: 6, maxPrecipMm3Day: 15, minFreezingLevelM: 600, maxFreezingLevelM: 2800, idealFreezingLevelM: 1800, maxAvalancheRiskScore: 5.5, requiresAvalancheModerateOrLower: true, requiresClearSkies: true, coverageSensitive: true, entranceSnowCriticalM: 1150, exitSnowCriticalM: 1000, maxExitTempC: 7, windPenaltyPerKph: 0.10, precipPenaltyPerMm: 0.35, gpxRouteKm: 31.0, gpxSmoothedGainM: 2470, gpxRecordedHours: 10.9 } },
  { id: "brunswick-north-couloir", name: "Brunswick Mountain — North Couloir", region: "South Coast", lat: 49.4878, lon: -123.2014, summitM: 1788, style: "low-elevation fickle winter powder / steep ski objective", routeType: "powder_ski", defaultMode: "winter", activeFromMonth: 3, thresholds: { maxSummitWindKph: 35, maxPrecipMm24h: 18, maxPrecipMm3Day: 30, minNewSnow24hCm: 8, idealNewSnow24hCm: 15, maxNewSnow24hCm: 20, minFreezingLevelM: 0, maxFreezingLevelM: 1100, idealFreezingLevelM: 700, minSummitTempC: -15, maxSummitTempC: -2, maxAvalancheRiskScore: 5.5, requiresAvalancheModerateOrLower: true, lowElevationPowder: true, coverageSensitive: true, windPenaltyPerKph: 0.13, precipPenaltyPerMm: 0.35 } },
  { id: "mount-hector", name: "Mount Hector — North Glacier", region: "Canadian Rockies", lat: 51.575, lon: -116.2594, summitM: 3394, style: "spring glacier ski mountaineering / corn cycle", routeType: "ski_corn", defaultMode: "winter", activeFromMonth: 3, thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 0.75, maxPrecipMm3Day: 2, minFreezingLevelM: 1800, maxFreezingLevelM: 3900, idealFreezingLevelM: 3300, windPenaltyPerKph: 0.11, precipPenaltyPerMm: 0.65, skiCornObjective: true, idealPressureHpa: 1018, idealMidTempMinC: -5, idealMidTempMaxC: 6, idealSummitTempMinC: -10, idealSummitTempMaxC: 3, excessiveSummitTempC: 6, requiresOvernightFreeze: true, requiresClearSkies: true, glacierTravelObjective: true } },
  { id: "currie-north-couloirs", name: "Mount Currie — Pencil / Central Couloirs", region: "Coast Mountains", lat: 50.2486, lon: -122.7819, summitM: 2591, style: "north-face winter powder / steep ski objective", routeType: "powder_ski", defaultMode: "winter", activeFromMonth: 1, thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 20, maxPrecipMm3Day: 35, minNewSnow24hCm: 8, idealNewSnow24hCm: 15, maxNewSnow24hCm: 20, minFreezingLevelM: 300, maxFreezingLevelM: 1500, idealFreezingLevelM: 900, minSummitTempC: -18, maxSummitTempC: -3, maxAvalancheRiskScore: 5.5, requiresAvalancheModerateOrLower: true, lowElevationPowder: true, windPenaltyPerKph: 0.15, precipPenaltyPerMm: 0.35 } },
  { id: "ptarmigan-traverse", name: "Ptarmigan Traverse — Washington", region: "Washington Cascades", lat: 48.4676, lon: -121.0591, summitM: 2400, style: "summer alpine run / scramble / glacier traverse; very long single day", routeType: "summer_endurance", defaultMode: "summer", activeFromMonth: 7, thresholds: { maxSummitWindKph: 35, maxPrecipMm24h: 1, maxPrecipMm3Day: 3, minFreezingLevelM: 2200, maxFreezingLevelM: 5000, minSummitTempC: -2, idealSummitTempC: 7, maxSummitTempC: 16, requiresClearSkies: true, strictNoPrecip: true, navigationCritical: true, windPenaltyPerKph: 0.08, precipPenaltyPerMm: 0.9 } },
  { id: "liberty-pass-birthday-tour", name: "Liberty Pass — Birthday Tour", region: "Washington Cascades", lat: 48.52, lon: -120.66, summitM: 2135, style: "spring ski tour / corn cycle", routeType: "ski_corn", defaultMode: "winter", activeFromMonth: 1, thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 0.5, maxPrecipMm3Day: 1.5, minFreezingLevelM: 1500, maxFreezingLevelM: 2800, idealFreezingLevelM: 2200, windPenaltyPerKph: 0.10, precipPenaltyPerMm: 0.5, skiCornObjective: true, idealPressureHpa: 1018, idealMidTempMinC: -4, idealMidTempMaxC: 7, idealSummitTempMinC: -8, idealSummitTempMaxC: 5, excessiveSummitTempC: 8, requiresOvernightFreeze: true, requiresClearSkies: true } },
  { id: "north-twin-north-face", name: "North Twin, WA — North Face", region: "Washington Cascades", lat: 48.762, lon: -121.689, summitM: 2026, style: "spring ski mountaineering / corn cycle", routeType: "ski_corn", defaultMode: "winter", activeFromMonth: 1, thresholds: { maxSummitWindKph: 35, maxPrecipMm24h: 0.75, maxPrecipMm3Day: 2, minFreezingLevelM: 1200, maxFreezingLevelM: 2600, idealFreezingLevelM: 2100, windPenaltyPerKph: 0.10, precipPenaltyPerMm: 0.55, skiCornObjective: true, idealPressureHpa: 1018, idealMidTempMinC: -4, idealMidTempMaxC: 7, idealSummitTempMinC: -8, idealSummitTempMaxC: 5, excessiveSummitTempC: 8, requiresOvernightFreeze: true, requiresClearSkies: true } },
  { id: "shuksan-north-face", name: "Mount Shuksan — North Face", region: "Washington Cascades", lat: 48.832, lon: -121.602, summitM: 2783, style: "powder / steep glaciated ski objective", routeType: "powder_ski", defaultMode: "winter", activeFromMonth: 1, thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 20, maxPrecipMm3Day: 35, minNewSnow24hCm: 8, idealNewSnow24hCm: 15, maxNewSnow24hCm: 20, minFreezingLevelM: 900, maxFreezingLevelM: 2400, idealFreezingLevelM: 1700, minSummitTempC: -18, maxSummitTempC: -3, maxAvalancheRiskScore: 5.5, requiresAvalancheModerateOrLower: true, windPenaltyPerKph: 0.14, precipPenaltyPerMm: 0.35 } },
  { id: "rainier-fuhrer-finger", name: "Mount Rainier — Fuhrer Finger", region: "Washington Cascades", lat: 46.852, lon: -121.76, summitM: 4392, style: "spring ski mountaineering / corn cycle", routeType: "ski_corn", defaultMode: "winter", activeFromMonth: 1, thresholds: { maxSummitWindKph: 35, maxPrecipMm24h: 0.75, maxPrecipMm3Day: 2, minFreezingLevelM: 3000, maxFreezingLevelM: 4700, idealFreezingLevelM: 4300, windPenaltyPerKph: 0.11, precipPenaltyPerMm: 0.65, skiCornObjective: true, idealPressureHpa: 1018, idealMidTempMinC: -5, idealMidTempMaxC: 6, idealSummitTempMinC: -12, idealSummitTempMaxC: 2, excessiveSummitTempC: 5, requiresOvernightFreeze: true, requiresClearSkies: true } },
];

const FORECAST_MODEL_CATALOG = [
  { id: "gfs", label: "GFS", provider: "NOAA GFS via Open-Meteo", maxLeadDays: 16, regions: ["global"] },
  { id: "ecmwf_ifs", label: "ECMWF IFS HRES 9 km", provider: "ECMWF via Open-Meteo", maxLeadDays: 15, regions: ["global"] },
  { id: "ecmwf_aifs", label: "ECMWF AIFS", provider: "ECMWF AIFS via Open-Meteo", maxLeadDays: 15, regions: ["global"] },
  { id: "gem_global", label: "GEM Global / GDPS", provider: "ECCC GDPS via Open-Meteo", maxLeadDays: 10, regions: ["global"] },
  { id: "gem_regional", label: "GEM Regional / RDPS", provider: "ECCC RDPS via Open-Meteo", maxLeadDays: 3.5, regions: ["north_america"] },
  { id: "gem_hrdps_continental", label: "HRDPS Continental", provider: "ECCC HRDPS via Open-Meteo", maxLeadDays: 2, regions: ["north_america"] },
  { id: "gem_hrdps_west", label: "HRDPS West (experimental)", provider: "ECCC HRDPS West via Open-Meteo", maxLeadDays: 2, regions: ["north_america"] },
  { id: "gfs_hrrr", label: "HRRR", provider: "NOAA HRRR via Open-Meteo", maxLeadDays: 2, regions: ["north_america"] },
  { id: "nam_conus", label: "NAM CONUS", provider: "NOAA NAM via Open-Meteo", maxLeadDays: 2.5, regions: ["north_america"] },
  { id: "noaa_nbm", label: "NBM (blended guidance)", provider: "NOAA NBM via Open-Meteo", maxLeadDays: 11, regions: ["north_america"], guidanceOnly: true },
  { id: "noaa_rap", label: "RAP", provider: "NOAA/NOMADS connector pending", maxLeadDays: 2.125, regions: ["north_america"] },
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
function getObjectiveRegion(climb) {
  if (!climb) return "global";
  if (climb.region.includes("Washington")) return "usa";
  if (
    climb.region.includes("Canadian") ||
    climb.region.includes("Selkirks") ||
    climb.region.includes("Purcells") ||
    climb.region.includes("South Coast") ||
    climb.region.includes("Coast Mountains")
  ) return "canada";
  return "global";
}
function modelAppliesToClimb(model, climb) {
  if (!model || !climb) return false;
  const region = getObjectiveRegion(climb);
  if (model.regions.includes("global")) return true;
  return model.regions.includes("north_america") && (region === "usa" || region === "canada");
}
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

function isoDateOffset(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}
function estimateFreezingLevelFromSummitTemp(climb, summitTempMaxC) {
  // Fallback when archive feed does not include freezing-level height. Uses standard lapse-rate from summit elevation.
  return Math.max(0, Math.round(climb.summitM + (Number(summitTempMaxC || 0) / 6.5) * 1000));
}
function isCredibleHistory(history = []) {
  if (!Array.isArray(history) || history.length < 7) return false;
  const changingDates = new Set(history.map((d) => d.date)).size >= 7;
  const variableTemps = new Set(history.map((d) => Number(historyTempMaxC(d)).toFixed(1))).size >= 3;
  return changingDates && variableTemps;
}
async function fetchHistoricalLookbackFromOpenMeteo(climb) {
  const daily = ["temperature_2m_min", "temperature_2m_max", "precipitation_sum", "rain_sum", "snowfall_sum", "wind_speed_10m_max", "pressure_msl_mean"].join(",");
  const params = new URLSearchParams({
    latitude: String(climb.lat),
    longitude: String(climb.lon),
    elevation: String(climb.summitM),
    daily,
    past_days: "14",
    forecast_days: "1",
    timezone: "auto",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    temperature_unit: "celsius",
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const result = await fetchJsonSafe(url);
  if (!result.ok) return { ok: false, history: [], source: "NO REAL HISTORY", error: result.error };
  const dailyData = result.data?.daily || {};
  const times = dailyData.time || [];
  const rows = times.slice(-14).map((date, i, arr) => {
    const tempMin = dailyData.temperature_2m_min?.[times.indexOf(date)] ?? 0;
    const tempMax = dailyData.temperature_2m_max?.[times.indexOf(date)] ?? 0;
    const snowCm = dailyData.snowfall_sum?.[times.indexOf(date)] ?? 0;
    const rainMm = dailyData.rain_sum?.[times.indexOf(date)] ?? 0;
    const precipMm = dailyData.precipitation_sum?.[times.indexOf(date)] ?? 0;
    const windKph = dailyData.wind_speed_10m_max?.[times.indexOf(date)] ?? 0;
    const pressureHpa = dailyData.pressure_msl_mean?.[times.indexOf(date)] ?? 0;
    return {
      label: `D-${arr.length - i}`,
      date,
      observedSummitTempMinC: Number(tempMin),
      observedSummitTempMaxC: Number(tempMax),
      observedPrecipMm: Number(precipMm),
      observedRainMm: Number(rainMm),
      observedSnowCm: Number(snowCm),
      observedWindKph: Number(windKph),
      observedPressureHpa: Number(pressureHpa),
      observedFreezingLevelM: estimateFreezingLevelFromSummitTemp(climb, tempMax),
      freezingLevelEstimated: true,
    };
  });
  if (!isCredibleHistory(rows)) return { ok: false, history: [], source: "NO REAL HISTORY", error: "Open-Meteo returned insufficient recent history." };
  return { ok: true, history: rows, source: "Open-Meteo recent past daily data at objective summit elevation; freezing level estimated from summit high temp" };
}

async function fetchWeatherFromBackend(climb) {
  const url = `/api/weather?climbId=${encodeURIComponent(climb.id)}&lat=${climb.lat}&lon=${climb.lon}&summitM=${climb.summitM}&region=${encodeURIComponent(getObjectiveRegion(climb))}`;
  const result = await fetchJsonSafe(url);
  if (!result.ok) return { ok: false, forecast: [], history: [], historySource: "NO REAL HISTORY", source: "NO DATA", unavailableModels: [], error: `Weather backend failed: ${result.error}` };
  const data = result.data || {};
  if (!Array.isArray(data.forecast) || data.forecast.length < 3) return { ok: false, forecast: [], history: [], historySource: "NO REAL HISTORY", source: data.source || "NO DATA", unavailableModels: data.unavailableModels || [], error: "Weather backend returned insufficient forecast data." };

  // Always try to replace backend/synthetic lookback with a real recent-past data pull.
  // If this fails, do not silently show placeholder history.
  const realHistory = await fetchHistoricalLookbackFromOpenMeteo(climb);
  const backendHistorySource = String(data.historySource || data.source || "");
  const backendHistoryIsExplicitReal = /archive|open-meteo|observed|era5|histor/i.test(backendHistorySource) && isCredibleHistory(data.history);
  const history = realHistory.ok ? realHistory.history : backendHistoryIsExplicitReal ? data.history : [];
  const historySource = realHistory.ok ? realHistory.source : backendHistoryIsExplicitReal ? backendHistorySource : `NO REAL HISTORY — ${realHistory.error || "backend did not provide an explicit real history source"}`;

  return { ok: true, forecast: data.forecast, history, historySource, source: data.source || "Weather backend", unavailableModels: data.unavailableModels || [], error: "" };
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
function firstNumber(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}
function pct(value, fallback = null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, value));
}
function cloudValueFromModels(day, key) {
  const v = avg((day.modelValues || []).map((m) => m[key]).filter((x) => typeof x === "number" && Number.isFinite(x)));
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function dayCloudPct(day) { return pct(firstNumber(day.cloudCoverPct, day.cloudPct, day.cloudCover, day.totalCloudPct, day.totalCloudCoverPct, cloudValueFromModels(day, "cloudCoverPct"))); }
function dayLowCloudPct(day) { return pct(firstNumber(day.cloudCoverLowPct, day.lowCloudPct, day.cloudCoverLow, day.lowCloudCoverPct, cloudValueFromModels(day, "cloudCoverLowPct"))); }
function dayMidCloudPct(day) { return pct(firstNumber(day.cloudCoverMidPct, day.midCloudPct, day.cloudCoverMid, day.midCloudCoverPct, cloudValueFromModels(day, "cloudCoverMidPct"))); }
function dayHighCloudPct(day) { return pct(firstNumber(day.cloudCoverHighPct, day.highCloudPct, day.cloudCoverHigh, day.highCloudCoverPct, cloudValueFromModels(day, "cloudCoverHighPct"))); }
function hasCloudData(day) { return dayCloudPct(day) !== null || dayLowCloudPct(day) !== null || dayMidCloudPct(day) !== null || dayHighCloudPct(day) !== null; }
function cloudWeightedFraction(day, fallback = 0.35) {
  const total = dayCloudPct(day);
  const low = dayLowCloudPct(day);
  const mid = dayMidCloudPct(day);
  const high = dayHighCloudPct(day);
  if (low !== null || mid !== null || high !== null) return Math.max(0, Math.min(1, ((low ?? total ?? 0) * 0.7 + (mid ?? 0) * 0.25 + (high ?? 0) * 0.05) / 100));
  if (total !== null) return Math.max(0, Math.min(1, total / 100));
  return fallback;
}
function cornCloudFraction(day) {
  // Low cloud kills direct solar most strongly; high thin cloud is often much less destructive.
  return cloudWeightedFraction(day, 0.35);
}
function solarReliability(day) {
  const cloud = cloudWeightedFraction(day, null);
  if (cloud === null) return null;
  return Math.max(0.15, Math.min(1, 1 - cloud * 0.85));
}
function navigationVisibilityScore(day) {
  if (!hasCloudData(day)) return null;
  const low = dayLowCloudPct(day) ?? dayCloudPct(day) ?? 0;
  const mid = dayMidCloudPct(day) ?? 0;
  const total = dayCloudPct(day) ?? Math.max(low, mid, dayHighCloudPct(day) ?? 0);
  const precip = dayPrecip(day);
  const wind = dayWind(day);
  // Low cloud is the major route-finding/glacier-navigation penalty; mid cloud matters somewhat; high cloud is mostly a light/contrast penalty.
  return clampScore(10 - low * 0.07 - mid * 0.025 - total * 0.018 - precip * 0.8 - Math.max(0, wind - 35) * 0.08);
}
function cloudNavigationLabel(score) {
  if (score === null || score === undefined) return "NO DATA";
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Manageable";
  if (score >= 4) return "Marginal";
  return "Poor / whiteout risk";
}
function cloudText(value) { return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}%` : "NO DATA"; }
function distancePenalty(value, ideal, tolerance, weight = 1) { if (typeof value !== "number" || typeof ideal !== "number") return 0; const delta = Math.abs(value - ideal); return Math.max(0, delta - tolerance) * weight; }
function routeTypeLabel(climb) {
  if (climb.routeType === "powder_ski") return "Powder / steep ski objective";
  if (climb.routeType === "ski_corn") return "Corn-cycle ski objective";
  if (climb.routeType === "pure_rock") return "Dry warm rock objective";
  if (climb.routeType === "mixed_alpine_ice") return "Mixed alpine / ice objective";
  if (climb.routeType === "winter_traverse") return "Winter / spring ski traverse";
  if (climb.routeType === "summer_endurance") return "Long-day summer alpine traverse";
  return "General alpine objective";
}
function routeTypeDescription(climb) {
  if (climb.routeType === "powder_ski") return "Cold snow, controlled new-load timing, limited wind loading, and conservative avalanche gates.";
  if (climb.routeType === "ski_corn") return "Overnight freeze + daytime thaw near summit for corn timing.";
  if (climb.routeType === "pure_rock") return "Dry, warm, no precip, freezing level above route.";
  if (climb.routeType === "mixed_alpine_ice") return "Clear, low precip, manageable wind, useful freeze/refreeze.";
  if (climb.routeType === "winter_traverse") return "Good stability and visibility, manageable loading, and enough low-elevation snow coverage to complete the entire traverse.";
  if (climb.routeType === "summer_endurance") return "Dry, visible, moderate temperatures and winds, with enough margin for a very long exposed travel day.";
  return "General alpine objective.";
}

function ratingBand(score) {
  if (score >= 8.5) return { label: "Excellent", className: "border-emerald-300 bg-emerald-50 text-emerald-800" };
  if (score >= 7) return { label: "Good", className: "border-lime-300 bg-lime-50 text-lime-800" };
  if (score >= 5.5) return { label: "Marginal", className: "border-amber-300 bg-amber-50 text-amber-800" };
  if (score >= 3.5) return { label: "Poor", className: "border-orange-300 bg-orange-50 text-orange-800" };
  return { label: "Dangerous", className: "border-red-300 bg-red-50 text-red-800" };
}
function driverSeverityClass(severity) {
  if (severity === "positive") return "border-emerald-300 bg-emerald-50 text-emerald-900";
  if (severity === "major") return "border-red-300 bg-red-50 text-red-900";
  if (severity === "moderate") return "border-orange-300 bg-orange-50 text-orange-900";
  return "border-amber-300 bg-amber-50 text-amber-900";
}
function getTopDrivers(climb, forecast = [], history = [], avalanche = {}) {
  const day = forecast[0] || {};
  const t = climb.thresholds || {};
  const temp = daySummitTemp(day);
  const wind = dayWind(day);
  const precip = dayPrecip(day);
  const visibility = navigationVisibilityScore(day);
  const lowCloud = dayLowCloudPct(day);
  const totalCloud = dayCloudPct(day);
  const freezingLevel = day.freezingLevelM || 0;
  const surface = buildSurfaceState(climb, history);
  const positives = [];
  const constraints = [];
  if (precip <= (t.maxPrecipMm24h ?? 1)) positives.push({ label: "Low precipitation", detail: `${precip.toFixed(1)} mm in first forecast day`, severity: "positive" });
  else constraints.push({ label: "Precipitation", detail: `${precip.toFixed(1)} mm exceeds preferred limit`, severity: precip > 5 ? "major" : "moderate" });
  if (wind <= (t.maxSummitWindKph ?? 35)) positives.push({ label: "Wind acceptable", detail: `${Math.round(wind)} kph summit wind`, severity: "positive" });
  else constraints.push({ label: "Wind", detail: `${Math.round(wind)} kph exceeds route threshold`, severity: wind > 55 ? "major" : "moderate" });
  if (climb.routeType === "mixed_alpine_ice") {
    if (temp < (t.minSummitTempC ?? -18)) constraints.push({ label: "Extreme summit cold", detail: `${temp.toFixed(1)}°C is colder than preferred for this route`, severity: "moderate" });
    else if (typeof t.maxSummitTempC === "number" && temp > t.maxSummitTempC) constraints.push({ label: "Summit warming", detail: `${temp.toFixed(1)}°C may degrade snow/ice quality`, severity: "moderate" });
    else positives.push({ label: "Useful alpine freeze", detail: `${temp.toFixed(1)}°C at summit`, severity: "positive" });
    if (visibility !== null && visibility < 7) constraints.push({ label: "Route-finding visibility", detail: `${cloudNavigationLabel(visibility)} · low cloud ${cloudText(lowCloud)} · total ${cloudText(totalCloud)}`, severity: visibility < 4 ? "major" : "moderate" });
    else if (visibility !== null) positives.push({ label: "Navigation visibility", detail: `${cloudNavigationLabel(visibility)} · low cloud ${cloudText(lowCloud)}`, severity: "positive" });
  } else if (climb.routeType === "pure_rock") {
    if (temp < (t.minSummitTempC ?? 0)) constraints.push({ label: "Cold rock", detail: `${temp.toFixed(1)}°C at summit`, severity: "moderate" });
    if (freezingLevel < (t.minFreezingLevelM ?? climb.summitM)) constraints.push({ label: "Freezing level", detail: `${Math.round(freezingLevel)} m is too low for dry warm rock`, severity: "moderate" });
    if (visibility !== null && visibility < 7) constraints.push({ label: "Cloud / visibility", detail: `${cloudNavigationLabel(visibility)} · low cloud ${cloudText(lowCloud)}`, severity: visibility < 4 ? "major" : "moderate" });
  } else if (climb.routeType === "ski_corn") {
    const solar = solarReliability(day);
    if (solar !== null && solar >= 0.7) positives.push({ label: "Solar reliability", detail: `${Math.round(solar * 100)}% supports corn timing`, severity: "positive" });
    else if (solar !== null) constraints.push({ label: "Solar reliability", detail: `${Math.round(solar * 100)}% may delay or prevent corn softening`, severity: solar < 0.4 ? "major" : "moderate" });
    if (typeof day.summitTempMinAvgC === "number" && day.summitTempMinAvgC < -1) positives.push({ label: "Overnight freeze", detail: `Summit low ${day.summitTempMinAvgC.toFixed(1)}°C`, severity: "positive" });
  } else if (climb.routeType === "powder_ski") {
    const snow = ((day.summitSnowGfsCm || 0) + (day.summitSnowEcmwfCm || 0)) / 2;
    if (snow >= 8 && snow <= 20) positives.push({ label: "Manageable refresh", detail: `${snow.toFixed(1)} cm forecast snow`, severity: "positive" });
    else if (snow > 20) constraints.push({ label: "Rapid loading", detail: `${snow.toFixed(1)} cm in 24h exceeds powder gate`, severity: "major" });
    else constraints.push({ label: "Powder source", detail: `${snow.toFixed(1)} cm forecast snow; may be no fresh powder`, severity: "minor" });
   } else if (climb.routeType === "winter_traverse") {
    const profile = routeElevationProfile(climb);
    const exitHigh = estimateHighAtElevation(day, profile.exitM, climb);
    if (visibility !== null && visibility >= 7) positives.push({ label: "Traverse visibility", detail: `${cloudNavigationLabel(visibility)} for complex route-finding`, severity: "positive" });
    else if (visibility !== null) constraints.push({ label: "Traverse visibility", detail: `${cloudNavigationLabel(visibility)} may complicate committing terrain`, severity: visibility < 4 ? "major" : "moderate" });
    if (exitHigh <= (t.maxExitTempC ?? 7)) positives.push({ label: "Low-elevation snow coverage", detail: `Estimated exit high ${exitHigh.toFixed(1)}°C`, severity: "positive" });
    else constraints.push({ label: "Low-elevation snow coverage", detail: `Estimated exit high ${exitHigh.toFixed(1)}°C may accelerate melt / discontinuous skiing`, severity: "moderate" });
  } else if (climb.routeType === "summer_endurance") {
    if (visibility !== null && visibility >= 7) positives.push({ label: "Navigation visibility", detail: `${cloudNavigationLabel(visibility)} for a long alpine crossing`, severity: "positive" });
    else if (visibility !== null) constraints.push({ label: "Navigation visibility", detail: `${cloudNavigationLabel(visibility)} is poor for a long route-finding day`, severity: visibility < 4 ? "major" : "moderate" });
    if (temp >= (t.minSummitTempC ?? -2) && temp <= (t.maxSummitTempC ?? 16)) positives.push({ label: "Travel temperature", detail: `${temp.toFixed(1)}°C supports sustained movement`, severity: "positive" });
    else constraints.push({ label: "Travel temperature", detail: `${temp.toFixed(1)}°C outside preferred long-day range`, severity: "moderate" });
  }
  if (surface.hasData) {
    if (surface.snow3d > 15 && (climb.routeType === "mixed_alpine_ice" || climb.routeType === "powder_ski")) constraints.push({ label: "Recent loading", detail: `${surface.snow3d.toFixed(1)} cm snow in last 3 days`, severity: "major" });
    if (surface.consolidationIndex >= 5 && climb.routeType !== "powder_ski") positives.push({ label: "Consolidation history", detail: `Consolidation ${surface.consolidationIndex.toFixed(1)} / 10 · ${surface.freezeThawCycles} useful refreeze cycles`, severity: "positive" });
    if (surface.meltDamageIndex >= 6) constraints.push({ label: "Melt-damage history", detail: `Melt damage ${surface.meltDamageIndex.toFixed(1)} / 10 from rain/true above-summit warmth`, severity: surface.meltDamageIndex >= 8 ? "major" : "moderate" });
  }
  if (avalanche?.riskScore >= 6 && (climb.routeType === "powder_ski" || climb.routeType === "ski_corn")) constraints.push({ label: "Avalanche gate", detail: `Risk score ${avalanche.riskScore.toFixed(1)} requires manual override`, severity: "major" });
  const topDrivers = [...constraints, ...positives].slice(0, 6);
  return { positives, constraints, topDrivers };
}
function visibilityForecastRows(forecast = []) {
  return forecast.slice(0, 5).map((d) => {
    const score = navigationVisibilityScore(d);
    return { label: d.label, date: d.date, score, labelText: cloudNavigationLabel(score), low: dayLowCloudPct(d), mid: dayMidCloudPct(d), high: dayHighCloudPct(d), total: dayCloudPct(d), precip: dayPrecip(d), wind: dayWind(d) };
  });
}
function OperationalSummaryPanel({ climb, forecast = [], history = [], avalanche = {}, immediateScore = 0, confidence = 0 }) {
  const rating = ratingBand(immediateScore);
  const drivers = getTopDrivers(climb, forecast, history, avalanche);
  const visRows = visibilityForecastRows(forecast);
  return <Card><CardContent className="p-5"><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><h3 className="font-semibold text-slate-950">Operational window summary</h3><p className="mt-1 text-sm text-slate-500">Borrowed matrix-style presentation: rating, confidence, top drivers, operational constraints, and visibility forecast. This is still a route-window signal, not a go/no-go verdict.</p></div><div className="flex flex-wrap gap-2"><Badge className={rating.className} variant="outline">Rating: {rating.label}</Badge><Badge variant="secondary">Quality {immediateScore.toFixed(1)} / 10</Badge><Badge variant="secondary">Confidence {confidence.toFixed(1)} / 10</Badge></div></div><div className="grid gap-4 lg:grid-cols-3"><div className="lg:col-span-2"><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Top drivers / constraints</h4><div className="grid gap-2 md:grid-cols-2">{drivers.topDrivers.length ? drivers.topDrivers.map((d, i) => <div key={`${d.label}-${i}`} className={`rounded-xl border p-3 text-sm ${driverSeverityClass(d.severity)}`}><div className="font-semibold">{d.severity === "positive" ? "✓" : "⚠"} {d.label}</div><div className="mt-1 text-xs opacity-90">{d.detail}</div></div>) : <div className="rounded-xl border bg-slate-50 p-3 text-sm text-slate-600">No forecast drivers available.</div>}</div></div><div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Visibility forecast</h4><div className="space-y-2">{visRows.map((r) => <div key={`${r.label}-${r.date}`} className="rounded-xl border bg-slate-50 p-3 text-xs"><div className="flex items-center justify-between"><span className="font-semibold text-slate-900">{r.label} · {r.date}</span><span className={scoreColor(r.score ?? 0)}>{r.labelText}</span></div><div className="mt-1 text-slate-600">Low {cloudText(r.low)} · Mid {cloudText(r.mid)} · High {cloudText(r.high)} · Total {cloudText(r.total)}</div><div className="text-slate-500">Wind {Math.round(r.wind)} kph · Precip {r.precip.toFixed(1)} mm</div></div>)}</div></div></div></CardContent></Card>;
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

  if (routeType === "powder_ski") {
    routePenalty += forecastDays.reduce((s, d, index) => {
      const summitTemp = daySummitTemp(d);
      const freezingLevel = d.freezingLevelM || 0;
      const snow = ((d.summitSnowGfsCm || 0) + (d.summitSnowEcmwfCm || 0)) / 2;
      const wind = dayWind(d);
      let p = 0;
      if (index === 0 && snow > (t.maxNewSnow24hCm ?? 20)) p += 4.0;
      if (snow < (t.minNewSnow24hCm ?? 8)) p += 1.5;
      if (snow > (t.maxNewSnow24hCm ?? 20)) p += 2.0 + (snow - (t.maxNewSnow24hCm ?? 20)) * 0.15;
      if (summitTemp > (t.maxSummitTempC ?? -3)) p += 2.0 + (summitTemp - (t.maxSummitTempC ?? -3)) * 0.5;
      if (summitTemp < (t.minSummitTempC ?? -18)) p += 0.8;
      if (freezingLevel > (t.maxFreezingLevelM ?? 2200)) p += 2.5;
      if (wind > (t.maxSummitWindKph ?? 30)) p += (wind - (t.maxSummitWindKph ?? 30)) * (t.windPenaltyPerKph ?? 0.14);
      if (t.solarSensitivePowder) {
        const solar = solarReliability(d);
        const midTemp = dayMidTemp(d);
        if (solar !== null && solar > 0.75 && midTemp > -4) p += 1.1 + Math.max(0, midTemp + 4) * 0.18;
      }
      return s + p;
    }, 0);
  } else if (routeType === "ski_corn") {
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
      const solar = solarReliability(d);
      if (solar !== null) {
        if (solar < 0.35) p += 1.6;
        else if (solar < 0.55) p += 0.8;
        else if (solar < 0.75) p += 0.3;
      }
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
      const visibility = navigationVisibilityScore(d);
      if (visibility !== null) {
        if (visibility < 5) p += 2.0;
        else if (visibility < 7) p += 0.8;
      }
      return s + p;
    }, 0);
  } else if (routeType === "winter_traverse") {
    routePenalty += forecastDays.reduce((s, d) => {
      const profile = routeElevationProfile(climb);
      const visibility = navigationVisibilityScore(d);
      const entranceHigh = estimateHighAtElevation(d, profile.entranceM, climb);
      const exitHigh = estimateHighAtElevation(d, profile.exitM, climb);
      const freezingLevel = d.freezingLevelM || 0;
      let p = 0;
      if (visibility !== null) {
        if (visibility < 4) p += 3.0;
        else if (visibility < 6) p += 1.5;
        else if (visibility < 7.5) p += 0.6;
      }
      // GPX-derived route has low-elevation travel at BOTH ends (1138 m start, 988 m exit).
      // Warmth or a high freezing level can make an otherwise good alpine forecast impractical because
      // snow coverage may disappear before the high terrain is reached or after the final descent.
      const maxLowElevationTemp = t.maxExitTempC ?? 7;
      if (entranceHigh > maxLowElevationTemp) p += 0.35 + (entranceHigh - maxLowElevationTemp) * 0.10;
      if (exitHigh > maxLowElevationTemp) p += 0.6 + (exitHigh - maxLowElevationTemp) * 0.18;
      if (t.coverageSensitive && freezingLevel > (t.entranceSnowCriticalM ?? profile.entranceM) + 900) p += 0.45;
      if (t.coverageSensitive && freezingLevel > (t.exitSnowCriticalM ?? profile.exitM) + 900) p += 0.8;
      return s + p;
    }, 0);
  } else if (routeType === "summer_endurance") {
    routePenalty += forecastDays.reduce((s, d) => {
      const summitTemp = daySummitTemp(d);
      const visibility = navigationVisibilityScore(d);
      let p = 0;
      if (summitTemp < (t.minSummitTempC ?? -2)) p += 1.0 + ((t.minSummitTempC ?? -2) - summitTemp) * 0.2;
      if (summitTemp > (t.maxSummitTempC ?? 16)) p += 0.8 + (summitTemp - (t.maxSummitTempC ?? 16)) * 0.12;
      if (visibility !== null) {
        if (visibility < 4) p += 3.2;
        else if (visibility < 6) p += 1.6;
        else if (visibility < 7.5) p += 0.6;
      }
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
      const visibility = navigationVisibilityScore(d);
      if (visibility !== null) {
        if (visibility < 4) p += 3.2;
        else if (visibility < 5) p += 2.2;
        else if (visibility < 7) p += 1.1;
      }
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

function historySnowCm(day) { return day.observedSnowCm ?? day.snowCm ?? day.summitSnowCm ?? 0; }
function historyRainMm(day) { return day.observedRainMm ?? day.rainMm ?? day.summitRainMm ?? 0; }
function historyDamagingRainMm(day, climb) {
  const rawRain = historyRainMm(day);
  if (!rawRain) return 0;
  const summitHigh = historyTempMaxC(day);
  const fl = historyFreezingLevelM(day);
  // Open-Meteo archive rain can reflect grid-scale surface precip even when the elevation-adjusted summit
  // temperature is well below freezing. For route-condition damage, only treat it as damaging rain
  // when summit temperatures are near/above freezing or the estimated freezing level is close to/above the route.
  if (summitHigh >= -1 || fl >= (climb.summitM - 150)) return rawRain;
  return 0;
}
function historyWindKph(day) { return day.observedWindKph ?? day.windKph ?? day.summitWindKph ?? 0; }
function historyTempC(day) { return day.observedSummitTempC ?? day.summitTempC ?? day.tempC ?? 0; }
function historyTempMinC(day) { return day.observedSummitTempMinC ?? day.summitTempMinC ?? day.tempMinC ?? historyTempC(day) - 3; }
function historyTempMaxC(day) { return day.observedSummitTempMaxC ?? day.summitTempMaxC ?? day.tempMaxC ?? historyTempC(day) + 3; }
function historyFreezingLevelM(day) { return day.observedFreezingLevelM ?? day.freezingLevelM ?? 0; }
function historyPressureHpa(day) { return day.observedPressureHpa ?? day.pressureHpa ?? 0; }

function buildSurfaceState(climb, history = []) {
  const days = history.slice(-14);
  if (!days.length) return { hasData: false, days: [], snowLoadingIndex: 0, snow3d: 0, snow7d: 0, snow14d: 0, rain14d: 0, freezeThawCycles: 0, consolidationIndex: 0, meltDamageIndex: 0, warmPulseSeverity: 0, surfaceDamage: 0, surfaceRecovery: 0, routePhase: "NO DATA", interpretation: "No observed 14-day history supplied by the backend yet." };

  const snow14d = days.reduce((s, d) => s + historySnowCm(d), 0);
  const snow7d = days.slice(-7).reduce((s, d) => s + historySnowCm(d), 0);
  const snow3d = days.slice(-3).reduce((s, d) => s + historySnowCm(d), 0);
  const rain14d = days.reduce((s, d) => s + historyRainMm(d), 0);
  const damagingRain14d = days.reduce((s, d) => s + historyDamagingRainMm(d, climb), 0);
  const snowLoadingIndex = days.reduce((s, d, i) => { const daysAgo = days.length - 1 - i; return s + historySnowCm(d) * Math.exp(-daysAgo / 3); }, 0);

  // Two different historical signals matter for Robson-style alpine routes:
  // 1) Consolidation: cold nights plus near-freezing-but-dry afternoons can improve neve / surface supportability.
  // 2) Melt damage: rain, summit-positive temperatures, or freezing levels well above summit/route height degrade conditions.
  // The old logic collapsed both into "warm pulse" and over-penalized useful near-summit warming.
  const refreezeNights = days.filter((d) => historyTempMinC(d) <= -3).length;
  const deepColdNights = days.filter((d) => historyTempMinC(d) <= -8).length;
  const nearThawDryDays = days.filter((d) => historyTempMaxC(d) >= -3 && historyTempMaxC(d) <= 1 && historyDamagingRainMm(d, climb) < 1 && historySnowCm(d) < 5).length;
  const trueThawDays = days.filter((d) => historyTempMaxC(d) > 1 || historyFreezingLevelM(d) > climb.summitM + 150).length;
  const rainDays = days.filter((d) => historyDamagingRainMm(d, climb) >= 1).length;

  // Count both literal freeze/thaw and useful near-thaw refreeze cycles for alpine snow/ice.
  // For Kain Face, a -10C night followed by -1C dry afternoon is meaningful even if it never goes above 0C.
  const literalFreezeThawCycles = days.filter((d) => historyTempMinC(d) < -1 && historyTempMaxC(d) > 1).length;
  const usefulRefreezeCycles = days.filter((d) => historyTempMinC(d) <= -3 && historyTempMaxC(d) >= -3 && historyDamagingRainMm(d, climb) < 1).length;
  const freezeThawCycles = Math.max(literalFreezeThawCycles, usefulRefreezeCycles);

  const consolidationIndex = clampScore(
    nearThawDryDays * 1.1 +
    usefulRefreezeCycles * 0.8 +
    Math.min(2.0, deepColdNights * 0.18) -
    Math.max(0, snow3d - 10) * 0.12 -
    damagingRain14d * 0.25
  );

  const meltDamageIndex = clampScore(days.reduce((s, d) => {
    const fl = historyFreezingLevelM(d);
    const summitExcessM = Math.max(0, fl - (climb.summitM + 150));
    const positiveSummitC = Math.max(0, historyTempMaxC(d) - 1);
    const rain = historyDamagingRainMm(d, climb);
    return s + summitExcessM / 550 + positiveSummitC * 0.9 + rain * 0.7;
  }, 0));

  // Keep this field for compatibility with existing UI/tests, but redefine it as TRUE warm-pulse damage.
  const warmPulseSeverity = meltDamageIndex;
  const windStripping = days.reduce((s, d) => s + Math.max(0, historyWindKph(d) - 35) * 0.08, 0);
  const recentLoadingPenalty = Math.max(0, snow3d - 12) * 0.12 + Math.max(0, snow7d - 25) * 0.05;
  const surfaceDamage = clampScore(meltDamageIndex * 0.75 + damagingRain14d * 0.25 + recentLoadingPenalty);
  const surfaceRecovery = clampScore(consolidationIndex * 0.65 + refreezeNights * 0.22 + windStripping * 0.15 - meltDamageIndex * 0.15);

  let routePhase = "transitional / uncertain";
  if (climb.routeType === "mixed_alpine_ice") {
    if (snowLoadingIndex > 25 || snow3d > 15) routePhase = "recent loading / unconsolidated concern";
    else if (meltDamageIndex >= 7 || damagingRain14d > 8) routePhase = "melt-damage / rain affected concern";
    else if (consolidationIndex >= 6 && surfaceDamage <= 4.5 && snow7d <= 10) routePhase = "prime neve / consolidation signal";
    else if (consolidationIndex >= 4.5 && surfaceDamage <= 5.5) routePhase = "improving alpine surface";
  } else if (climb.routeType === "pure_rock") {
    if (rain14d < 2 && snow7d < 2 && freezeThawCycles <= 2) routePhase = "drying / rock improving";
    else if (historyFreezingLevelM(days[days.length - 1]) < climb.summitM) routePhase = "icy rock risk";
    else routePhase = "drying trend uncertain";
  } else if (climb.routeType === "ski_corn") {
    if (freezeThawCycles >= 4 && surfaceDamage <= 6) routePhase = "corn-cycle setup forming";
    else if (surfaceDamage > 7) routePhase = "overcooked / wet-cycle concern";
    else routePhase = "corn cycle not established";
  } else if (climb.routeType === "powder_ski") {
    if (snow3d > 20) routePhase = "rapid loading / avalanche gate concern";
    else if (snow7d >= 8 && surfaceDamage <= 4) routePhase = "preserved powder possible";
    else if (snow7d < 3) routePhase = "no recent powder source";
    else routePhase = "marginal powder preservation";
  }

  let interpretation = `${routePhase}. `;
  if (climb.id === "robson-kain") {
    interpretation += `For the Kain Face, near-freezing dry afternoons are treated as consolidation, not automatically as damage. Current 14-day signal: ${freezeThawCycles} useful refreeze/consolidation cycles, ${snow7d.toFixed(1)} cm snow in 7d, consolidation ${consolidationIndex.toFixed(1)}, melt damage ${meltDamageIndex.toFixed(1)}, surface recovery ${surfaceRecovery.toFixed(1)}.`;
  } else {
    interpretation += `14d snow ${snow14d.toFixed(1)} cm, 7d snow ${snow7d.toFixed(1)} cm, rain ${rain14d.toFixed(1)} mm, useful refreeze/consolidation cycles ${freezeThawCycles}, consolidation ${consolidationIndex.toFixed(1)}, melt damage ${meltDamageIndex.toFixed(1)}.`;
  }
  return { hasData: true, days, snowLoadingIndex, snow3d, snow7d, snow14d, rain14d, damagingRain14d, freezeThawCycles, literalFreezeThawCycles, usefulRefreezeCycles, refreezeNights, nearThawDryDays, trueThawDays, rainDays, consolidationIndex, meltDamageIndex, warmPulseSeverity, surfaceDamage, surfaceRecovery, routePhase, interpretation };
}

function runTests() {
  const robson = climbs[0];
  const sirD = climbs.find((c) => c.id === "sir-donald-nw-ridge");
  const adams = climbs.find((c) => c.id === "adams-sw-chutes");
  console.assert(scoreWindowForDays(robson, [{ summitWindGfsKph: 5, summitWindEcmwfKph: 5, summitTempGfsC: -30, summitTempEcmwfC: -30, precipGfsMm: 0, precipEcmwfMm: 0, freezingLevelM: 3600, pressureHpa: 1030 }, { summitWindGfsKph: 5, summitWindEcmwfKph: 5, summitTempGfsC: -30, summitTempEcmwfC: -30, precipGfsMm: 0, precipEcmwfMm: 0, freezingLevelM: 3600, pressureHpa: 1030 }, { summitWindGfsKph: 5, summitWindEcmwfKph: 5, summitTempGfsC: -30, summitTempEcmwfC: -30, precipGfsMm: 0, precipEcmwfMm: 0, freezingLevelM: 3600, pressureHpa: 1030 }]) < 7, "Robson -30C should not score as strong");
  console.assert(scoreWindowForDays(sirD, [{ summitWindGfsKph: 10, summitWindEcmwfKph: 10, summitTempGfsC: -1, summitTempEcmwfC: -1, valleyTempGfsC: 18, valleyTempEcmwfC: 18, precipGfsMm: 0, precipEcmwfMm: 0, freezingLevelM: 2900, pressureHpa: 1025 }]) < 6, "Pure rock below-freezing summit should score poorly");
  console.assert(scoreWindowForDays(adams, [{ summitWindGfsKph: 10, summitWindEcmwfKph: 10, summitTempGfsC: -1, summitTempEcmwfC: 0, summitTempMinAvgC: -5, summitTempMaxAvgC: 3.4, midTempGfsC: 1, midTempEcmwfC: 2, precipGfsMm: 0, precipEcmwfMm: 0.1, freezingLevelM: 3800, pressureHpa: 1022 }]) > 7, "Corn objective should reward overnight freeze plus daytime summit thaw near 0C");
  console.assert(findBestUpcomingWindow(robson, [], []).label === "NO DATA", "No forecast should return NO DATA window");
  console.assert(modelAppliesToClimb(FORECAST_MODEL_CATALOG.find((m) => m.id === "gfs_hrrr"), climbs.find((c) => c.id === "adams-sw-chutes")), "HRRR should apply to US objectives");
  console.assert(modelAppliesToClimb(FORECAST_MODEL_CATALOG.find((m) => m.id === "gfs_hrrr"), climbs.find((c) => c.id === "rogers-three-passes")), "HRRR should be attempted for Canadian objectives when the coordinate lies inside the model domain");
  console.assert(modelAppliesToClimb(FORECAST_MODEL_CATALOG.find((m) => m.id === "nam_conus"), climbs.find((c) => c.id === "robson-kain")), "NAM should be attempted for North-American objectives; backend/provider decides actual domain coverage");
  console.assert(modelAppliesToClimb(FORECAST_MODEL_CATALOG.find((m) => m.id === "gem_hrdps_continental"), climbs.find((c) => c.id === "adams-sw-chutes")), "HRDPS should be attempted for northern US objectives when in-domain");
  console.assert(modelAppliesToClimb(FORECAST_MODEL_CATALOG.find((m) => m.id === "ecmwf_ifs"), climbs.find((c) => c.id === "robson-kain")), "ECMWF IFS HRES should apply globally");
  console.assert(modelAppliesToClimb(FORECAST_MODEL_CATALOG.find((m) => m.id === "ecmwf_aifs"), climbs.find((c) => c.id === "ptarmigan-traverse")), "ECMWF AIFS should apply globally");
  console.assert(!climbs.find((c) => c.id === "st-helens-worm-flows"), "St Helens Worm Flows should be removed");
  console.assert(climbs.find((c) => c.id === "swiss-couloir")?.routeType === "powder_ski", "Swiss Couloir should be a powder objective");
  console.assert(climbs.find((c) => c.id === "rogers-three-passes")?.routeType === "winter_traverse", "Three Passes should use traverse-specific logic");
  console.assert(climbs.find((c) => c.id === "rogers-three-passes")?.summitM === 2678, "Three Passes representative high point should come from supplied GPX");
  console.assert(routeElevationProfile(climbs.find((c) => c.id === "rogers-three-passes")).exitM === 988, "Three Passes exit elevation should come from supplied GPX");
  console.assert(routeElevationProfile(climbs.find((c) => c.id === "rogers-three-passes")).checkpoints?.length === 7, "Three Passes should retain GPX-derived critical checkpoints");
  console.assert(climbs.find((c) => c.id === "brunswick-north-couloir")?.thresholds?.lowElevationPowder === true, "Brunswick should use low-elevation powder logic");
  console.assert(climbs.find((c) => c.id === "mount-hector")?.routeType === "ski_corn", "Mount Hector should be a spring glacier / corn objective");
  console.assert(climbs.find((c) => c.id === "currie-north-couloirs")?.routeType === "powder_ski", "Mount Currie couloirs should be powder objectives");
  console.assert(climbs.find((c) => c.id === "ptarmigan-traverse")?.routeType === "summer_endurance", "Ptarmigan Traverse should use long-day summer traverse logic");
  console.assert(climbs.find((c) => c.id === "shuksan-north-face")?.routeType === "powder_ski", "Shuksan North Face should be treated as a powder / steep ski objective");
  console.assert(climbs.find((c) => c.id === "rainier-fuhrer-finger")?.routeType === "ski_corn", "Rainier Fuhrer Finger should be treated as a spring ski / corn-cycle objective");
  console.assert(climbs.find((c) => c.id === "north-twin-north-face")?.routeType === "ski_corn", "North Twin North Face should be treated as a spring ski / corn-cycle objective");
  console.assert(climbs.find((c) => c.id === "temple-aemmer")?.routeType === "powder_ski", "Aemmer Couloir should be treated as a powder / steep ski objective");
  const testSurface = buildSurfaceState(robson, [{ date: "x1", summitTempMinC: -10, summitTempMaxC: -0.5, rainMm: 0, snowCm: 0, freezingLevelM: 3880, windKph: 5, pressureHpa: 1020 }]);
  console.assert(testSurface.consolidationIndex > testSurface.meltDamageIndex, "Dry near-freezing Robson day should score as consolidation more than melt damage");
  const damagingSurface = buildSurfaceState(robson, [{ date: "x2", summitTempMinC: -2, summitTempMaxC: 4, rainMm: 10, snowCm: 0, freezingLevelM: 4600, windKph: 5, pressureHpa: 1005 }]);
  console.assert(damagingSurface.meltDamageIndex > damagingSurface.consolidationIndex, "Rain/warm summit Robson day should score as melt damage");
  console.assert(solarReliability({ cloudCoverLowPct: 0, cloudCoverMidPct: 0, cloudCoverHighPct: 0 }) > solarReliability({ cloudCoverLowPct: 90, cloudCoverMidPct: 40, cloudCoverHighPct: 20 }), "Low cloud should reduce solar reliability");
  console.assert(navigationVisibilityScore({ cloudCoverLowPct: 95, cloudCoverPct: 100, precipGfsMm: 0, precipEcmwfMm: 0, summitWindGfsKph: 10, summitWindEcmwfKph: 10 }) < 4, "Low cloud should penalize alpine navigation visibility");
}

function MetricCard({ icon: IconComponent, label, value, detail, className = "" }) { return <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-sm text-slate-500"><IconComponent />{label}</div><div className={`mt-2 text-2xl font-semibold ${className}`}>{value}</div><div className="mt-1 text-sm text-slate-500">{detail}</div></CardContent></Card>; }

function MiniLineChart({ data = [], series = [], labelKey = "label", minOverride, maxOverride }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const width = 720, height = 250;
  const padLeft = 58, padRight = 24, padTop = 18, padBottom = 30;
  const valid = (v) => typeof v === "number" && Number.isFinite(v);
  const allValues = series.flatMap((s) => data.map((d) => d[s.key]).filter(valid));
  const rawMin = allValues.length ? Math.min(...allValues) : 0;
  const rawMax = allValues.length ? Math.max(...allValues) : 1;
  const autoPad = Math.max(0.5, (rawMax - rawMin) * 0.08);
  const minValue = minOverride ?? Math.min(rawMin - autoPad, rawMin >= 0 ? 0 : rawMin - autoPad);
  const maxValue = maxOverride ?? Math.max(rawMax + autoPad, rawMax <= 0 ? 0 : rawMax + autoPad);
  const range = Math.max(1e-6, maxValue - minValue);
  const xFor = (i) => padLeft + (i / Math.max(1, data.length - 1)) * (width - padLeft - padRight);
  const yFor = (value) => height - padBottom - ((value - minValue) / range) * (height - padTop - padBottom);
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;
  const defaultPalette = ["#111827", "#2563eb", "#dc2626", "#059669", "#7c3aed", "#f59e0b", "#0891b2", "#be123c"];
  const defaultDash = ["", "8 5", "2 5", "5 4", "", "10 4", "3 4", ""];
  const lineColor = (s, i) => s.color || defaultPalette[i % defaultPalette.length];
  const lineDash = (s, i) => s.dash ?? defaultDash[i % defaultDash.length];
  const lineWidth = (s) => s.width || 3;
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const ratio = i / (tickCount - 1);
    return maxValue - ratio * range;
  });
  const formatTick = (value) => {
    const abs = Math.abs(value);
    if (abs >= 100) return Math.round(value).toLocaleString();
    if (abs >= 10) return value.toFixed(0);
    return value.toFixed(1);
  };
  function segmentsFor(s) {
    const segments = [];
    let current = [];
    data.forEach((d, i) => {
      const value = d[s.key];
      if (valid(value)) current.push(`${xFor(i)},${yFor(value)}`);
      else if (current.length) { segments.push(current); current = []; }
    });
    if (current.length) segments.push(current);
    return segments;
  }
  function move(e) {
    if (!data.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const ratio = Math.max(0, Math.min(1, (x - padLeft) / (width - padLeft - padRight)));
    setHoverIndex(Math.round(ratio * (data.length - 1)));
  }
  return <div className="relative h-80 rounded-xl border bg-white p-3"><svg viewBox={`0 0 ${width} ${height}`} className="h-60 w-full cursor-crosshair" preserveAspectRatio="none" onMouseMove={move} onMouseLeave={() => setHoverIndex(null)}>
    {ticks.map((tick, i) => {
      const y = yFor(tick);
      return <g key={`ytick-${i}`}><line x1={padLeft} x2={width - padRight} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" /><text x={padLeft - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="11">{formatTick(tick)}</text></g>;
    })}
    <line x1={padLeft} x2={padLeft} y1={padTop} y2={height - padBottom} stroke="#cbd5e1" strokeWidth="1" />
    {series.map((s, si) => segmentsFor(s).map((points, pi) => <polyline key={`${s.key}-${pi}`} points={points.join(" ")} fill="none" stroke={lineColor(s, si)} strokeWidth={lineWidth(s)} strokeDasharray={lineDash(s, si)} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />))}
    {hoverIndex !== null && <line x1={xFor(hoverIndex)} x2={xFor(hoverIndex)} y1={padTop} y2={height - padBottom} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="1.5" />}
  </svg><div className="grid pl-[46px] pr-[12px]" style={{ gridTemplateColumns: `repeat(${data.length || 1}, minmax(0, 1fr))` }}>{data.map((d, i) => <div key={`${d[labelKey]}-${i}`} className={`truncate text-center text-[10px] ${hoverIndex === i ? "font-semibold text-slate-900" : "text-slate-500"}`}>{d[labelKey]}</div>)}</div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-slate-700">{series.map((s, i) => <div key={s.key} className="flex items-center gap-2"><svg width="44" height="12" viewBox="0 0 44 12" aria-hidden="true"><line x1="2" x2="42" y1="6" y2="6" stroke={lineColor(s, i)} strokeWidth={lineWidth(s)} strokeDasharray={lineDash(s, i)} strokeLinecap="round" /></svg><span>{s.label}</span></div>)}</div>{hovered && <div className="pointer-events-none absolute left-16 top-4 rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg"><div className="mb-1 font-semibold text-slate-900">{hovered[labelKey]} {hovered.date ? `· ${hovered.date}` : ""}</div>{series.map((s, i) => { const raw = hovered[s.key]; if (!valid(raw)) return <div key={s.key} className="text-slate-400"><span style={{ color: lineColor(s, i) }}>●</span> {s.label}: <strong>NO DATA</strong></div>; const value = Number.isInteger(raw) ? raw : raw.toFixed(1); return <div key={s.key} className="text-slate-700"><span style={{ color: lineColor(s, i) }}>●</span> {s.label}: <strong>{value}{s.unit ? ` ${s.unit}` : ""}</strong></div>; })}</div>}</div>;
}

function WindowTimeline({ forecast = [], bestWindow, source }) { const dayCount = forecast.length; return <div className="rounded-2xl border bg-white p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-semibold">{dayCount}-day window watch</h3><p className="text-sm text-slate-500">Shows aggregate window signal. Missing/out-of-range model values are excluded, not treated as zeros.</p><p className="mt-1 text-xs text-slate-400">Source: {source}</p></div><Badge variant="secondary">Best: {bestWindow.label} ({bestWindow.windowLength} days)</Badge></div><div className="overflow-x-auto pb-2"><div className="grid gap-2" style={{ minWidth: `${Math.max(1120, dayCount * 108)}px`, gridTemplateColumns: `repeat(${dayCount || 1}, minmax(0, 1fr))` }}>{forecast.map((d, i) => { const wind = Math.round(((d.summitWindGfsKph || 0) + (d.summitWindEcmwfKph || 0)) / 2); const temp = (((d.summitTempGfsC || 0) + (d.summitTempEcmwfC || 0)) / 2).toFixed(1); const precip = (((d.precipGfsMm || 0) + (d.precipEcmwfMm || 0)) / 2).toFixed(1); const tempMin = typeof d.summitTempMinAvgC === "number" ? d.summitTempMinAvgC.toFixed(1) : "—"; const tempMax = typeof d.summitTempMaxAvgC === "number" ? d.summitTempMaxAvgC.toFixed(1) : "—"; const inBest = i + 1 >= bestWindow.startDay && i + 1 <= bestWindow.endDay; return <div key={d.label} className={`rounded-xl border p-2 text-center text-xs ${inBest ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><div className="font-semibold">{d.label}</div><div className="text-[10px] text-slate-400">{d.date || ""}</div><div className="mt-1 text-slate-600">Wind {wind} kph</div><div className="text-slate-600">Avg {temp}°C</div><div className="text-slate-600">Swing {tempMin} / {tempMax}°C</div><div className="text-slate-600">Precip {precip} mm</div><div className="text-slate-600">Models {d.modelStats?.modelCount || 0}</div></div>; })}</div></div></div>; }

function getAvailableModelLabels(forecast = []) { const labels = []; forecast.forEach((day) => (day.modelValues || []).forEach((model) => { if (!labels.find((item) => item.id === model.modelId)) labels.push({ id: model.modelId, label: model.modelLabel }); })); return labels; }
function RawModelLineChart({ forecast = [], metricKey, title, unit, note }) { const modelLabels = getAvailableModelLabels(forecast); const classNames = ["text-slate-900", "text-emerald-700", "text-blue-700", "text-amber-700", "text-purple-700", "text-rose-700", "text-cyan-700", "text-lime-700", "text-orange-700", "text-fuchsia-700"]; const data = forecast.map((day) => { const row = { label: day.label, date: day.date }; modelLabels.forEach((model) => { const value = day.modelValues?.find((item) => item.modelId === model.id)?.[metricKey]; row[model.id] = typeof value === "number" && Number.isFinite(value) ? Number(value.toFixed(1)) : null; }); return row; }); const series = modelLabels.map((model, i) => ({ key: model.id, label: model.label, unit, className: classNames[i % classNames.length] })); return <Card><CardContent className="p-5"><h3 className="mb-2 font-semibold">{title}</h3>{note && <p className="mb-3 text-sm text-slate-500">{note}</p>}<MiniLineChart data={data} series={series} /></CardContent></Card>; }

function ModelAvailabilityPanel({ forecast = [], climb, unavailableModels = [] }) { const applicableModels = FORECAST_MODEL_CATALOG.filter((model) => modelAppliesToClimb(model, climb)); return <Card><CardContent className="p-5"><h3 className="mb-2 font-semibold">Model availability and agreement</h3><p className="mb-4 text-sm text-slate-500">Short-range models should only appear inside their valid lead time. If a model is outside its horizon, it is blank—not zero.</p><div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[1100px] text-xs"><thead className="bg-slate-100 text-left text-slate-600"><tr><th className="p-2">Model</th><th className="p-2">Provider</th>{forecast.map((day) => <th key={day.label} className="p-2 text-center">{day.label}</th>)}</tr></thead><tbody>{applicableModels.map((model) => <tr key={model.id} className="border-t"><td className="p-2 font-medium">{model.label}</td><td className="p-2 text-slate-500">{model.provider}</td>{forecast.map((day) => { const value = day.modelValues?.find((m) => m.modelId === model.id); const withinLead = day.dayIndex <= model.maxLeadDays; return <td key={`${model.id}-${day.label}`} className="p-2 text-center">{value ? <div className="rounded-lg bg-emerald-50 px-1 py-1 text-[10px] text-emerald-900">{Math.round(value.summitWindKph)}kph<br />{value.summitTempC?.toFixed?.(1) ?? "—"}°C<br />{value.precipMm?.toFixed?.(1) ?? "—"}mm</div> : withinLead ? <span className="text-red-600">unavail</span> : <span className="text-slate-300">—</span>}</td>; })}</tr>)}</tbody></table></div>{unavailableModels.length > 0 && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Unavailable/planned: {unavailableModels.join("; ")}</div>}</CardContent></Card>; }

function LookbackPanel({ climb, history = [], historySource = "NO REAL HISTORY" }) {
  const surface = buildSurfaceState(climb, history);
  if (!surface.hasData) return <div className="rounded-2xl border bg-white p-5 text-sm text-slate-700"><strong>NO REAL 14-DAY HISTORY YET</strong><p className="mt-2">Synthetic placeholder history is now suppressed. The app will only show lookback data when it can fetch real recent-past data from Open-Meteo or when the backend explicitly returns real observed/archive history.</p><p className="mt-2 text-xs text-slate-500">History source: {historySource}</p></div>;
  const rawRows = surface.days.map((d, i) => ({ label: d.label || `D-${surface.days.length - i}`, date: d.date, wind: historyWindKph(d), tempMin: historyTempMinC(d), tempMax: historyTempMaxC(d), rain: historyRainMm(d), damagingRain: historyDamagingRainMm(d, climb), snow: historySnowCm(d), freezingLevel: historyFreezingLevelM(d), pressure: historyPressureHpa(d) }));
  return <div className="space-y-4"><div className="grid gap-4 md:grid-cols-6"><MetricCard icon={SnowIcon} label="Weighted Snow Load" value={surface.snowLoadingIndex.toFixed(1)} detail={`3d ${surface.snow3d.toFixed(1)} cm · 7d ${surface.snow7d.toFixed(1)} cm`} /><MetricCard icon={SunIcon} label="Useful Refreeze Cycles" value={surface.freezeThawCycles} detail="Includes dry near-thaw consolidation" className={surface.freezeThawCycles >= 4 ? "text-emerald-700" : "text-yellow-700"} /><MetricCard icon={GaugeIcon} label="Consolidation" value={`${surface.consolidationIndex.toFixed(1)} / 10`} detail="Dry near-thaw + cold nights" className={scoreColor(surface.consolidationIndex)} /><MetricCard icon={AlertIcon} label="Melt Damage" value={`${surface.meltDamageIndex.toFixed(1)} / 10`} detail="Rain or true above-summit thaw" className={scoreColor(surface.meltDamageIndex, true)} /><MetricCard icon={TrendIcon} label="Surface Damage" value={`${surface.surfaceDamage.toFixed(1)} / 10`} detail="Melt/rain/loading" className={scoreColor(surface.surfaceDamage, true)} /><MetricCard icon={ShieldIcon} label="Surface Recovery" value={`${surface.surfaceRecovery.toFixed(1)} / 10`} detail="Consolidation + refreeze" className={scoreColor(surface.surfaceRecovery)} /></div><Card><CardContent className="p-5"><div className="mb-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900"><strong>History source:</strong> {historySource}</div><h3 className="font-semibold">Surface-state interpretation</h3><p className="mt-2 text-slate-700">{surface.interpretation}</p><p className="mt-2 text-sm text-slate-500">This historical layer separates useful consolidation from actual melt damage. For Robson-style routes, a dry near-freezing afternoon after a cold night can improve neve; raw rain is only treated as route-damaging rain when summit temperatures/freezing level support liquid water at route elevation; summit-positive warmth or freezing levels well above the summit are treated as damage.</p></CardContent></Card><div className="grid gap-4 lg:grid-cols-2"><Card><CardContent className="p-5"><h3 className="mb-4 font-semibold">14-day raw history: wind and temperature</h3><MiniLineChart data={rawRows} labelKey="label" series={[{ key: "wind", label: "Wind", unit: "kph", color: "#111827", dash: "", width: 3.5 }, { key: "tempMin", label: "Summit low", unit: "°C", color: "#2563eb", dash: "8 5", width: 3 }, { key: "tempMax", label: "Summit high", unit: "°C", color: "#dc2626", dash: "2 5", width: 3 }]} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 font-semibold">14-day raw history: precipitation</h3><p className="mb-3 text-sm text-slate-500">Raw rain/snow is plotted on its own scale so small but important precipitation events are visible. Damaging rain only counts as route damage when summit temps/freezing level support liquid water at route elevation.</p><MiniLineChart data={rawRows} labelKey="label" series={[{ key: "rain", label: "Raw rain", unit: "mm", color: "#1d4ed8", dash: "", width: 3.5 }, { key: "damagingRain", label: "Damaging rain", unit: "mm", color: "#dc2626", dash: "2 5", width: 3 }, { key: "snow", label: "Snow", unit: "cm", color: "#60a5fa", dash: "8 4", width: 3 }]} minOverride={0} /></CardContent></Card><Card className="lg:col-span-2"><CardContent className="p-5"><h3 className="mb-4 font-semibold">14-day raw history: freezing level and pressure</h3><MiniLineChart data={rawRows} labelKey="label" series={[{ key: "freezingLevel", label: "Freezing level", unit: "m", color: "#059669", dash: "2 5", width: 3 }, { key: "pressure", label: "Pressure", unit: "hPa", color: "#7c3aed", dash: "", width: 3.5 }]} minOverride={0} /></CardContent></Card></div><Card><CardContent className="p-5"><h3 className="mb-3 font-semibold">Raw 14-day observed data</h3><div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[900px] text-xs"><thead className="bg-slate-100 text-left text-slate-600"><tr><th className="p-2">Day</th><th className="p-2">Date</th><th className="p-2">Wind kph</th><th className="p-2">Temp low/high °C</th><th className="p-2">Raw rain mm</th><th className="p-2">Damage rain mm</th><th className="p-2">Snow cm</th><th className="p-2">Freezing level m</th><th className="p-2">Pressure hPa</th><th className="p-2">Notes</th></tr></thead><tbody>{rawRows.map((r) => <tr key={`${r.label}-${r.date}`} className="border-t"><td className="p-2 font-medium">{r.label}</td><td className="p-2 text-slate-500">{r.date}</td><td className="p-2">{Number(r.wind).toFixed(1)}</td><td className="p-2">{Number(r.tempMin).toFixed(1)} / {Number(r.tempMax).toFixed(1)}</td><td className="p-2">{Number(r.rain).toFixed(1)}</td><td className="p-2">{Number(r.damagingRain).toFixed(1)}</td><td className="p-2">{Number(r.snow).toFixed(1)}</td><td className="p-2">{Math.round(r.freezingLevel || 0)}</td><td className="p-2">{Math.round(r.pressure || 0)}</td><td className="p-2 text-slate-500">{surface.days.find((d) => d.date === r.date)?.freezingLevelEstimated ? "FL estimated" : ""}</td></tr>)}</tbody></table></div></CardContent></Card></div>;
}

function routeElevationProfile(climb) {
  const profiles = {
    "adams-sw-chutes": { entranceM: 3740, exitM: 2100, descentLabel: "Summit / SW Chutes entrance → Morrison Creek exit", aspect: "S–SW", slopeDeg: 35, climbHours: 6.5, skiHours: 2.5 },
    "swiss-couloir": { entranceM: 3100, exitM: 1350, descentLabel: "Swiss Couloir / Swiss Glacier → Rogers Pass corridor", aspect: "S", slopeDeg: 50, climbHours: 6.5, skiHours: 2.5 },
    "rogers-three-passes": { entranceM: 1138, exitM: 988, highPointM: 2678, descentLabel: "Rogers Pass start → first high point → intermediate basin → Catamount high point / North Face descent → low basin → final high point → Bostock exit", aspect: "mixed; includes a major north-facing descent from Catamount", slopeDeg: 32, routeKm: 31.0, smoothedGainM: 2470, recordedHours: 10.9, climbHours: 8.5, skiHours: 2.4, entranceLat: 51.302722, entranceLon: -117.521526, exitLat: 51.230399, exitLon: -117.669475, highPointLat: 51.288677, highPointLon: -117.62186, checkpoints: [{ label: "Start / Rogers Pass", distanceKm: 0.0, elevationM: 1138, lat: 51.302722, lon: -117.521526 }, { label: "First high point", distanceKm: 5.8, elevationM: 2078, lat: 51.284654, lon: -117.582412 }, { label: "Intermediate low", distanceKm: 7.45, elevationM: 1706, lat: 51.278789, lon: -117.592085 }, { label: "Catamount high point / N Face entrance", distanceKm: 11.85, elevationM: 2678, lat: 51.288677, lon: -117.62186 }, { label: "Bottom of Catamount N Face / low basin", distanceKm: 16.9, elevationM: 1435, lat: 51.316186, lon: -117.63272 }, { label: "Final high point", distanceKm: 24.6, elevationM: 2143, lat: 51.275131, lon: -117.683679 }, { label: "Exit", distanceKm: 31.0, elevationM: 988, lat: 51.230399, lon: -117.669475 }] },
    "brunswick-north-couloir": { entranceM: 1750, exitM: 550, descentLabel: "Brunswick summit ridge / north couloir → low North Shore exit", aspect: "N", slopeDeg: 40, climbHours: 5.5, skiHours: 1.5 },
    "mount-hector": { entranceM: 3394, exitM: 1900, descentLabel: "Mount Hector / north glacier → Icefields Parkway", aspect: "N–NW", slopeDeg: 30, climbHours: 6.5, skiHours: 2.5 },
    "currie-north-couloirs": { entranceM: 2500, exitM: 450, descentLabel: "Pencil / Central Couloir → Pemberton Valley", aspect: "N", slopeDeg: 45, climbHours: 5, skiHours: 2 },
    "ptarmigan-traverse": { entranceM: 1115, exitM: 440, highPointM: 2400, descentLabel: "Cascade Pass trailhead → high alpine traverse → Downey / Suiattle exit", aspect: "mixed", slopeDeg: 30, climbHours: 12, skiHours: 0, entranceLat: 48.4754, entranceLon: -121.0751, exitLat: 48.3034, exitLon: -121.0295 },
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
function estimateTimezoneOffsetHours(lon) {
  // Approximate local standard time zone from longitude. This keeps solar noon near midday
  // instead of accidentally shifting the radiation peak into the evening.
  return Math.round(lon / 15);
}
function estimateSolarPosition(lat, lon, dateObj, localHour) {
  const start = new Date(Date.UTC(dateObj.getUTCFullYear(), 0, 0));
  const dayOfYear = Math.floor((dateObj - start) / 86400000);
  const b = (2 * Math.PI / 365) * (dayOfYear - 81);
  const decl = degToRad(23.45 * Math.sin(b));
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  const tz = estimateTimezoneOffsetHours(lon);
  const standardMeridian = tz * 15;
  const localSolarTime = localHour + (lon - standardMeridian) / 15 + eot / 60;
  const omega = degToRad(15 * (localSolarTime - 12));
  const phi = degToRad(lat);
  const sinElev = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(omega);
  const elevationRad = Math.asin(Math.max(-1, Math.min(1, sinElev)));
  const cosAz = (Math.sin(decl) - Math.sin(elevationRad) * Math.sin(phi)) / Math.max(0.0001, Math.cos(elevationRad) * Math.cos(phi));
  let az = radToDeg(Math.acos(Math.max(-1, Math.min(1, cosAz))));
  if (omega > 0) az = 360 - az;
  return { elevationDeg: radToDeg(elevationRad), azimuthDeg: az, localSolarTime };
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
  const albedo = 0.68;
  const kRad = 18.0;
  const swNet = 1361 * cosI * (1 - 0.65 * cloud * cloud) * (1 - albedo);
  const tAirK = airTempC + 273.15;
  const tSnowK = 273.15;
  const ea = saturationVaporPressureHpa(airTempC) * Math.max(1, Math.min(100, rhPct || 70)) / 100;
  const epsClear = 0.51 + 0.066 * Math.sqrt(Math.max(0, ea));
  const epsAtm = (1 - cloud) * epsClear + cloud;
  const svf = Math.pow(Math.cos(beta / 2), 2);
  const sigma = 5.67e-8;
  const lwNet = sigma * (svf * epsAtm * Math.pow(tAirK, 4) + (1 - svf) * 0.98 * Math.pow(tAirK, 4) - Math.pow(tSnowK, 4));
  return { shortwaveEqC: Math.max(0, swNet / kRad), longwaveEqC: lwNet / kRad, solarElevationDeg: solar.elevationDeg, localSolarTime: solar.localSolarTime, cosIncidence: cosI };
}
function cornDensityForClimb(climb) {
  const id = climb?.id || "";
  if (id === "rainier-fuhrer-finger" || id === "adams-sw-chutes") return 0.48;
  if (id === "shuksan-north-face" || id === "north-twin-north-face") return 0.42;
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
  const cloud = cornCloudFraction(day);
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
    const startThreshold = thresholds.startFhrs;
    const endThreshold = thresholds.endFhrs;
    if (effectiveF <= 32 && hour >= 10) state = "Icy / delayed";
    else if (meltFhrs < startThreshold) state = "Frozen";
    else if (meltFhrs >= startThreshold && meltFhrs <= endThreshold && refreezeDepthCm >= 0.35) state = "Prime corn";
    else if (meltFhrs > endThreshold || meltDepthCm > thresholds.dMaxCm * 1.05) state = "Too soft / wet";
    return { hour, label: `${hour}:00`, effectiveTempC: Number(effectiveTempC.toFixed(1)), airTempC: Number(airTempC.toFixed(1)), wetBulbC: Number(wetBulbC.toFixed(1)), shortwaveEqC: Number(radiative.shortwaveEqC.toFixed(1)), longwaveEqC: Number(radiative.longwaveEqC.toFixed(1)), meltIntegralFhrs: Number(meltFhrs.toFixed(1)), freezeIntegralFhrs: Number(freezeFhrs.toFixed(1)), meltDepthCm: Number(meltDepthCm.toFixed(2)), refreezeDepthCm: Number(refreezeDepthCm.toFixed(2)), density: Number(rho.toFixed(2)), startThresholdFhrs: Number(thresholds.startFhrs.toFixed(1)), endThresholdFhrs: Number(thresholds.endFhrs.toFixed(1)), solarElevationDeg: Number(radiative.solarElevationDeg.toFixed(1)), localSolarTime: Number(radiative.localSolarTime.toFixed(1)), state };
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
  const solarScore = clampScore(solarReliability(day) * 10);
  const cornScore = clampScore((primeEntrance.length * 1.2) + (primeExit.length * 0.6) + refreezeScore * 0.35 + solarScore * 0.15 - Math.max(0, dayWind(day) - 30) * 0.15 - dayPrecip(day) * 1.2);
  let interpretation = "No clear corn window detected yet.";
  if (cornScore >= 7 && targetSki) interpretation = `Best signal: aim to start skiing the entrance around ${targetSki}:00. Start climbing around ${startClimb}:00, reach the high point by ${Math.max(targetSki - 1, 6)}:00, and be exiting lower terrain by about ${exitTarget}:00.`;
  if (solarReliability(day) < 0.55 && targetSki) interpretation += " Cloud cover lowers solar reliability, so the prime window may arrive later, be narrower, or fail to materialize despite acceptable temperatures.";
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
  const width = 980, height = 260, pad = 52;
  const rows = days.flatMap((day, dayIndex) => day[field].map((h, hourIndex) => ({ ...h, dayIndex, hourIndex, dayLabel: day.day.label, date: day.day.date })));
  const temps = rows.map((r) => r.effectiveTempC).filter((v) => typeof v === "number" && Number.isFinite(v));
  const minT = Math.min(-6, ...temps) - 1;
  const maxT = Math.max(6, ...temps) + 1;
  const yTicks = Array.from({ length: 5 }, (_, i) => maxT - (i / 4) * (maxT - minT));
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
  return <Card><CardContent className="p-5"><h3 className="mb-1 font-semibold">{title}</h3><p className="mb-3 text-sm text-slate-500">Elevation: {elevationM} m · 7-day Ullr-style effective snow-temperature curve. Green vertical bands = cumulative melt integral within the calculated prime corn window.</p><div className="relative overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="min-w-[980px] w-full h-72 rounded-xl border bg-white cursor-crosshair" onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>{yTicks.map((tick, i) => <g key={`corn-y-${i}`}><line x1={pad} x2={width - pad} y1={yFor(tick)} y2={yFor(tick)} className="stroke-slate-100" /><text x={pad - 8} y={yFor(tick) + 4} textAnchor="end" className="fill-slate-500 text-[10px]">{tick.toFixed(0)}°</text></g>)}<line x1={pad} x2={width - pad} y1={yFor(0)} y2={yFor(0)} className="stroke-slate-400" strokeDasharray="5 5" /><text x={pad + 4} y={yFor(0) - 6} className="fill-slate-500 text-[11px]">0°C effective</text>{days.map((day, dayIndex) => <g key={`${field}-day-${day.day.label}`}><line x1={xFor(dayIndex, 0)} x2={xFor(dayIndex, 0)} y1={pad} y2={height - pad} className="stroke-slate-200" /><text x={xFor(dayIndex, 0) + 4} y={height - 10} className="fill-slate-500 text-[10px]">{day.day.label}</text></g>)}{rows.map((r) => r.state === "Prime corn" ? <rect key={`${field}-prime-${r.dayIndex}-${r.hourIndex}`} x={xFor(r.dayIndex, r.hourIndex) - 4} y={pad} width="8" height={height - pad * 2} className="fill-emerald-200 opacity-70" /> : null)}<polyline points={points} fill="none" className="stroke-slate-900" strokeWidth="3" vectorEffect="non-scaling-stroke" />{rows.map((r, i) => <circle key={`${field}-dot-${r.dayIndex}-${r.hourIndex}`} cx={xFor(r.dayIndex, r.hourIndex)} cy={yFor(r.effectiveTempC)} r={i % 2 === 0 ? "2.5" : "1.8"} className={r.state === "Prime corn" ? "fill-emerald-600" : r.state.includes("soft") ? "fill-orange-500" : r.state.includes("Icy") ? "fill-blue-500" : "fill-slate-400"} />)}{hover && <g><line x1={hoverX} x2={hoverX} y1={pad} y2={height - pad} className="stroke-slate-500" strokeDasharray="4 4" /><circle cx={hoverX} cy={hoverY} r="5" className="fill-white stroke-slate-900" strokeWidth="2" /></g>}</svg>{hover && <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg"><div className="mb-1 font-semibold text-slate-950">{hover.dayLabel} · {hover.date} · {hover.label}</div><div>State: <strong>{hover.state}</strong></div><div>Effective temp: <strong>{hover.effectiveTempC} °C</strong></div><div>Air / wet-bulb: <strong>{hover.airTempC} / {hover.wetBulbC} °C</strong></div><div>Melt integral: <strong>{hover.meltIntegralFhrs} F-hrs</strong></div><div>Refreeze depth: <strong>{hover.refreezeDepthCm} cm</strong></div><div>Melt depth: <strong>{hover.meltDepthCm} cm</strong></div><div>Solar elevation: <strong>{hover.solarElevationDeg}°</strong></div><div>Solar time: <strong>{hover.localSolarTime}</strong></div><div>SW / LW equivalent: <strong>{hover.shortwaveEqC} / {hover.longwaveEqC} °C</strong></div><div className="mt-1 text-slate-500">Prime threshold: {hover.startThresholdFhrs}–{hover.endThresholdFhrs} F-hrs</div><div className="text-slate-500">Prime is based on cumulative melt integral, not instant effective temp alone.</div></div>}</div><div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600"><span className="inline-flex items-center gap-1"><span className="h-3 w-5 rounded bg-emerald-200" />Prime corn band</span><span className="inline-flex items-center gap-1"><span className="h-3 w-5 rounded bg-blue-300" />Icy/delayed</span><span className="inline-flex items-center gap-1"><span className="h-3 w-5 rounded bg-orange-300" />Too soft/wet</span></div></CardContent></Card>;
}
function CornCycleGraph({ title, elevationM, rows = [] }) {
  return <Card><CardContent className="p-5"><h3 className="mb-1 font-semibold">{title}</h3><p className="mb-4 text-sm text-slate-500">Elevation: {elevationM} m · green bands indicate estimated prime corn.</p><div className="grid grid-cols-16 gap-1">{rows.map((h) => <div key={h.hour} className={`rounded-lg border p-2 text-center text-[10px] ${h.state === "Prime corn" ? "border-emerald-400 bg-emerald-100 text-emerald-950" : h.state.includes("soft") ? "border-orange-300 bg-orange-50 text-orange-900" : h.state.includes("Icy") ? "border-blue-200 bg-blue-50 text-blue-900" : "border-slate-200 bg-slate-50 text-slate-600"}`}><div className="font-semibold">{h.label}</div><div>{h.effectiveTempC}°C</div><div className="mt-1">{h.state}</div></div>)}</div></CardContent></Card>;
}
function CornCyclePanel({ climb, forecast }) {
  const analysis = analyzeCornCycle(climb, forecast);
  if (!analysis) return <div className="rounded-2xl border bg-white p-5 text-sm text-slate-700">Corn-cycle analysis is only shown for ski-corn objectives with live forecast data.</div>;
  const bestDayLabel = `${analysis.day.label}${analysis.day.date ? ` · ${analysis.day.date}` : ""}`;
  return <div className="space-y-4"><div className="grid gap-4 md:grid-cols-5"><MetricCard icon={SunIcon} label="Best 7-day Corn Score" value={`${analysis.cornScore.toFixed(1)} / 10`} detail={bestDayLabel} className={scoreColor(analysis.cornScore)} /><MetricCard icon={SnowIcon} label="Best Refreeze Score" value={`${analysis.refreezeScore.toFixed(1)} / 10`} detail="Overnight supportability" className={scoreColor(analysis.refreezeScore)} /><MetricCard icon={SunIcon} label="Solar Reliability" value={solarReliability(analysis.day) === null ? "NO DATA" : `${Math.round(solarReliability(analysis.day) * 100)}%`} detail={`Low cloud ${cloudText(dayLowCloudPct(analysis.day))} · total ${cloudText(dayCloudPct(analysis.day))}`} className={scoreColor((solarReliability(analysis.day) ?? 0) * 10)} /><MetricCard icon={MountainIcon} label="Best Ski Entrance" value={analysis.targetSki ? `${analysis.targetSki}:00` : "No clear time"} detail={`${analysis.profile.entranceM} m · ${analysis.profile.aspect}`} /><MetricCard icon={TrendIcon} label="Best Exit Target" value={analysis.exitTarget ? `${analysis.exitTarget}:00` : "No clear time"} detail={`${analysis.profile.exitM} m lower route`} /></div><Card><CardContent className="p-5"><h3 className="font-semibold">7-day corn-cycle interpretation</h3><p className="mt-2 text-slate-700">{analysis.interpretation}</p><p className="mt-2 text-sm text-slate-500">Best-day strategy is based on {bestDayLabel}. The graphs and heatmaps compare the entrance/high point and the lower exit elevation across the next 7 forecast days. Green means the Ullr-style surface-state model estimates a prime corn window; blue is delayed/icy; orange is too soft/wet. Hover over the curve for time, effective temp, melt/refreeze values, and surface-state interpretation.</p></CardContent></Card><div className="grid gap-4"><CornCycleCurveGraph title="Entrance / high-point 7-day corn curve" elevationM={analysis.profile.entranceM} days={analysis.days} field="entrance" /><CornCycleCurveGraph title="Exit / lower-route 7-day corn curve" elevationM={analysis.profile.exitM} days={analysis.days} field="exit" /><CornCycleHeatmap title="Entrance / high-point corn heatmap" elevationM={analysis.profile.entranceM} days={analysis.days} field="entrance" /><CornCycleHeatmap title="Exit / lower-route corn heatmap" elevationM={analysis.profile.exitM} days={analysis.days} field="exit" /></div><Card><CardContent className="p-5"><h3 className="mb-2 font-semibold">Best-day route timing strategy — {bestDayLabel}</h3><div className="grid gap-3 md:grid-cols-4 text-sm"><div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-500">Start climbing</div><div className="text-xl font-semibold">{analysis.startClimb ? `${analysis.startClimb}:00` : "—"}</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-500">Reach entrance</div><div className="text-xl font-semibold">{analysis.targetSki ? `${Math.max(analysis.targetSki - 1, 6)}:00` : "—"}</div></div><div className="rounded-xl bg-emerald-50 p-3"><div className="text-emerald-700">Start skiing</div><div className="text-xl font-semibold text-emerald-900">{analysis.targetSki ? `${analysis.targetSki}:00` : "—"}</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-500">Clear lower route</div><div className="text-xl font-semibold">{analysis.exitTarget ? `${analysis.exitTarget}:00` : "—"}</div></div></div></CardContent></Card></div>;
}

function powderStateForHour(h, hasPowderSource = true) {
  const dailyMelt = h.meltIntegralFhrs || 0;
  if (!hasPowderSource) {
    if (h.effectiveTempC >= 0 || dailyMelt > 20) return "No powder source / warming";
    return "Powder-preserving conditions only";
  }
  if (h.effectiveTempC >= 0 || dailyMelt > 40) return "Getting heavy";
  if (dailyMelt > 20) return "Settling";
  if (dailyMelt <= 15 && h.effectiveTempC < -1) return "Preserved powder";
  return "Marginal powder";
}
function powderCellClass(state) {
  if (state === "Powder-preserving conditions only") return "border-slate-300 bg-slate-100 text-slate-700";
  if (state === "No powder source / warming") return "border-stone-300 bg-stone-200 text-stone-800";
  if (state === "Preserved powder") return "border-sky-400 bg-sky-500 text-white";
  if (state === "Marginal powder") return "border-cyan-200 bg-cyan-100 text-cyan-950";
  if (state === "Settling") return "border-yellow-300 bg-yellow-200 text-yellow-950";
  return "border-orange-300 bg-orange-300 text-orange-950";
}
function makePowderHourly(day, climb, elevationM, hasPowderSource = true) {
  return makeCornHourly(day, climb, elevationM, "powder").map((h) => ({ ...h, powderState: powderStateForHour(h, hasPowderSource) }));
}
function analyzePowderDay(climb, day, avalanche, priorSnowCm = 0) {
  const profile = routeElevationProfile(climb);
  const elevationM = profile.entranceM || climb.summitM;
  const snow24 = ((day.summitSnowGfsCm || 0) + (day.summitSnowEcmwfCm || 0)) / 2;
  const recentSnowCm = snow24 + priorSnowCm;
  const hasFreshPowderSource = recentSnowCm >= (climb.thresholds.minNewSnow24hCm ?? 8);
  const hasMarginalRefresh = recentSnowCm >= 3;
  const hourly = makePowderHourly(day, climb, elevationM, hasFreshPowderSource || hasMarginalRefresh);
  const wind = dayWind(day);
  const summitTemp = daySummitTemp(day);
  const freezingLevel = day.freezingLevelM || 0;
  const preservedHours = hourly.filter((h) => h.powderState === "Preserved powder").length;
  const heavyHours = hourly.filter((h) => h.powderState === "Getting heavy" || h.powderState === "No powder source / warming").length;
  const maxMelt = Math.max(...hourly.map((h) => h.meltIntegralFhrs || 0));
  const maxFreeze = Math.max(...hourly.map((h) => h.freezeIntegralFhrs || 0));
  let score = 10;
  if (!hasMarginalRefresh) score -= 6.0;
  else if (!hasFreshPowderSource) score -= 3.0;
  if (snow24 < (climb.thresholds.minNewSnow24hCm ?? 8)) score -= 1.0;
  if (snow24 > (climb.thresholds.maxNewSnow24hCm ?? 20)) score -= 4.0;
  if (wind > (climb.thresholds.maxSummitWindKph ?? 30)) score -= (wind - (climb.thresholds.maxSummitWindKph ?? 30)) * 0.25;
  if (summitTemp > (climb.thresholds.maxSummitTempC ?? -3)) score -= 2.5;
  if (freezingLevel > (climb.thresholds.maxFreezingLevelM ?? 2200)) score -= 2.5;
  if (maxMelt > 20) score -= 1.5;
  if (maxMelt > 40) score -= 2.5;
  if (heavyHours > 0) score -= heavyHours * 0.25;
  if (preservedHours >= 10 && hasFreshPowderSource) score += 1.0;
  const avalancheRisk = avalanche?.riskScore || 0;
  if (avalancheRisk >= 6) score -= 3.0;
  const powderScore = clampScore(score);
  let availability = "No fresh powder source detected";
  if (hasFreshPowderSource) availability = "Powder available from recent/forecast snow";
  else if (hasMarginalRefresh) availability = "Marginal refresh / dust-on-crust possible";
  let interpretation = "No strong powder window identified.";
  if (!hasMarginalRefresh) interpretation = "Cold temperatures may preserve snow, but there is no recent/forecast snow source in the current data. Treat blue/grey cold periods as powder-preserving conditions only, not proof of skiable powder.";
  else if (snow24 > 20) interpretation = "No-go signal: more than 20 cm new snow in the latest 24h block creates too much rapid load for this steep objective.";
  else if (avalancheRisk >= 6) interpretation = "No-go or major caution: avalanche context is above the conservative powder-objective gate. Review the bulletin manually.";
  else if (powderScore >= 7.5) interpretation = "Good powder signal: enough recent/forecast snow source, cold preservation, freezing level below the route, and limited heat input. Best timing is after storm loading has eased, not during peak snowfall.";
  else if (maxMelt > 20) interpretation = "Powder may be settling/getting heavier from daytime heat input. Expect quality to deteriorate on solar or lower-elevation terrain.";
  else if (wind > 30) interpretation = "Wind loading is the main concern. Look for wind slab/cross-loading and avoid committing to steep terrain without strong field confirmation.";
  return { day, profile, hourly, snow24, recentSnowCm, hasFreshPowderSource, hasMarginalRefresh, availability, wind, summitTemp, freezingLevel, preservedHours, heavyHours, maxMelt, maxFreeze, powderScore, interpretation };
}
function analyzePowderCycle(climb, forecast = [], avalanche) {
  if (climb.routeType !== "powder_ski" || !forecast.length) return null;
  const seven = forecast.slice(0, 7);
  const days = seven.map((day, index) => {
    const priorSnowCm = seven.slice(Math.max(0, index - 3), index).reduce((s, d) => s + (((d.summitSnowGfsCm || 0) + (d.summitSnowEcmwfCm || 0)) / 2), 0);
    return analyzePowderDay(climb, day, avalanche, priorSnowCm);
  });
  const best = [...days].sort((a, b) => b.powderScore - a.powderScore)[0];
  return { ...best, days };
}
function PowderCycleGraph({ title, elevationM, days = [] }) {
  const [hover, setHover] = useState(null);
  const width = 980, height = 260, pad = 52;
  const rows = days.flatMap((day, dayIndex) => day.hourly.map((h, hourIndex) => ({ ...h, dayIndex, hourIndex, dayLabel: day.day.label, date: day.day.date })));
  const temps = rows.map((r) => r.effectiveTempC).filter((v) => typeof v === "number" && Number.isFinite(v));
  const minT = Math.min(-20, ...temps) - 1;
  const maxT = Math.max(2, ...temps) + 1;
  const yTicks = Array.from({ length: 5 }, (_, i) => maxT - (i / 4) * (maxT - minT));
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
    setHover(rows[Math.max(0, Math.min(rows.length - 1, index))]);
  }
  const hoverX = hover ? xFor(hover.dayIndex, hover.hourIndex) : null;
  const hoverY = hover ? yFor(hover.effectiveTempC) : null;
  return <Card><CardContent className="p-5"><h3 className="mb-1 font-semibold">{title}</h3><p className="mb-3 text-sm text-slate-500">Elevation: {elevationM} m · 7-day powder-preservation curve. Blue bands mean powder can be preserved only if recent snow exists; grey means cold but no powder source detected.</p><div className="relative overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="min-w-[980px] w-full h-72 rounded-xl border bg-white cursor-crosshair" onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>{yTicks.map((tick, i) => <g key={`powder-y-${i}`}><line x1={pad} x2={width - pad} y1={yFor(tick)} y2={yFor(tick)} className="stroke-slate-100" /><text x={pad - 8} y={yFor(tick) + 4} textAnchor="end" className="fill-slate-500 text-[10px]">{tick.toFixed(0)}°</text></g>)}<line x1={pad} x2={width - pad} y1={yFor(0)} y2={yFor(0)} className="stroke-slate-400" strokeDasharray="5 5" /><text x={pad + 4} y={yFor(0) - 6} className="fill-slate-500 text-[11px]">0°C effective</text>{days.map((day, dayIndex) => <g key={`powder-day-${day.day.label}`}><line x1={xFor(dayIndex, 0)} x2={xFor(dayIndex, 0)} y1={pad} y2={height - pad} className="stroke-slate-200" /><text x={xFor(dayIndex, 0) + 4} y={height - 10} className="fill-slate-500 text-[10px]">{day.day.label}</text></g>)}{rows.map((r) => (r.powderState === "Preserved powder" || r.powderState === "Powder-preserving conditions only") ? <rect key={`powder-band-${r.dayIndex}-${r.hourIndex}`} x={xFor(r.dayIndex, r.hourIndex) - 4} y={pad} width="8" height={height - pad * 2} className="fill-sky-200 opacity-70" /> : null)}<polyline points={points} fill="none" className="stroke-slate-900" strokeWidth="3" vectorEffect="non-scaling-stroke" />{rows.map((r, i) => <circle key={`powder-dot-${r.dayIndex}-${r.hourIndex}`} cx={xFor(r.dayIndex, r.hourIndex)} cy={yFor(r.effectiveTempC)} r={i % 2 === 0 ? "2.5" : "1.8"} className={r.powderState === "Preserved powder" ? "fill-sky-600" : r.powderState === "Marginal powder" ? "fill-cyan-500" : r.powderState === "Settling" ? "fill-yellow-500" : "fill-orange-500"} />)}{hover && <g><line x1={hoverX} x2={hoverX} y1={pad} y2={height - pad} className="stroke-slate-500" strokeDasharray="4 4" /><circle cx={hoverX} cy={hoverY} r="5" className="fill-white stroke-slate-900" strokeWidth="2" /></g>}</svg>{hover && <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg"><div className="mb-1 font-semibold text-slate-950">{hover.dayLabel} · {hover.date} · {hover.label}</div><div>State: <strong>{hover.powderState}</strong></div><div>Effective temp: <strong>{hover.effectiveTempC} °C</strong></div><div>Air / wet-bulb: <strong>{hover.airTempC} / {hover.wetBulbC} °C</strong></div><div>Melt heat: <strong>{hover.meltIntegralFhrs} F-hrs</strong></div><div>Freeze recovery: <strong>{hover.freezeIntegralFhrs} F-hrs</strong></div><div>Solar elevation: <strong>{hover.solarElevationDeg}°</strong></div><div>SW / LW equivalent: <strong>{hover.shortwaveEqC} / {hover.longwaveEqC} °C</strong></div><div className="mt-1 text-slate-500">Powder preservation target: daily heat input under ~15 F-hrs; 20–40 F-hrs = settling/heavier snow.</div></div>}</div><div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600"><span className="inline-flex items-center gap-1"><span className="h-3 w-5 rounded bg-sky-200" />Preserved powder with snow source</span><span className="inline-flex items-center gap-1"><span className="h-3 w-5 rounded bg-slate-200" />Cold only / no snow source</span><span className="inline-flex items-center gap-1"><span className="h-3 w-5 rounded bg-yellow-200" />Settling</span><span className="inline-flex items-center gap-1"><span className="h-3 w-5 rounded bg-orange-300" />Getting heavy</span></div></CardContent></Card>;
}
function PowderCycleHeatmap({ title, elevationM, days = [] }) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 5);
  return <Card><CardContent className="p-5"><h3 className="mb-1 font-semibold">{title}</h3><p className="mb-4 text-sm text-slate-500">Elevation: {elevationM} m · 7-day powder-state view. Blue = preserved powder with snow source; grey = powder-preserving conditions only; yellow/orange = settlement or warming damage.</p><div className="overflow-x-auto"><div className="min-w-[980px]"><div className="grid gap-1" style={{ gridTemplateColumns: "90px repeat(16, minmax(44px, 1fr))" }}><div></div>{hours.map((h) => <div key={h} className="text-center text-[10px] font-medium text-slate-500">{h}:00</div>)}{days.map((day) => <React.Fragment key={`powder-${day.day.date || day.day.label}`}><div className="flex flex-col justify-center rounded-lg bg-slate-50 px-2 text-xs"><span className="font-semibold text-slate-900">{day.day.label}</span><span className="text-[10px] text-slate-500">{day.day.date}</span></div>{day.hourly.map((h) => <div key={`${day.day.label}-powder-${h.hour}`} title={`${day.day.label} ${h.label}: ${h.powderState}; effective ${h.effectiveTempC}°C`} className={`h-12 rounded-md border p-1 text-center text-[9px] leading-tight ${powderCellClass(h.powderState)}`}><div className="font-semibold">{h.effectiveTempC}°</div><div className="truncate">{h.powderState === "Preserved powder" ? "Powder" : h.powderState === "Powder-preserving conditions only" ? "Cold/no snow" : h.powderState}</div></div>)}</React.Fragment>)}</div></div></div></CardContent></Card>;
}
function PowderCyclePanel({ climb, forecast, avalanche }) {
  const analysis = analyzePowderCycle(climb, forecast, avalanche);
  if (!analysis) return <div className="rounded-2xl border bg-white p-5 text-sm text-slate-700">Powder-cycle analysis is only shown for powder/steep-ski objectives with live forecast data.</div>;
  const bestDayLabel = `${analysis.day.label}${analysis.day.date ? ` · ${analysis.day.date}` : ""}`;
  return <div className="space-y-4"><div className="grid gap-4 md:grid-cols-4"><MetricCard icon={SnowIcon} label="Best Powder Score" value={`${analysis.powderScore.toFixed(1)} / 10`} detail={bestDayLabel} className={scoreColor(analysis.powderScore)} /><MetricCard icon={SnowIcon} label="Powder Source" value={analysis.availability} detail={`24h: ${analysis.snow24.toFixed(1)} cm · recent: ${analysis.recentSnowCm.toFixed(1)} cm`} className={analysis.hasFreshPowderSource ? "text-emerald-700" : analysis.hasMarginalRefresh ? "text-yellow-700" : "text-red-700"} /><MetricCard icon={WindIcon} label="Wind Loading" value={`${Math.round(analysis.wind)} kph`} detail="Strong wind after snow is a major penalty" className={analysis.wind > 30 ? "text-red-700" : "text-emerald-700"} /><MetricCard icon={MountainIcon} label="Freezing Level" value={`${Math.round(analysis.freezingLevel)} m`} detail="Should stay below the route" className={analysis.freezingLevel > (climb.thresholds.maxFreezingLevelM || 2200) ? "text-red-700" : "text-emerald-700"} /></div><Card><CardContent className="p-5"><h3 className="font-semibold">7-day powder-cycle interpretation</h3><p className="mt-2 text-slate-700">{analysis.interpretation}</p><p className="mt-2 text-sm text-slate-500">This uses Ullr-style effective snow temperature and daily heat integrals for powder preservation, but separates preservation from availability. Cold conditions do not create powder unless there is recent or forecast snow. Conservative gates: no more than 20 cm in 24h, avalanche hazard Moderate or lower, freezing level below the route, and limited wind loading after snowfall.</p></CardContent></Card><div className="grid gap-4"><PowderCycleGraph title="Powder preservation curve" elevationM={analysis.profile.entranceM || climb.summitM} days={analysis.days} /><PowderCycleHeatmap title="Powder state heatmap" elevationM={analysis.profile.entranceM || climb.summitM} days={analysis.days} /></div></div>;
}
function SnowSurfacePanel({ climb, forecast, avalanche }) {
  if (climb.routeType === "ski_corn") return <CornCyclePanel climb={climb} forecast={forecast} />;
  if (climb.routeType === "powder_ski") return <PowderCyclePanel climb={climb} forecast={forecast} avalanche={avalanche} />;
  return <div className="rounded-2xl border bg-white p-5 text-sm text-slate-700">Snow-surface modeling is currently active for corn-cycle and powder/steep-ski objectives.</div>;
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
  const historySource = hasLiveData ? weatherState.data.historySource : "NO REAL HISTORY";
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
    const todayVisibility = navigationVisibilityScore(forecast[0] || {});
    const todaySolar = solarReliability(forecast[0] || {});
    if ((climb.routeType === "mixed_alpine_ice" || climb.routeType === "pure_rock") && bestWindow.quality >= 6.5 && todayVisibility !== null && todayVisibility < 6) return `${climb.name}: weather ingredients are partly favorable, but cloud cover creates ${cloudNavigationLabel(todayVisibility).toLowerCase()} for route finding/glacier navigation. Low cloud ${cloudText(dayLowCloudPct(forecast[0] || {}))}, total cloud ${cloudText(dayCloudPct(forecast[0] || {}))}.`;
    if (climb.routeType === "ski_corn" && bestWindow.quality >= 6.5 && todaySolar !== null && todaySolar < 0.55) return `${climb.name}: temperature/freezing-level signal may be acceptable, but cloud cover reduces solar reliability to ${Math.round(todaySolar * 100)}%. Corn timing may be delayed, muted, or fail to soften.`;
    if (climb.routeType === "pure_rock" && bestWindow.quality >= 7) return `${climb.name}: ${bestWindow.label} is the better dry-rock signal. Require no precip, warm rock, freezing levels above the summit, and acceptable cloud/visibility.`;
    if (climb.routeType === "ski_corn" && bestWindow.quality >= 7.5) return `${climb.name}: ${bestWindow.label} may have the better corn-cycle signal. Look for overnight refreeze, freezing level rising close to the summit, light wind, controlled daytime softening, and sufficient sun.`;
    if (climb.routeType === "mixed_alpine_ice" && bestWindow.quality >= 7) return `${climb.name}: ${bestWindow.label} may be a mixed alpine window. Look for clear weather, low precip, manageable wind, good overnight freeze, and adequate visibility for navigation.`;
    if (bestWindow.leadDays >= 6 && bestWindow.quality >= 8 && bestWindow.confidence >= 5.5) return `Early signal: a strong ${bestWindow.label} window may be forming. Watch closely but do not commit yet.`;
    if (mode === "winter" && avalanche.riskScore >= 7) return "Weather may be improving, but avalanche context is still a primary constraint. Manual bulletin review required.";
    if (immediateGoQuality >= 8) return "Immediate operational window looks good. Review detailed forecast, snow/route conditions, avalanche context, and timing now.";
    if (windowQuality >= 8 && bestWindow.confidence >= 7) return "The next 72h pattern is strong. Review detailed forecast and route-specific constraints.";
    if (windowQuality >= 6 || immediateGoQuality >= 6) return "Marginal or route-dependent window. Watch model convergence, timing, and recent observations.";
    return "No strong immediate window identified. Keep monitoring for model agreement and pressure trend changes.";
  }, [hasLiveData, climb.id, climb.routeType, bestWindow, windowQuality, immediateGoQuality, mode, avalanche.riskScore]);

  const combinedChart = forecast.map((d) => ({ label: d.label, date: d.date, summitWindAvg: Math.round(((d.summitWindGfsKph || 0) + (d.summitWindEcmwfKph || 0)) / 2), midWindAvg: Math.round(((d.midWindGfsKph || 0) + (d.midWindEcmwfKph || 0)) / 2), valleyWindAvg: Math.round(((d.valleyWindGfsKph || 0) + (d.valleyWindEcmwfKph || 0)) / 2), summitTempAvg: Number((((d.summitTempGfsC || 0) + (d.summitTempEcmwfC || 0)) / 2).toFixed(1)), summitTempMinAvg: d.summitTempMinAvgC ?? null, summitTempMaxAvg: d.summitTempMaxAvgC ?? null, summitRainAvg: Number((((d.summitRainGfsMm || 0) + (d.summitRainEcmwfMm || 0)) / 2).toFixed(1)), summitSnowAvg: Number((((d.summitSnowGfsCm || 0) + (d.summitSnowEcmwfCm || 0)) / 2).toFixed(1)), freezingLevelM: d.freezingLevelM ?? null, pressureHpa: d.pressureHpa ?? null, cloudCoverPct: dayCloudPct(d), cloudCoverLowPct: dayLowCloudPct(d), cloudCoverMidPct: dayMidCloudPct(d), cloudCoverHighPct: dayHighCloudPct(d), solarReliabilityPct: solarReliability(d) === null ? null : Math.round(solarReliability(d) * 100), navigationVisibility: navigationVisibilityScore(d) === null ? null : Number(navigationVisibilityScore(d).toFixed(1)), navigationVisibilityPct: navigationVisibilityScore(d) === null ? null : Math.round(navigationVisibilityScore(d) * 10) }));

  return <div className="min-h-screen bg-slate-50 p-4 md:p-8"><div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="flex items-center gap-2 text-sm font-medium text-slate-600"><MountainIcon /> Mountain Window Intelligence</div><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Weather + Avalanche Window Prototype</h1><p className="mt-2 max-w-3xl text-slate-600">Decision-support dashboard for alpine climbing and ski mountaineering windows. Weather data now comes through backend routes using direct national-model feeds via Open-Meteo, requested at the objective summit elevation where supported. If live weather data fails, scoring is disabled and NO DATA is shown.</p></div><div className="flex flex-col gap-2 sm:flex-row"><SelectBox className="w-[280px]" value={climbId} onChange={(v) => { setClimbId(v); if (v === "map") setTab("map"); }} options={[{ value: "map", label: "Select from map…" }, ...climbs.map((c) => ({ value: c.id, label: c.name }))]} /><SelectBox className="w-[180px]" value={mode} onChange={setMode} options={[{ value: "summer", label: "Summer alpine" }, { value: "winter", label: "Winter / ski" }]} /></div></div>
    <Card><CardContent className="p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="text-xl font-semibold text-slate-950">{climb.name}</h2><p className="text-sm text-slate-600">{climb.region} · {climb.summitM} m · {climb.lat.toFixed(3)}, {climb.lon.toFixed(3)} · {climb.style} · {routeTypeLabel(climb)}</p></div><div className="flex flex-wrap gap-2"><Badge variant="secondary">Pattern: {pattern}</Badge><Badge variant="secondary">Best watch: {bestWindow.label}</Badge><Badge variant="outline">Mode: {mode}</Badge><Badge>Manual review required</Badge><button onClick={() => setRefreshCount((n) => n + 1)} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">{weatherState.loading ? "Loading…" : "Refresh live forecast"}</button></div></div></CardContent></Card>
    <div className="grid gap-4 md:grid-cols-6"><MetricCard icon={MountainIcon} label="Objective Type" value={routeTypeLabel(climb)} detail={routeTypeDescription(climb)} /><MetricCard icon={SunIcon} label="Immediate Go Window" value={hasLiveData ? `${immediateGoQuality.toFixed(1)} / 10` : "NO DATA"} detail={climb.routeType === "ski_corn" ? "Next 24–48 hrs" : "Next 24 hrs"} className={scoreColor(immediateGoQuality)} /><MetricCard icon={GaugeIcon} label="72h Pattern Stability" value={hasLiveData ? `${windowQuality.toFixed(1)} / 10` : "NO DATA"} detail="Next 3-day block" className={scoreColor(windowQuality)} /><MetricCard icon={TrendIcon} label="Best Upcoming Window" value={hasLiveData ? `${bestWindow.quality.toFixed(1)} / 10` : "NO DATA"} detail={hasLiveData ? `${bestWindow.label} · ${watchStatusForWindow(bestWindow)}` : "NO DATA"} className={scoreColor(bestWindow.quality)} /><MetricCard icon={GaugeIcon} label="Forecast Confidence" value={hasLiveData ? `${bestWindow.confidence.toFixed(1)} / 10` : "NO DATA"} detail="Lead-time penalty + model spread" className={scoreColor(bestWindow.confidence)} /><MetricCard icon={SunIcon} label={climb.routeType === "ski_corn" ? "Solar Reliability" : "Navigation Visibility"} value={hasLiveData ? (climb.routeType === "ski_corn" ? (solarReliability(forecast[0] || {}) === null ? "NO DATA" : `${Math.round(solarReliability(forecast[0] || {}) * 100)}%`) : cloudNavigationLabel(navigationVisibilityScore(forecast[0] || {}))) : "NO DATA"} detail={hasLiveData ? `Cloud: total ${cloudText(dayCloudPct(forecast[0] || {}))} · low ${cloudText(dayLowCloudPct(forecast[0] || {}))}` : "Cloud cover not loaded"} className={hasLiveData ? scoreColor(climb.routeType === "ski_corn" ? ((solarReliability(forecast[0] || {}) ?? 0) * 10) : (navigationVisibilityScore(forecast[0] || {}) ?? 0)) : ""} /><MetricCard icon={ShieldIcon} label="Avalanche Risk Context" value={hasAvalancheData ? `${avalanche.riskScore.toFixed(1)} / 10` : "NO LIVE DATA"} detail={mode === "winter" ? avalanche.headline : "Hidden in summer mode"} className={scoreColor(avalanche.riskScore, true)} /><MetricCard icon={TrendIcon} label="Pattern State" value={hasLiveData ? pattern : "NO DATA"} detail="Lookback + forecast" /></div>
    <Card><CardContent className="p-5"><div className="flex gap-3"><AlertIcon className="mt-1 h-5 w-5 text-amber-600" /><div><h3 className="font-semibold text-slate-950">Interpretation</h3><p className="mt-1 text-slate-700">{recommendation}</p><p className="mt-2 text-sm text-slate-500">The app alerts on “possible window forming,” not “safe to go.” Final decisions require human review of route conditions, observations, avalanche problems, glacier hazards, and team capability.</p></div></div></CardContent></Card>
    {hasLiveData && <OperationalSummaryPanel climb={climb} forecast={forecast} history={history} avalanche={avalanche} immediateScore={immediateGoQuality} confidence={bestWindow.confidence} />}
    {!hasLiveData && <div className="rounded-2xl border border-red-500 bg-red-50 p-6 text-sm text-red-900"><strong>DATA ERROR — DO NOT USE THIS TOOL</strong><div className="mt-2">{weatherState.error || "Live weather data could not be retrieved."}</div><div className="mt-2">All scoring, windows, and recommendations are disabled.</div></div>}
    {hasLiveData && <><WindowTimeline forecast={forecast} bestWindow={bestWindow} source={source} /><div className="grid gap-4 lg:grid-cols-2"><RawModelLineChart forecast={forecast} metricKey="summitTempC" unit="°C" title="Raw model traces: summit temperature" note="Actual per-model values returned by the backend connector. Missing values are shown as gaps, not zeros." /><RawModelLineChart forecast={forecast} metricKey="summitWindKph" unit="kph" title="Raw model traces: summit wind" note="Use this to see convergence or model disagreement." /></div><ModelAvailabilityPanel forecast={forecast} climb={climb} unavailableModels={unavailableModels} /></>}
    <AlertRulePanel climb={climb} mode={mode} setMode={setMode} />
    <div className="grid grid-cols-7 gap-2 rounded-2xl bg-white p-1 shadow-sm"><TabButton active={tab === "forecast"} onClick={() => setTab("forecast")}>Forecast</TabButton><TabButton active={tab === "corn"} onClick={() => setTab("corn")}>Snow Surface</TabButton><TabButton active={tab === "lookback"} onClick={() => setTab("lookback")}>14-day lookback</TabButton><TabButton active={tab === "avalanche"} onClick={() => setTab("avalanche")}>Avalanche</TabButton><TabButton active={tab === "alerts"} onClick={() => setTab("alerts")}>Alerts</TabButton><TabButton active={tab === "map"} onClick={() => setTab("map")}>Map</TabButton><TabButton active={tab === "logic"} onClick={() => setTab("logic")}>Scoring logic</TabButton></div>
    {tab === "forecast" && <div className="grid gap-4 lg:grid-cols-2"><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><WindIcon /> Forecast: wind by elevation</h3><MiniLineChart data={combinedChart} series={[{ key: "summitWindAvg", label: "Summit wind", unit: "kph", className: "text-slate-900" }, { key: "midWindAvg", label: "Mid-mountain wind", unit: "kph", className: "text-slate-500" }, { key: "valleyWindAvg", label: "Valley wind", unit: "kph", className: "text-slate-400" }]} minOverride={0} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><SunIcon /> Forecast: summit temperature swing</h3><MiniLineChart data={combinedChart} series={[{ key: "summitTempAvg", label: "Summit avg", unit: "°C", className: "text-slate-900" }, { key: "summitTempMinAvg", label: "Summit low", unit: "°C", className: "text-slate-500" }, { key: "summitTempMaxAvg", label: "Summit high", unit: "°C", className: "text-slate-400" }]} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><RainIcon /> Forecast: summit rain</h3><MiniLineChart data={combinedChart} series={[{ key: "summitRainAvg", label: "Summit rain", unit: "mm", className: "text-slate-900" }]} minOverride={0} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><SnowIcon /> Forecast: summit snow</h3><MiniLineChart data={combinedChart} series={[{ key: "summitSnowAvg", label: "Summit snow", unit: "cm", className: "text-slate-900" }]} minOverride={0} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><MountainIcon /> Freezing level</h3><MiniLineChart data={combinedChart} series={[{ key: "freezingLevelM", label: "Freezing level", unit: "m", className: "text-slate-900" }]} minOverride={0} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-1 flex items-center gap-2 font-semibold"><GaugeIcon /> Pressure</h3><p className="mb-3 text-sm text-slate-500">Mean-sea-level pressure shown on a realistic 950–1050 hPa operating scale so synoptic changes are visible.</p><MiniLineChart data={combinedChart} series={[{ key: "pressureHpa", label: "Pressure", unit: "hPa", color: "#7c3aed", dash: "", width: 3.5 }]} minOverride={950} maxOverride={1050} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><SunIcon /> Cloud cover + visibility</h3><MiniLineChart data={combinedChart} series={[{ key: "cloudCoverPct", label: "Total cloud", unit: "%", color: "#111827", dash: "", width: 3.5 }, { key: "cloudCoverLowPct", label: "Low cloud", unit: "%", color: "#dc2626", dash: "2 5", width: 3 }, { key: "cloudCoverMidPct", label: "Mid cloud", unit: "%", color: "#f59e0b", dash: "8 4", width: 3 }, { key: "cloudCoverHighPct", label: "High cloud", unit: "%", color: "#7c3aed", dash: "5 4", width: 3 }]} minOverride={0} maxOverride={100} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><ShieldIcon /> Solar reliability / navigation visibility</h3><MiniLineChart data={combinedChart} series={[{ key: "solarReliabilityPct", label: "Solar reliability", unit: "%", color: "#059669", dash: "", width: 3.5 }, { key: "navigationVisibilityPct", label: "Navigation visibility", unit: "%", color: "#2563eb", dash: "8 4", width: 3 }]} minOverride={0} maxOverride={100} /></CardContent></Card></div>}
    {tab === "corn" && <SnowSurfacePanel climb={climb} forecast={forecast} avalanche={avalanche} />}
    {tab === "lookback" && <LookbackPanel climb={climb} history={history} historySource={historySource} />}
    {tab === "avalanche" && <div className="grid gap-4 lg:grid-cols-3"><Card className="lg:col-span-2"><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><SnowIcon /> Live avalanche bulletin</h3>{!hasAvalancheData && <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><strong>NO LIVE AVALANCHE DATA IN SCORING</strong><div className="mt-2">{avalancheState.error || avalanche.headline}</div></div>}{hasAvalancheData && <><div className="mb-3 text-sm text-slate-600">Source: {avalancheState.data?.source}</div><div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-100 text-left text-slate-600"><tr><th className="p-3">Valid / Issued</th><th className="p-3">Alpine</th><th className="p-3">Treeline</th><th className="p-3">Problems</th><th className="p-3">Summary</th></tr></thead><tbody>{avalancheHistory.map((d) => <tr key={d.label} className="border-t"><td className="p-3 font-medium">{d.label}</td><td className="p-3"><DangerBadge rating={d.alpine || 0} /></td><td className="p-3"><DangerBadge rating={d.treeline || 0} /></td><td className="p-3">{(d.problems || []).join(", ") || "—"}</td><td className="p-3 text-slate-600">{d.note}</td></tr>)}</tbody></table></div></>}</CardContent></Card><Card><CardContent className="space-y-4 p-5"><h3 className="font-semibold">Avalanche summary</h3><div><div className="text-sm text-slate-500">Current alpine rating</div><div className="mt-1"><DangerBadge rating={avalanche.last?.alpine || 0} /></div></div><p className="text-sm text-slate-700">{avalanche.headline}</p>{avalancheState.loading && <p className="text-xs text-slate-500">Loading avalanche feed…</p>}</CardContent></Card></div>}
    {tab === "alerts" && <AlertRulePanel climb={climb} mode={mode} setMode={setMode} />}
    {tab === "map" && <MapPickerPlaceholder onSelect={(id) => { setClimbId(id); setTab("forecast"); }} />}
    {tab === "logic" && <Card><CardContent className="space-y-5 p-5"><h3 className="font-semibold">How this version scores route types and time horizons</h3><p className="text-slate-600"><strong>Powder / steep ski objectives</strong> reward cold snow, moderate new-snow load, low wind loading, freezing levels below the route, and conservative avalanche conditions. Big 24h storm totals, rapid warming, wind loading, or elevated avalanche hazard should override the weather score.</p><p className="text-slate-600"><strong>Corn-cycle ski objectives</strong> reward overnight freeze, high pressure, light wind, low precip, and daytime warming/freezing level rising close to the summit. Summit highs near or slightly above 0°C can improve corn timing; the model penalizes no refreeze, excessive heat, wind, or new precip.</p><p className="text-slate-600"><strong>Pure rock objectives</strong> heavily reward dry, clear, warm weather with freezing levels above the summit and penalize any precip or below-freezing summit temperatures.</p><p className="text-slate-600"><strong>Mixed alpine / ice objectives</strong> reward clear weather, low precip, manageable wind, and a useful freeze/refreeze while penalizing both extreme cold and sloppy warm conditions.</p><p className="text-slate-600"><strong>Immediate Go Window</strong> is route-operational: for corn skiing it emphasizes the next 24–48 hours; for rock or alpine routes it emphasizes the next day. <strong>72h Pattern Stability</strong> is stricter and asks whether the whole next 3-day block is clean.</p><p className="text-slate-600"><strong>Best Upcoming Window</strong> still uses a 3-day pattern window so you can see a possible D+11 to D+13 setup forming before it enters the immediate timeframe.</p><p className="text-slate-600"><strong>Cloud cover</strong> is split into total, low, mid, and high cloud where the backend provides it. Low cloud is treated as the biggest route-finding/glacier-navigation penalty and also the strongest solar-reliability penalty for corn timing. High cloud has a smaller effect because thin cirrus may still transmit useful solar energy.</p><p className="text-slate-600"><strong>Operational window summary</strong> borrows the useful parts of matrix-style systems such as top drivers, explicit constraints, and separate confidence. It intentionally avoids treating a technical alpine route like a generic guided volcano ascent: cold can be acceptable for the Kain Face, dry near-freezing consolidation can be positive, but low cloud, recent loading, true melt damage/rain, wind, and visibility still downgrade the route-window signal.</p><p className="text-slate-600">Backend failures are displayed as NO DATA. Short-range model gaps are displayed as gaps/unavailable, not zero wind, zero temperature, or zero pressure.</p></CardContent></Card>}
  </div></div>;
}
