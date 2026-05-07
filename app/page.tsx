"use client";

import React, { useEffect, useMemo, useState } from "react";

function Card({ children, className = "" }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function Button({ children, variant = "solid", className = "", ...props }) {
  const base = "rounded-xl px-4 py-2 text-sm font-medium transition";
  const styles = variant === "outline" ? "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50" : "bg-slate-900 text-white hover:bg-slate-700";
  return <button className={`${base} ${styles} ${className}`} {...props}>{children}</button>;
}

function Badge({ children, className = "", variant = "solid" }) {
  const styles = variant === "outline" ? "border border-slate-300 bg-white text-slate-700" : variant === "secondary" ? "bg-slate-100 text-slate-700" : "bg-slate-900 text-white";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles} ${className}`}>{children}</span>;
}

function SelectBox({ value, onChange, options, className = "" }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${className}`}>
      {(options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

function Icon({ children, className = "h-4 w-4" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

const AlertIcon = (props) => <Icon {...props}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></Icon>;
const MountainIcon = (props) => <Icon {...props}><path d="m8 21 4-7 4 7" /><path d="M3 21 12 3l9 18" /><path d="M12 3v11" /></Icon>;
const SnowIcon = (props) => <Icon {...props}><path d="M12 2v20" /><path d="m17 5-10 14" /><path d="m7 5 10 14" /><path d="M2 12h20" /><path d="m5 7 2 2" /><path d="m17 15 2 2" /><path d="m19 7-2 2" /><path d="m7 15-2 2" /></Icon>;
const SunIcon = (props) => <Icon {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></Icon>;
const WindIcon = (props) => <Icon {...props}><path d="M3 8h12a3 3 0 1 0-3-3" /><path d="M3 12h17" /><path d="M3 16h12a3 3 0 1 1-3 3" /></Icon>;
const RainIcon = (props) => <Icon {...props}><path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9" /><path d="M8 19v1" /><path d="M8 14v1" /><path d="M16 19v1" /><path d="M16 14v1" /><path d="M12 21v1" /><path d="M12 16v1" /></Icon>;
const GaugeIcon = (props) => <Icon {...props}><path d="M12 14l4-4" /><path d="M3.3 19a9 9 0 1 1 17.4 0" /><path d="M5 19h14" /></Icon>;
const TrendIcon = (props) => <Icon {...props}><path d="m3 17 6-6 4 4 8-8" /><path d="M14 7h7v7" /></Icon>;
const ShieldIcon = (props) => <Icon {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="M12 8v4" /><path d="M12 16h.01" /></Icon>;

const climbs = [
  { id: "robson-kain", name: "Mount Robson — Kain Face", region: "Canadian Rockies", lat: 53.110, lon: -119.156, summitM: 3954, style: "summer alpine / winter alpine", defaultMode: "summer", activeFromMonth: 7, thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 0, maxPrecipMm3Day: 0, minFreezingLevelM: 3000, maxFreezingLevelM: 4300, minSummitTempC: -15, idealSummitTempMinC: -10, coldSummitPenaltyPerC: 0.25, windPenaltyPerKph: 0.12, precipPenaltyPerMm: 0.45, strictNoPrecip: true } },
  { id: "sir-donald-nw-ridge", name: "Mount Sir Donald — NW Ridge", region: "Selkirks", lat: 51.263, lon: -117.437, summitM: 3284, style: "summer alpine rock", defaultMode: "summer", activeFromMonth: 7, thresholds: { maxSummitWindKph: 35, maxPrecipMm24h: 0, maxPrecipMm3Day: 0, minFreezingLevelM: 3300, maxFreezingLevelM: 4600, windPenaltyPerKph: 0.06, precipPenaltyPerMm: 1.0, rockDryObjective: true, minSummitTempC: 0, idealValleyTempC: 30, strictNoPrecip: true } },
  { id: "bugaboo-spire", name: "Bugaboo Spire — Kain Route", region: "Purcells", lat: 50.736, lon: -116.771, summitM: 3204, style: "summer alpine rock", defaultMode: "summer", activeFromMonth: 7, thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 1, minFreezingLevelM: 2900, maxFreezingLevelM: 4300 } },
  { id: "adams-sw-chutes", name: "Mount Adams — SW Chutes", region: "Washington Cascades", lat: 46.202, lon: -121.490, summitM: 3743, style: "winter / spring ski mountaineering", defaultMode: "winter", activeFromMonth: 1, thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 0.5, maxPrecipMm3Day: 1.5, minFreezingLevelM: 2200, maxFreezingLevelM: 3800, windPenaltyPerKph: 0.11, precipPenaltyPerMm: 0.55, skiCornObjective: true, idealPressureHpa: 1020, idealMidTempMinC: -4, idealMidTempMaxC: 4, idealSummitTempMaxC: 1 } },
  { id: "temple-aemmer", name: "Mount Temple — Aemmer Couloir", region: "Canadian Rockies", lat: 51.350, lon: -116.207, summitM: 3544, style: "winter ski mountaineering / steep snow", defaultMode: "winter", activeFromMonth: 1, thresholds: { maxSummitWindKph: 35, maxPrecipMm24h: 3, minFreezingLevelM: 1500, maxFreezingLevelM: 3300 } },
];

const dangerLabels = ["No Rating", "Low", "Moderate", "Considerable", "High", "Extreme"];
const FORECAST_MODEL_CATALOG = [
  { id: "best_match", label: "Best Match", provider: "Open-Meteo", maxLeadDays: 16, regions: ["global"], fetchable: true },
  { id: "gfs_seamless", label: "GFS", provider: "NOAA / Open-Meteo", maxLeadDays: 16, regions: ["global"], fetchable: true },
  { id: "gem_seamless", label: "GEM / GDPS", provider: "ECCC / Open-Meteo", maxLeadDays: 10, regions: ["global"], fetchable: true },
  { id: "gem_regional", label: "RDPS", provider: "ECCC / Open-Meteo", maxLeadDays: 3, regions: ["canada"], fetchable: true },
  { id: "gem_hrdps_continental", label: "HRDPS", provider: "ECCC / Open-Meteo", maxLeadDays: 2, regions: ["canada"], fetchable: true },
  { id: "nam_conus", label: "NAM", provider: "NOAA / Open-Meteo", maxLeadDays: 4, regions: ["usa"], fetchable: true },
  { id: "gfs_hrrr", label: "HRRR", provider: "NOAA / Open-Meteo", maxLeadDays: 2, regions: ["usa"], fetchable: true },
  { id: "rap", label: "RAP", provider: "NOAA backend connector needed", maxLeadDays: 1, regions: ["usa"], fetchable: false },
  { id: "geps", label: "GEPS", provider: "ECCC ensemble connector needed", maxLeadDays: 16, regions: ["canada"], fetchable: false },
];

function dangerStyle(d) {
  if (d <= 0) return { backgroundColor: "#e5e7eb", color: "#111827", border: "1px solid #cbd5e1" };
  if (d === 1) return { backgroundColor: "#00a651", color: "#ffffff" };
  if (d === 2) return { backgroundColor: "#fff200", color: "#111827" };
  if (d === 3) return { backgroundColor: "#f7941d", color: "#111827" };
  if (d === 4) return { backgroundColor: "#ed1c24", color: "#ffffff" };
  return { backgroundColor: "#000000", color: "#ffffff" };
}

function DangerBadge({ rating }) {
  return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" style={dangerStyle(rating)}>{dangerLabels[rating] || "No Rating"}</span>;
}

const clampScore = (value) => Math.max(0, Math.min(10, Number(value) || 0));
const toDateString = (date) => date.toISOString().slice(0, 10);
function addDays(date, days) { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy; }
function avg(values = []) { const clean = values.filter((v) => typeof v === "number" && Number.isFinite(v)); return clean.length ? clean.reduce((s, v) => s + v, 0) / clean.length : 0; }
function sum(values = []) { return values.filter((v) => typeof v === "number" && Number.isFinite(v)).reduce((t, v) => t + v, 0); }
function max(values = []) { const clean = values.filter((v) => typeof v === "number" && Number.isFinite(v)); return clean.length ? Math.max(...clean) : 0; }
function spread(values = []) { const clean = values.filter((v) => typeof v === "number" && Number.isFinite(v)); return clean.length > 1 ? Math.max(...clean) - Math.min(...clean) : 0; }
function pick(hourly, key, indices = []) { return indices.map((i) => hourly?.[key]?.[i]).filter((v) => typeof v === "number"); }

function estimateTempAtElevation(valleyTempC, elevationM, valleyElevationM = 800, lapseRateCPer1000m = 6.5) {
  return Number((valleyTempC - ((elevationM - valleyElevationM) / 1000) * lapseRateCPer1000m).toFixed(1));
}

function splitPrecipByTemp(totalMm, tempC) {
  if (tempC <= -1) return { rainMm: 0, snowCm: Number((totalMm * 1.0).toFixed(1)) };
  if (tempC >= 1) return { rainMm: Number(totalMm.toFixed(1)), snowCm: 0 };
  const snowFraction = (1 - tempC) / 2;
  return { rainMm: Number((totalMm * (1 - snowFraction)).toFixed(1)), snowCm: Number((totalMm * snowFraction).toFixed(1)) };
}

function groupHourlyByDay(hourly: any = {}) {
  const rows = [];
  const times = Array.isArray(hourly.time) ? hourly.time : [];
  times.forEach((time, index) => {
    const day = String(time).slice(0, 10);
    let row = rows.find((r) => r.date === day);
    if (!row) { row = { date: day, indices: [] }; rows.push(row); }
    row.indices.push(index);
  });
  return rows;
}

function getElevationProfile(climb) {
  const summitM = climb.summitM;
  const valleyM = climb.id === "robson-kain" ? 800 : climb.id === "adams-sw-chutes" ? 1700 : climb.id === "temple-aemmer" ? 1800 : 1500;
  return { summitM, midM: Math.round((summitM + valleyM) / 2), valleyM };
}

function summarizeOpenMeteoDayAtElevation(row, hourly) {
  if (!row || !Array.isArray(row.indices)) return { tempAvg: 0, tempMin: 0, tempMax: 0, windMax: 0, rainMm: 0, snowCm: 0, precipMm: 0, pressure: 0 };
  const temps = pick(hourly, "temperature_2m", row.indices);
  return {
    tempAvg: Number(avg(temps).toFixed(1)),
    tempMin: Number((temps.length ? Math.min(...temps) : 0).toFixed(1)),
    tempMax: Number((temps.length ? Math.max(...temps) : 0).toFixed(1)),
    windMax: Math.round(max(pick(hourly, "wind_speed_10m", row.indices))),
    rainMm: Number(sum(pick(hourly, "rain", row.indices)).toFixed(1)),
    snowCm: Number(sum(pick(hourly, "snowfall", row.indices)).toFixed(1)),
    precipMm: Number(sum(pick(hourly, "precipitation", row.indices)).toFixed(1)),
    pressure: Math.round(avg(pick(hourly, "pressure_msl", row.indices))),
  };
}

function estimateFreezingLevelFromProfile(valley, mid, summit, elevations) {
  const points = [
    { elev: elevations.valleyM, temp: valley.tempAvg },
    { elev: elevations.midM, temp: mid.tempAvg },
    { elev: elevations.summitM, temp: summit.tempAvg },
  ].sort((a, b) => a.elev - b.elev);
  if (points[0].temp <= 0) return points[0].elev;
  if (points[2].temp >= 0) return points[2].elev;
  for (let i = 0; i < points.length - 1; i += 1) {
    const lower = points[i]; const upper = points[i + 1];
    if (lower.temp >= 0 && upper.temp <= 0) {
      const ratio = lower.temp / Math.max(0.1, lower.temp - upper.temp);
      return Math.round(lower.elev + ratio * (upper.elev - lower.elev));
    }
  }
  return points[1].elev;
}

function getObjectiveRegion(climb) {
  if (climb.region.includes("Washington")) return "usa";
  if (climb.region.includes("Canadian") || climb.region.includes("Selkirks") || climb.region.includes("Purcells")) return "canada";
  return "global";
}
function modelAppliesToClimb(model, climb) { const region = getObjectiveRegion(climb); return model.regions.includes("global") || model.regions.includes(region); }

function normalizeModelForecastDay(result, dayNumber, climb) {
  const model = result.model;
  const summitRow = result.summitRows?.[dayNumber - 1];
  const midRow = result.midRows?.[dayNumber - 1] || summitRow;
  const valleyRow = result.valleyRows?.[dayNumber - 1] || summitRow;
  const elevations = getElevationProfile(climb);
  const summit = summarizeOpenMeteoDayAtElevation(summitRow, result.summitHourly);
  const mid = summarizeOpenMeteoDayAtElevation(midRow, result.midHourly || result.summitHourly);
  const valley = summarizeOpenMeteoDayAtElevation(valleyRow, result.valleyHourly || result.summitHourly);
  return {
    modelId: model.id,
    modelLabel: model.label,
    provider: model.provider,
    maxLeadDays: model.maxLeadDays,
    dayIndex: dayNumber,
    date: summitRow?.date || "",
    summitWindKph: summit.windMax,
    midWindKph: mid.windMax,
    valleyWindKph: valley.windMax,
    summitTempC: summit.tempAvg,
    summitTempMinC: summit.tempMin,
    summitTempMaxC: summit.tempMax,
    midTempC: mid.tempAvg,
    midTempMinC: mid.tempMin,
    midTempMaxC: mid.tempMax,
    valleyTempC: valley.tempAvg,
    valleyTempMinC: valley.tempMin,
    valleyTempMaxC: valley.tempMax,
    precipMm: summit.precipMm,
    summitRainMm: summit.rainMm,
    summitSnowCm: summit.snowCm,
    midRainMm: mid.rainMm,
    midSnowCm: mid.snowCm,
    valleyRainMm: valley.rainMm,
    valleySnowCm: valley.snowCm,
    freezingLevelM: estimateFreezingLevelFromProfile(valley, mid, summit, elevations),
    pressureHpa: summit.pressure,
  };
}

function buildAggregatedForecastDays(modelResults = [], climb) {
  const validResults = modelResults.filter((r) => Array.isArray(r.summitRows) && r.summitRows.length > 0);
  if (!validResults.length) return [];
  const maxDays = Math.max(...validResults.map((r) => r.summitRows.length));
  const days = [];
  for (let i = 0; i < maxDays; i += 1) {
    const modelValues = validResults.map((result) => result.summitRows[i] ? normalizeModelForecastDay(result, i + 1, climb) : null).filter(Boolean);
    if (!modelValues.length) continue;
    const meanSummitWind = avg(modelValues.map((m) => m.summitWindKph));
    const meanMidWind = avg(modelValues.map((m) => m.midWindKph));
    const meanValleyWind = avg(modelValues.map((m) => m.valleyWindKph));
    const meanSummitTemp = avg(modelValues.map((m) => m.summitTempC));
    const meanMidTemp = avg(modelValues.map((m) => m.midTempC));
    const meanValleyTemp = avg(modelValues.map((m) => m.valleyTempC));
    const meanSummitTempMin = avg(modelValues.map((m) => m.summitTempMinC));
    const meanSummitTempMax = avg(modelValues.map((m) => m.summitTempMaxC));
    const meanMidTempMin = avg(modelValues.map((m) => m.midTempMinC));
    const meanMidTempMax = avg(modelValues.map((m) => m.midTempMaxC));
    const meanValleyTempMin = avg(modelValues.map((m) => m.valleyTempMinC));
    const meanValleyTempMax = avg(modelValues.map((m) => m.valleyTempMaxC));
    const meanPrecip = avg(modelValues.map((m) => m.precipMm));
    const windSpread = spread(modelValues.map((m) => m.summitWindKph));
    const tempSpread = spread(modelValues.map((m) => m.summitTempC));
    const precipSpread = spread(modelValues.map((m) => m.precipMm));
    days.push({
      label: `+${i + 1}`,
      date: modelValues[0].date,
      dayIndex: i + 1,
      summitWindGfsKph: Number((meanSummitWind - windSpread / 2).toFixed(1)),
      summitWindEcmwfKph: Number((meanSummitWind + windSpread / 2).toFixed(1)),
      midWindGfsKph: Number((meanMidWind - spread(modelValues.map((m) => m.midWindKph)) / 2).toFixed(1)),
      midWindEcmwfKph: Number((meanMidWind + spread(modelValues.map((m) => m.midWindKph)) / 2).toFixed(1)),
      valleyWindGfsKph: Number((meanValleyWind - spread(modelValues.map((m) => m.valleyWindKph)) / 2).toFixed(1)),
      valleyWindEcmwfKph: Number((meanValleyWind + spread(modelValues.map((m) => m.valleyWindKph)) / 2).toFixed(1)),
      summitTempGfsC: Number((meanSummitTemp - tempSpread / 2).toFixed(1)),
      summitTempEcmwfC: Number((meanSummitTemp + tempSpread / 2).toFixed(1)),
      summitTempMinAvgC: Number(meanSummitTempMin.toFixed(1)),
      summitTempMaxAvgC: Number(meanSummitTempMax.toFixed(1)),
      midTempGfsC: Number((meanMidTemp - spread(modelValues.map((m) => m.midTempC)) / 2).toFixed(1)),
      midTempEcmwfC: Number((meanMidTemp + spread(modelValues.map((m) => m.midTempC)) / 2).toFixed(1)),
      midTempMinAvgC: Number(meanMidTempMin.toFixed(1)),
      midTempMaxAvgC: Number(meanMidTempMax.toFixed(1)),
      valleyTempGfsC: Number((meanValleyTemp - spread(modelValues.map((m) => m.valleyTempC)) / 2).toFixed(1)),
      valleyTempEcmwfC: Number((meanValleyTemp + spread(modelValues.map((m) => m.valleyTempC)) / 2).toFixed(1)),
      valleyTempMinAvgC: Number(meanValleyTempMin.toFixed(1)),
      valleyTempMaxAvgC: Number(meanValleyTempMax.toFixed(1)),
      precipGfsMm: Number((meanPrecip - precipSpread / 2).toFixed(1)),
      precipEcmwfMm: Number((meanPrecip + precipSpread / 2).toFixed(1)),
      summitRainGfsMm: Number(avg(modelValues.map((m) => m.summitRainMm)).toFixed(1)),
      summitRainEcmwfMm: Number(avg(modelValues.map((m) => m.summitRainMm)).toFixed(1)),
      summitSnowGfsCm: Number(avg(modelValues.map((m) => m.summitSnowCm)).toFixed(1)),
      summitSnowEcmwfCm: Number(avg(modelValues.map((m) => m.summitSnowCm)).toFixed(1)),
      midRainGfsMm: Number(avg(modelValues.map((m) => m.midRainMm)).toFixed(1)),
      midRainEcmwfMm: Number(avg(modelValues.map((m) => m.midRainMm)).toFixed(1)),
      midSnowGfsCm: Number(avg(modelValues.map((m) => m.midSnowCm)).toFixed(1)),
      midSnowEcmwfCm: Number(avg(modelValues.map((m) => m.midSnowCm)).toFixed(1)),
      valleyRainGfsMm: Number(avg(modelValues.map((m) => m.valleyRainMm)).toFixed(1)),
      valleyRainEcmwfMm: Number(avg(modelValues.map((m) => m.valleyRainMm)).toFixed(1)),
      valleySnowGfsCm: Number(avg(modelValues.map((m) => m.valleySnowCm)).toFixed(1)),
      valleySnowEcmwfCm: Number(avg(modelValues.map((m) => m.valleySnowCm)).toFixed(1)),
      freezingLevelM: Math.round(avg(modelValues.map((m) => m.freezingLevelM))),
      pressureHpa: Math.round(avg(modelValues.map((m) => m.pressureHpa))),
      modelValues,
      modelStats: { modelCount: modelValues.length, availableModels: modelValues.map((m) => m.modelLabel), windSpreadKph: windSpread, tempSpreadC: tempSpread, precipSpreadMm: precipSpread },
    });
  }
  return days;
}

function normalizeOpenMeteoHistoryDay(row, hourly, climb, dayNumber) {
  const summary = summarizeOpenMeteoDayAtElevation(row, hourly);
  return {
    label: `D${dayNumber}`,
    date: row?.date || "",
    observedSummitWindKph: summary.windMax,
    forecastSummitWindKphThen: summary.windMax,
    observedTempC: summary.tempAvg,
    forecastTempCThen: summary.tempAvg,
    observedRainMm: summary.rainMm,
    forecastRainMmThen: summary.rainMm,
    observedSnowCm: summary.snowCm,
    forecastSnowCmThen: summary.snowCm,
    observedPrecipMm: summary.precipMm,
    forecastPrecipMmThen: summary.precipMm,
    pressureHpa: summary.pressure,
    forecastPressureHpaThen: summary.pressure,
    observedSummitTempC: summary.tempAvg,
    forecastSummitTempCThen: summary.tempAvg,
  };
}

async function fetchOpenMeteoWeather(climb) {
  const hourlyVars = "temperature_2m,precipitation,rain,snowfall,pressure_msl,wind_speed_10m";
  const elevations = getElevationProfile(climb);
  const baseForecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${climb.lat}&longitude=${climb.lon}&hourly=${hourlyVars}&forecast_days=16&wind_speed_unit=kmh&precipitation_unit=mm&timezone=auto`;
  const applicableModels = FORECAST_MODEL_CATALOG.filter((model) => modelAppliesToClimb(model, climb));
  const fetchableModels = applicableModels.filter((model) => model.fetchable);
  const today = new Date();
  const startDate = toDateString(addDays(today, -14));
  const endDate = toDateString(addDays(today, -1));
  const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${climb.lat}&longitude=${climb.lon}&start_date=${startDate}&end_date=${endDate}&hourly=${hourlyVars}&wind_speed_unit=kmh&precipitation_unit=mm&elevation=${elevations.summitM}&timezone=auto`;

  async function fetchModelElevation(model, elevationM) {
    const modelPart = model.id === "best_match" ? "" : `&models=${model.id}`;
    const response = await fetch(`${baseForecastUrl}${modelPart}&elevation=${elevationM}`);
    if (!response.ok) throw new Error(`${model.label} ${elevationM}m request failed: ${response.status}`);
    const json = await response.json();
    const rows = groupHourlyByDay(json.hourly).slice(0, Math.min(16, model.maxLeadDays || 16));
    if (!rows.length) throw new Error(`${model.label} ${elevationM}m returned no daily rows`);
    return { rows, hourly: json.hourly };
  }

  const modelResponses = await Promise.all(fetchableModels.map(async (model) => {
    try {
      const [summitData, midData, valleyData] = await Promise.all([fetchModelElevation(model, elevations.summitM), fetchModelElevation(model, elevations.midM), fetchModelElevation(model, elevations.valleyM)]);
      return { model, summitRows: summitData.rows, summitHourly: summitData.hourly, midRows: midData.rows, midHourly: midData.hourly, valleyRows: valleyData.rows, valleyHourly: valleyData.hourly, error: "" };
    } catch (error) {
      return { model, summitRows: [], summitHourly: null, midRows: [], midHourly: null, valleyRows: [], valleyHourly: null, error: error.message || "model unavailable" };
    }
  }));

  const archiveResponse = await fetch(archiveUrl);
  if (!archiveResponse.ok) throw new Error(`Open-Meteo archive request failed: ${archiveResponse.status}`);
  const archiveJson = await archiveResponse.json();
  const successfulModels = modelResponses.filter((result) => !result.error && Array.isArray(result.summitRows) && result.summitRows.length >= 3);
  if (!successfulModels.length) throw new Error("Live forecast returned no usable model data. NO DATA AVAILABLE — do not use for decision making.");
  const forecastDays = buildAggregatedForecastDays(successfulModels, climb);
  if (!forecastDays.length) throw new Error("Live forecast aggregation returned no usable forecast days. NO DATA AVAILABLE — do not use for decision making.");
  const historyDays = groupHourlyByDay(archiveJson.hourly).slice(-14).map((row, i, arr) => normalizeOpenMeteoHistoryDay(row, archiveJson.hourly, climb, i - arr.length + 1));
  const unavailableModels = [...modelResponses.filter((r) => r.error).map((r) => `${r.model.label}: unavailable`), ...applicableModels.filter((m) => !m.fetchable).map((m) => `${m.label}: backend needed`)];
  return { forecast: forecastDays, history: historyDays, source: `Live Open-Meteo at explicit elevations (${elevations.summitM}m / ${elevations.midM}m / ${elevations.valleyM}m): ${successfulModels.map((r) => r.model.label).join(", ")}`, modelResults: modelResponses, unavailableModels };
}

function seedWeather(climbId, scenarioSeed = 0) {
  const climbMeta = climbs.find((c) => c.id === climbId) || climbs[0];
  const summitM = climbMeta.summitM;
  const valleyM = climbId === "robson-kain" ? 800 : climbId === "adams-sw-chutes" ? 1700 : climbId === "temple-aemmer" ? 1800 : 1500;
  const midM = Math.round((summitM + valleyM) / 2);
  const baseSummitWind = climbId === "robson-kain" ? 38 : climbId === "adams-sw-chutes" ? 42 : climbId === "temple-aemmer" ? 36 : 30;
  const history = Array.from({ length: 14 }, (_, i) => {
    const ridge = i > 8;
    const valleyTemp = Number(((ridge ? 13 : 7) + Math.sin(i * 0.8 + scenarioSeed) * 3).toFixed(1));
    const summitTemp = estimateTempAtElevation(valleyTemp, summitM, valleyM);
    const midTemp = estimateTempAtElevation(valleyTemp, midM, valleyM);
    const wind = Math.round(baseSummitWind + (ridge ? -15 : 10) + Math.sin(i * 1.4 + scenarioSeed) * 8);
    const precip = Math.max(0, Number(((ridge ? 0.2 : 5.5) + Math.sin(i * 1.1) * 3).toFixed(1)));
    const phase = splitPrecipByTemp(precip, midTemp);
    const pressure = Math.round((ridge ? 1022 : 1004) + Math.sin(i * 0.7) * 5);
    return { label: `D${i - 13}`, observedSummitWindKph: wind, forecastSummitWindKphThen: wind, observedTempC: midTemp, forecastTempCThen: midTemp, observedRainMm: phase.rainMm, forecastRainMmThen: phase.rainMm, observedSnowCm: phase.snowCm, forecastSnowCmThen: phase.snowCm, observedPrecipMm: precip, forecastPrecipMmThen: precip, pressureHpa: pressure, forecastPressureHpaThen: pressure, observedSummitTempC: summitTemp, forecastSummitTempCThen: summitTemp };
  });
  const forecast = Array.from({ length: 20 }, (_, i) => {
    const preferredStart = climbId === "sir-donald-nw-ridge" ? 5 + (scenarioSeed % 8) : 6 + (scenarioSeed % 8);
    const approachingWindow = i >= preferredStart && i <= preferredStart + 2;
    const earlyMixed = i < 4;
    const summitWindGfs = Math.round((approachingWindow ? 22 : earlyMixed ? 44 : 34) + i * 1.2 + Math.sin(i + scenarioSeed * 0.9) * 5);
    const summitWindEcmwf = Math.round((approachingWindow ? 24 : earlyMixed ? 46 : 35) + i * 1.1 + Math.cos(i + scenarioSeed * 0.6) * 4);
    const routeWarmRockSignal = climbId === "sir-donald-nw-ridge" && approachingWindow && scenarioSeed % 4 !== 1;
    const valleyTempBase = routeWarmRockSignal ? 31 : approachingWindow ? 16 : 11;
    const valleyTempGfs = Number((valleyTempBase - i * 0.25 + Math.sin(i * 0.7) * 2).toFixed(1));
    const valleyTempEcmwf = Number((valleyTempGfs + Math.cos(i * 0.8) * 1.2).toFixed(1));
    const summitGfsTemp = estimateTempAtElevation(valleyTempGfs, summitM, valleyM);
    const summitEcmwfTemp = estimateTempAtElevation(valleyTempEcmwf, summitM, valleyM);
    const midGfsTemp = estimateTempAtElevation(valleyTempGfs, midM, valleyM);
    const midEcmwfTemp = estimateTempAtElevation(valleyTempEcmwf, midM, valleyM);
    const decaying = i >= preferredStart + 3;
    const precipGfsMm = Number(Math.max(0, (routeWarmRockSignal ? 0 : approachingWindow ? 0.1 : earlyMixed ? 2.3 : 1.0) + (decaying ? 2.5 : 0)).toFixed(1));
    const precipEcmwfMm = Number(Math.max(0, (routeWarmRockSignal ? 0 : approachingWindow ? 0.2 : earlyMixed ? 2.0 : 1.1) + (decaying ? 2.0 : 0)).toFixed(1));
    const summitGfsPrecip = splitPrecipByTemp(precipGfsMm, summitGfsTemp);
    const summitEcmwfPrecip = splitPrecipByTemp(precipEcmwfMm, summitEcmwfTemp);
    const midGfsPrecip = splitPrecipByTemp(precipGfsMm, midGfsTemp);
    const midEcmwfPrecip = splitPrecipByTemp(precipEcmwfMm, midEcmwfTemp);
    const valleyGfsPrecip = splitPrecipByTemp(precipGfsMm, valleyTempGfs);
    const valleyEcmwfPrecip = splitPrecipByTemp(precipEcmwfMm, valleyTempEcmwf);
    return { label: `+${i + 1}`, dayIndex: i + 1, summitWindGfsKph: summitWindGfs, summitWindEcmwfKph: summitWindEcmwf, midWindGfsKph: Math.round(summitWindGfs * 0.62), midWindEcmwfKph: Math.round(summitWindEcmwf * 0.62), valleyWindGfsKph: Math.round(summitWindGfs * 0.35), valleyWindEcmwfKph: Math.round(summitWindEcmwf * 0.35), valleyTempGfsC: valleyTempGfs, valleyTempEcmwfC: valleyTempEcmwf, midTempGfsC: midGfsTemp, midTempEcmwfC: midEcmwfTemp, summitTempGfsC: summitGfsTemp, summitTempEcmwfC: summitEcmwfTemp, precipGfsMm, precipEcmwfMm, summitRainGfsMm: summitGfsPrecip.rainMm, summitRainEcmwfMm: summitEcmwfPrecip.rainMm, summitSnowGfsCm: summitGfsPrecip.snowCm, summitSnowEcmwfCm: summitEcmwfPrecip.snowCm, midRainGfsMm: midGfsPrecip.rainMm, midRainEcmwfMm: midEcmwfPrecip.rainMm, midSnowGfsCm: midGfsPrecip.snowCm, midSnowEcmwfCm: midEcmwfPrecip.snowCm, valleyRainGfsMm: valleyGfsPrecip.rainMm, valleyRainEcmwfMm: valleyEcmwfPrecip.rainMm, valleySnowGfsCm: valleyGfsPrecip.snowCm, valleySnowEcmwfCm: valleyEcmwfPrecip.snowCm, freezingLevelM: Math.round((approachingWindow ? 3700 : 3500) - i * 35 + Math.sin(i * 0.8) * 140), pressureHpa: Math.round((approachingWindow ? 1028 : 1018) + Math.sin(i) * 2 - (decaying ? 5 : 0)) };
  });
  return { history, forecast };
}

function seedAvalancheHistory() {
  const problems = [["Storm slab", "Wind slab"], ["Wind slab"], ["Persistent slab", "Wind slab"], ["Persistent slab"], ["Persistent slab"], ["Persistent slab", "Cornice"], ["Persistent slab", "Wind slab"], ["Wind slab"], ["Persistent slab"], ["Persistent slab"], ["Persistent slab"], ["Wind slab"], ["Wind slab", "Cornice"], ["Persistent slab", "Wind slab"]];
  const alpineRatings = [4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3];
  return Array.from({ length: 14 }, (_, i) => ({ label: `D${i - 13}`, alpine: alpineRatings[i], treeline: Math.max(1, alpineRatings[i] - (i > 8 ? 1 : 0)), problems: problems[i], note: problems[i].includes("Persistent slab") ? "Persistent slab remains in the bulletin; consequence may exceed headline rating." : "Primary concern is recent wind loading and isolated reactive features." }));
}

function scoreWindowForDays(climb, forecastDays = []) {
  if (!climb || forecastDays.length === 0) return 0;
  const t = climb.thresholds || {};
  const windThreshold = t.maxSummitWindKph;
  const dailyPrecipThreshold = t.maxPrecipMm24h;
  const maxPrecip3Day = t.maxPrecipMm3Day ?? dailyPrecipThreshold * forecastDays.length;
  const windPenalty = forecastDays.reduce((s, d) => s + Math.max(0, (((d.summitWindGfsKph || 0) + (d.summitWindEcmwfKph || 0)) / 2 - windThreshold) * (t.windPenaltyPerKph ?? 0.08)), 0);
  const dailyPrecipPenalty = forecastDays.reduce((s, d) => s + Math.max(0, (((d.precipGfsMm || 0) + (d.precipEcmwfMm || 0)) / 2 - dailyPrecipThreshold) * (t.precipPenaltyPerMm ?? 0.5)), 0);
  const cumulativePrecip = forecastDays.reduce((s, d) => s + ((d.precipGfsMm || 0) + (d.precipEcmwfMm || 0)) / 2, 0);
  const cumulativePrecipPenalty = Math.max(0, (cumulativePrecip - maxPrecip3Day) * (t.precipPenaltyPerMm ?? 0.5));
  const freezingPenalty = forecastDays.reduce((s, d) => s + ((d.freezingLevelM < t.minFreezingLevelM || d.freezingLevelM > t.maxFreezingLevelM) ? 0.8 : 0), 0);
  const genericTemperaturePenalty = forecastDays.reduce((s, d) => {
    if (typeof t.minSummitTempC !== "number" || t.rockDryObjective) return s;
    const summitTempAvg = ((d.summitTempGfsC || 0) + (d.summitTempEcmwfC || 0)) / 2;
    const idealMin = t.idealSummitTempMinC ?? t.minSummitTempC;
    if (summitTempAvg < t.minSummitTempC) return s + Math.min(3.5, (t.minSummitTempC - summitTempAvg) * (t.coldSummitPenaltyPerC ?? 0.2) + 1.2);
    if (summitTempAvg < idealMin) return s + Math.min(1.5, (idealMin - summitTempAvg) * (t.coldSummitPenaltyPerC ?? 0.2));
    return s;
  }, 0);
  const cornCyclePenalty = t.skiCornObjective ? forecastDays.reduce((s, d) => {
    const midTempAvg = ((d.midTempGfsC || 0) + (d.midTempEcmwfC || 0)) / 2;
    const summitTempAvg = ((d.summitTempGfsC || 0) + (d.summitTempEcmwfC || 0)) / 2;
    const precipAvg = ((d.precipGfsMm || 0) + (d.precipEcmwfMm || 0)) / 2;
    let p = 0;
    if ((d.pressureHpa || 0) < (t.idealPressureHpa ?? 1020)) p += 0.35;
    if (midTempAvg < (t.idealMidTempMinC ?? -4)) p += 0.6;
    if (midTempAvg > (t.idealMidTempMaxC ?? 4)) p += 0.6;
    if (summitTempAvg > (t.idealSummitTempMaxC ?? 1)) p += 0.5;
    if (precipAvg > 0.5) p += 0.4;
    return s + p;
  }, 0) : 0;
  const dryRockPenalty = t.rockDryObjective ? forecastDays.reduce((s, d) => {
    const precipAvg = ((d.precipGfsMm || 0) + (d.precipEcmwfMm || 0)) / 2;
    const summitTempAvg = ((d.summitTempGfsC || 0) + (d.summitTempEcmwfC || 0)) / 2;
    const valleyTempAvg = ((d.valleyTempGfsC || 0) + (d.valleyTempEcmwfC || 0)) / 2;
    let p = 0;
    if (precipAvg > 0) p += 1.2 + precipAvg * 0.8;
    if (summitTempAvg < (t.minSummitTempC ?? 0)) p += Math.min(3, Math.abs(summitTempAvg - (t.minSummitTempC ?? 0)) * 0.8 + 1.0);
    if (valleyTempAvg < (t.idealValleyTempC ?? 30)) p += Math.min(2.0, ((t.idealValleyTempC ?? 30) - valleyTempAvg) * 0.12);
    return s + p;
  }, 0) : 0;
  const strictPrecipPenalty = t.strictNoPrecip && cumulativePrecip > 0 ? 0.6 : 0;
  return clampScore(10 - windPenalty - dailyPrecipPenalty - cumulativePrecipPenalty - freezingPenalty - genericTemperaturePenalty - cornCyclePenalty - dryRockPenalty - strictPrecipPenalty);
}

function scoreWindow(climb, forecast = []) { return scoreWindowForDays(climb, forecast.slice(0, 3)); }

function scoreConfidence(history = [], forecast = [], startIndex = 0) {
  const recent = history.slice(-4);
  if (!recent.length) return 0;
  const windError = avg(recent.map((d) => Math.abs((d.observedSummitWindKph || 0) - (d.forecastSummitWindKphThen || 0))));
  const tempError = avg(recent.map((d) => Math.abs((d.observedSummitTempC || 0) - (d.forecastSummitTempCThen || 0))));
  const precipError = avg(recent.map((d) => Math.abs((d.observedPrecipMm || 0) - (d.forecastPrecipMmThen || 0))));
  const forecastWindow = forecast.slice(startIndex, startIndex + 5);
  const modelSpread = avg(forecastWindow.map((d) => d.modelStats ? d.modelStats.windSpreadKph + d.modelStats.precipSpreadMm * 4 + d.modelStats.tempSpreadC * 1.5 : Math.abs((d.summitWindGfsKph || 0) - (d.summitWindEcmwfKph || 0)) + Math.abs((d.precipGfsMm || 0) - (d.precipEcmwfMm || 0)) * 4 + Math.abs((d.summitTempGfsC || 0) - (d.summitTempEcmwfC || 0)) * 1.5));
  const ridgeDaysVerified = history.slice(-5).filter((d) => d.pressureHpa >= 1018 && d.observedPrecipMm < 2).length;
  return clampScore(8.2 + ridgeDaysVerified * 0.3 - windError * 0.08 - precipError * 0.18 - tempError * 0.12 - modelSpread * 0.08 - startIndex * 0.35);
}

function findBestUpcomingWindow(climb, history = [], forecast = [], windowLength = 3) {
  if (forecast.length < windowLength) return { label: "NO DATA", windowLength: 0, leadDays: 0, quality: 0, confidence: 0 };
  const candidates = [];
  for (let start = 0; start <= forecast.length - windowLength; start += 1) {
    const days = forecast.slice(start, start + windowLength);
    const quality = scoreWindowForDays(climb, days);
    const confidence = scoreConfidence(history, forecast, start);
    candidates.push({ startDay: start + 1, endDay: start + windowLength, windowLength, leadDays: start + 1, quality, confidence, selectionScore: quality * 3 + confidence * 0.25 - (start + 1) * 0.08, label: `D+${start + 1} to D+${start + windowLength}` });
  }
  const positive = candidates.filter((c) => c.quality > 0.25);
  return (positive.length ? positive : candidates).sort((a, b) => b.selectionScore - a.selectionScore)[0];
}

function classifyPattern(history = [], forecast = []) {
  if (!history.length || forecast.length < 3) return "insufficient data";
  const recent = history.slice(-5);
  const dryDays = recent.filter((d) => d.observedPrecipMm < 2).length;
  const highPressureDays = recent.filter((d) => d.pressureHpa >= 1018).length;
  const upcomingDry = forecast.slice(0, 3).filter((d) => ((d.precipGfsMm || 0) + (d.precipEcmwfMm || 0)) / 2 < 2).length;
  const pressureTrend = (forecast[2]?.pressureHpa || 0) - (history[history.length - 1]?.pressureHpa || 0);
  if (dryDays >= 4 && highPressureDays >= 4 && upcomingDry >= 3 && pressureTrend >= -3) return "entrenched high pressure";
  if (dryDays <= 2 && upcomingDry >= 2) return "short clearing blip after storm cycle";
  if (dryDays >= 3 && pressureTrend < -5) return "decaying ridge";
  if (pressureTrend > 4) return "building ridge";
  return "unstable transition";
}

function analyzeAvalanche(avalancheHistory = []) {
  const last = avalancheHistory[avalancheHistory.length - 1] || { alpine: 0, problems: [] };
  const persistentDays = avalancheHistory.filter((d) => d.problems.includes("Persistent slab")).length;
  const windSlabDays = avalancheHistory.filter((d) => d.problems.includes("Wind slab")).length;
  const worsening = avalancheHistory.length >= 4 && avalancheHistory.slice(-3).every((d) => d.alpine >= 2) && last.alpine > avalancheHistory[avalancheHistory.length - 4].alpine;
  const headline = persistentDays >= 7 ? "Persistent slab has been present for much of the last 14 days. Treat moderate ratings with caution." : windSlabDays >= 7 ? "Wind slab has been recurring. Aspect and loading pattern matter more than the headline rating." : "No single avalanche problem dominates the last 14 days.";
  return { last, persistentDays, windSlabDays, headline, riskScore: clampScore(last.alpine * 2.2 + persistentDays * 0.25 + (worsening ? 1.2 : 0)) };
}

function scoreColor(score, inverse = false) { const v = inverse ? 10 - score : score; return v >= 7.5 ? "text-emerald-700" : v >= 5 ? "text-yellow-700" : "text-red-700"; }

function runScoringTests() {
  const robson = climbs[0];
  const history = seedWeather("robson-kain").history;
  const forecast = seedWeather("robson-kain").forecast;
  console.assert(scoreWindow(robson, forecast) >= 0, "Expected scoreWindow to return numeric score");
  console.assert(findBestUpcomingWindow(robson, history, forecast).leadDays >= 1, "Expected upcoming window detection to return a valid lead time");
  console.assert(scoreConfidence(history, forecast, 6) < scoreConfidence(history, forecast, 0), "Expected later windows to carry a lead-time confidence penalty");
  console.assert(forecast.length === 20, "Expected seeded 20-day forecast window watch data");
  const frigidRobsonWindow = [1, 2, 3].map(() => ({ summitWindGfsKph: 5, summitWindEcmwfKph: 5, summitTempGfsC: -30, summitTempEcmwfC: -30, precipGfsMm: 0, precipEcmwfMm: 0, freezingLevelM: 3600, pressureHpa: 1030 }));
  console.assert(scoreWindowForDays(robson, frigidRobsonWindow) < 7, "Expected -30C Robson summit temps to prevent a strong summer alpine score");
  const fakeModelResults = [{ model: FORECAST_MODEL_CATALOG[0], summitRows: [{ date: "2026-01-01", indices: [0] }], midRows: [{ date: "2026-01-01", indices: [0] }], valleyRows: [{ date: "2026-01-01", indices: [0] }], summitHourly: { time: ["2026-01-01T00:00"], temperature_2m: [-5], wind_speed_10m: [20], rain: [0], snowfall: [1], precipitation: [1], pressure_msl: [1015] }, midHourly: { time: ["2026-01-01T00:00"], temperature_2m: [-2], wind_speed_10m: [10], rain: [0], snowfall: [0.5], precipitation: [0.5], pressure_msl: [1016] }, valleyHourly: { time: ["2026-01-01T00:00"], temperature_2m: [2], wind_speed_10m: [5], rain: [0.5], snowfall: [0], precipitation: [0.5], pressure_msl: [1017] } }];
  const aggregated = buildAggregatedForecastDays(fakeModelResults, robson);
  console.assert(aggregated.length === 1 && aggregated[0].modelStats.modelCount === 1, "Expected multi-elevation model aggregation to produce a forecast day");
  console.assert(typeof aggregated[0].summitTempMinAvgC === "number" && typeof aggregated[0].summitTempMaxAvgC === "number", "Expected daily temperature swing fields in aggregated forecast");
  console.assert(buildAggregatedForecastDays([], robson).length === 0, "Expected empty model results to safely return empty forecast days");
}

function MetricCard({ icon: IconComponent, label, value, detail, className = "" }) {
  return <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-sm text-slate-500"><IconComponent className="h-4 w-4" />{label}</div><div className={`mt-2 text-2xl font-semibold ${className}`}>{value}</div><div className="mt-1 text-sm text-slate-500">{detail}</div></CardContent></Card>;
}

function MiniBarChart({ data = [], valueKey, labelKey = "label", unit = "", maxOverride, compareKey, compareLabel }) {
  const values = data.flatMap((d) => [Number(d[valueKey] || 0), compareKey ? Number(d[compareKey] || 0) : 0]);
  const maxValue = Math.max(maxOverride || 0, ...values, 1);
  return <div className="h-72 rounded-xl border bg-white p-4"><div className="flex h-56 items-end gap-2">{data.map((d) => { const value = Number(d[valueKey] || 0); const compareValue = compareKey ? Number(d[compareKey] || 0) : null; return <div key={d[labelKey]} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><div className="text-[10px] text-slate-500">{value}{unit}</div><div className="flex h-full w-full items-end justify-center gap-1"><div className="w-full rounded-t-lg bg-slate-800" style={{ height: `${Math.max(3, (value / maxValue) * 100)}%` }} title={`${d[labelKey]}: ${value}${unit}`} />{compareKey && <div className="w-full rounded-t-lg bg-slate-300" style={{ height: `${Math.max(3, ((compareValue || 0) / maxValue) * 100)}%` }} title={`${d[labelKey]} ${compareLabel}: ${compareValue}${unit}`} />}</div></div>; })}</div><div className="mt-2 grid" style={{ gridTemplateColumns: `repeat(${data.length || 1}, minmax(0, 1fr))` }}>{data.map((d) => <div key={d[labelKey]} className="truncate text-center text-[10px] text-slate-500">{d[labelKey]}</div>)}</div>{compareKey && <div className="mt-2 flex gap-3 text-xs text-slate-600"><span><span className="inline-block h-2 w-4 rounded bg-slate-800" /> Observed</span><span><span className="inline-block h-2 w-4 rounded bg-slate-300" /> Originally forecast</span></div>}</div>;
}

function MiniLineChart({ data = [], series = [], labelKey = "label", minOverride, maxOverride }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const width = 720, height = 230, padding = 28;
  const allValues = series.flatMap((s) => data.map((d) => Number(d[s.key] || 0)));
  const minValue = minOverride ?? Math.min(...allValues, 0);
  const maxValue = maxOverride ?? Math.max(...allValues, 1);
  const range = Math.max(1, maxValue - minValue);
  const xFor = (i) => padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2);
  const yFor = (value) => height - padding - ((value - minValue) / range) * (height - padding * 2);
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;
  function handleMouseMove(event) { if (!data.length) return; const rect = event.currentTarget.getBoundingClientRect(); const x = ((event.clientX - rect.left) / rect.width) * width; const ratio = Math.max(0, Math.min(1, (x - padding) / (width - padding * 2))); setHoverIndex(Math.round(ratio * (data.length - 1))); }
  return <div className="relative h-72 rounded-xl border bg-white p-3"><svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full cursor-crosshair" preserveAspectRatio="none" onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIndex(null)}>{[0, 0.25, 0.5, 0.75, 1].map((t) => <line key={t} x1={padding} x2={width - padding} y1={padding + t * (height - padding * 2)} y2={padding + t * (height - padding * 2)} stroke="currentColor" className="text-slate-200" strokeWidth="1" />)}{series.map((s, seriesIndex) => { const points = data.map((d, i) => `${xFor(i)},${yFor(Number(d[s.key] || 0))}`).join(" "); const dash = seriesIndex === 1 ? "6 6" : seriesIndex === 2 ? "3 6" : ""; return <polyline key={s.key} points={points} fill="none" stroke="currentColor" className={s.className || "text-slate-800"} strokeWidth="3" strokeDasharray={dash} vectorEffect="non-scaling-stroke" />; })}{hoverIndex !== null && <><line x1={xFor(hoverIndex)} x2={xFor(hoverIndex)} y1={padding} y2={height - padding} stroke="currentColor" className="text-slate-400" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />{series.map((s) => { const value = Number(data[hoverIndex]?.[s.key] || 0); return <circle key={s.key} cx={xFor(hoverIndex)} cy={yFor(value)} r="5" fill="white" stroke="currentColor" className={s.className || "text-slate-800"} strokeWidth="3" vectorEffect="non-scaling-stroke" />; })}</>}</svg><div className="grid" style={{ gridTemplateColumns: `repeat(${data.length || 1}, minmax(0, 1fr))` }}>{data.map((d, index) => <div key={d[labelKey]} className={`truncate text-center text-[10px] ${hoverIndex === index ? "font-semibold text-slate-900" : "text-slate-500"}`}>{d[labelKey]}</div>)}</div><div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">{series.map((s, i) => <div key={s.key} className="flex items-center gap-1"><span className={`inline-block h-2 w-6 rounded ${i === 1 ? "border-t-2 border-dashed border-slate-500" : i === 2 ? "border-t-2 border-dotted border-slate-400" : "bg-slate-800"}`} />{s.label}</div>)}</div>{hovered && <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg"><div className="mb-1 font-semibold text-slate-900">{hovered[labelKey]} {hovered.date ? `· ${hovered.date}` : ""}</div>{series.map((s) => { const raw = Number(hovered[s.key] || 0); const value = Number.isInteger(raw) ? raw : raw.toFixed(1); return <div key={s.key} className="text-slate-700">{s.label}: <strong>{value}{s.unit ? ` ${s.unit}` : ""}</strong></div>; })}</div>}</div>;
}

function WindowTimeline({ forecast = [], bestWindow, source }) {
  const dayCount = forecast.length;
  return <div className="rounded-2xl border bg-white p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-semibold">{dayCount}-day window watch</h3><p className="text-sm text-slate-500">Designed to show a window approaching and confidence increasing as it moves closer.</p><p className="mt-1 text-xs text-slate-400">Source: {source}</p></div><Badge variant="secondary">Best: {bestWindow.label} ({bestWindow.windowLength} days)</Badge></div><div className="overflow-x-auto pb-2"><div className="grid gap-2" style={{ minWidth: `${Math.max(1120, dayCount * 108)}px`, gridTemplateColumns: `repeat(${dayCount || 1}, minmax(0, 1fr))` }}>{forecast.map((d, i) => { const avgPrecip = (((d.precipGfsMm || 0) + (d.precipEcmwfMm || 0)) / 2).toFixed(1); const avgWind = Math.round(((d.summitWindGfsKph || 0) + (d.summitWindEcmwfKph || 0)) / 2); const avgTemp = (((d.summitTempGfsC || 0) + (d.summitTempEcmwfC || 0)) / 2).toFixed(1); const tempMin = typeof d.summitTempMinAvgC === "number" ? d.summitTempMinAvgC.toFixed(1) : "—"; const tempMax = typeof d.summitTempMaxAvgC === "number" ? d.summitTempMaxAvgC.toFixed(1) : "—"; const inBest = i + 1 >= bestWindow.startDay && i + 1 <= bestWindow.endDay; return <div key={d.label} className={`rounded-xl border p-2 text-center text-xs ${inBest ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><div className="font-semibold">{d.label}</div><div className="text-[10px] text-slate-400">{d.date || ""}</div><div className="mt-1 text-slate-600">Wind {avgWind} kph</div><div className="text-slate-600">Avg {avgTemp}°C</div><div className="text-slate-600">Swing {tempMin} / {tempMax}°C</div><div className="text-slate-600">Precip {avgPrecip} mm</div><div className="text-slate-600">Models {d.modelStats?.modelCount || 1}</div><div className="text-[10px] text-slate-500">±{Math.round((d.modelStats?.windSpreadKph || 0) / 2)} kph · ±{((d.modelStats?.tempSpreadC || 0) / 2).toFixed(1)}°C</div></div>; })}</div></div></div>;
}

function ModelAvailabilityPanel({ forecast = [], climb, unavailableModels = [] }) {
  const applicableModels = FORECAST_MODEL_CATALOG.filter((model) => modelAppliesToClimb(model, climb));
  return <Card><CardContent className="p-5"><h3 className="mb-2 font-semibold">Model availability and agreement</h3><p className="mb-4 text-sm text-slate-500">Closer windows should use more short-range models. Empty cells mean that model is outside its useful lead time or unavailable from the current browser connector.</p><div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[1100px] text-xs"><thead className="bg-slate-100 text-left text-slate-600"><tr><th className="p-2">Model</th><th className="p-2">Provider</th>{forecast.map((day) => <th key={day.label} className="p-2 text-center">{day.label}</th>)}</tr></thead><tbody>{applicableModels.map((model) => <tr key={model.id} className="border-t"><td className="p-2 font-medium">{model.label}</td><td className="p-2 text-slate-500">{model.provider}</td>{forecast.map((day) => { const value = day.modelValues?.find((m) => m.modelId === model.id); const withinLead = day.dayIndex <= model.maxLeadDays; return <td key={`${model.id}-${day.label}`} className="p-2 text-center">{value ? <div className="rounded-lg bg-emerald-50 px-1 py-1 text-[10px] text-emerald-900">{Math.round(value.summitWindKph)}kph<br />{value.summitTempC.toFixed(1)}°C<br />{value.precipMm.toFixed(1)}mm</div> : withinLead ? <span className="text-red-600">unavail</span> : <span className="text-slate-300">—</span>}</td>; })}</tr>)}</tbody></table></div>{unavailableModels.length > 0 && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Unavailable/planned: {unavailableModels.join("; ")}</div>}</CardContent></Card>;
}

function getAvailableModelLabels(forecast = []) {
  const labels = [];
  forecast.forEach((day) => (day.modelValues || []).forEach((model) => {
    if (!labels.find((item) => item.id === model.modelId)) labels.push({ id: model.modelId, label: model.modelLabel });
  }));
  return labels;
}

function RawModelLineChart({ forecast = [], metricKey, title, unit, note }) {
  const modelLabels = getAvailableModelLabels(forecast);
  const classNames = ["text-slate-900", "text-emerald-700", "text-blue-700", "text-amber-700", "text-purple-700", "text-rose-700", "text-cyan-700", "text-lime-700"];
  const data = forecast.map((day) => {
    const row = { label: day.label, date: day.date };
    modelLabels.forEach((model) => {
      const value = day.modelValues?.find((item) => item.modelId === model.id)?.[metricKey];
      row[model.id] = typeof value === "number" ? Number(value.toFixed(1)) : null;
    });
    return row;
  });
  const series = modelLabels.map((model, index) => ({ key: model.id, label: model.label, unit, className: classNames[index % classNames.length] }));
  return <Card><CardContent className="p-5"><h3 className="mb-2 font-semibold">{title}</h3>{note && <p className="mb-3 text-sm text-slate-500">{note}</p>}<MiniLineChart data={data} series={series} /></CardContent></Card>;
}

function AlertRulePanel({ climb, mode, setMode }) {
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [email, setEmail] = useState("rory@example.com");
  const [phone, setPhone] = useState("+1 250 555 0100");
  const [activeFrom, setActiveFrom] = useState(climb.activeFromMonth || 1);
  const [minQuality, setMinQuality] = useState(8);
  const [minConfidence, setMinConfidence] = useState(5.5);
  useEffect(() => { setActiveFrom(climb.activeFromMonth || 1); if (climb.defaultMode) setMode(climb.defaultMode); }, [climb.id]);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return <Card><CardContent className="p-5"><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h3 className="font-semibold">Objective-specific alert rule</h3><p className="text-sm text-slate-500">Set different timing and contact methods for each objective.</p></div><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={alertEnabled} onChange={(e) => setAlertEnabled(e.target.checked)} /> Alert enabled</label></div><div className="grid gap-4 md:grid-cols-3"><div><label className="mb-1 block text-xs font-medium text-slate-500">Objective</label><div className="rounded-xl border bg-slate-50 px-3 py-2 text-sm">{climb.name}</div></div><div><label className="mb-1 block text-xs font-medium text-slate-500">Window type</label><SelectBox className="w-full" value={mode} onChange={setMode} options={[{ value: "summer", label: "Summer alpine" }, { value: "winter", label: "Winter / ski" }]} /></div><div><label className="mb-1 block text-xs font-medium text-slate-500">Start watching</label><SelectBox className="w-full" value={String(activeFrom)} onChange={(v) => setActiveFrom(Number(v))} options={months.map((m, i) => ({ value: String(i + 1), label: m }))} /></div><div><label className="mb-1 block text-xs font-medium text-slate-500">Minimum window quality</label><input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" type="number" min="0" max="10" step="0.5" value={minQuality} onChange={(e) => setMinQuality(e.target.value)} /></div><div><label className="mb-1 block text-xs font-medium text-slate-500">Minimum confidence</label><input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" type="number" min="0" max="10" step="0.5" value={minConfidence} onChange={(e) => setMinConfidence(e.target.value)} /></div><div><label className="mb-1 block text-xs font-medium text-slate-500">Delivery methods</label><div className="flex flex-wrap gap-3 rounded-xl border bg-slate-50 px-3 py-2 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} /> Email</label><label className="flex items-center gap-2"><input type="checkbox" checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} /> Text</label></div></div><div><label className="mb-1 block text-xs font-medium text-slate-500">Email</label><input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} /></div><div><label className="mb-1 block text-xs font-medium text-slate-500">Text message number</label><input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} /></div><div className="flex items-end"><Button className="w-full" onClick={async () => {
    try {
      const message = `Mountain Window Test Alert: ${climb.name} ${mode} window watch. Quality threshold ${minQuality}, confidence threshold ${minConfidence}.`;
      const response = await fetch("/api/send-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailEnabled ? email : "",
          phone: smsEnabled ? phone : "",
          message,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Alert failed to send");
      alert("Test alert sent.");
    } catch (error) {
      console.error(error);
      alert(`Alert failed: ${error.message || "unknown error"}`);
    }
  }}>Send test alert</Button></div></div><div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">Example rule: watch <strong>{mode}</strong> windows for <strong>{climb.name}</strong> starting in <strong>{months[activeFrom - 1]}</strong>; notify by {emailEnabled && smsEnabled ? "email and text" : emailEnabled ? "email" : smsEnabled ? "text" : "no delivery method selected"} when quality ≥ {minQuality} and confidence ≥ {minConfidence}.<div className="mt-2 font-medium text-amber-800">Test alerts can now send through /api/send-alert. Scheduled automatic alerts still require the cron/check-alert workflow.</div></div></CardContent></Card>;
}

function MapPickerPlaceholder({ onSelect }) {
  return <Card><CardContent className="p-5"><div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-semibold">Select from map</h3><p className="text-sm text-slate-500">Prototype placeholder: click a route card on the map area. Later this becomes an actual map with route pins.</p></div><Badge variant="secondary">Map mode</Badge></div><div className="relative h-72 overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-200 via-slate-100 to-emerald-100 p-4">{climbs.map((c, i) => <button key={c.id} onClick={() => onSelect(c.id)} className="absolute rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-left text-xs shadow hover:bg-white" style={{ left: `${8 + (i % 3) * 30}%`, top: `${24 + Math.floor(i / 3) * 28}%` }}><div className="font-semibold text-slate-900">{c.name.split(" — ")[0]}</div><div className="text-slate-500">{c.region}</div></button>)}</div></CardContent></Card>;
}

function TabButton({ active, onClick, children }) { return <button onClick={onClick} className={`rounded-xl px-3 py-2 text-sm font-medium ${active ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-100"}`}>{children}</button>; }

export default function MountainWindowApp() {
  useEffect(() => { runScoringTests(); }, []);
  const [climbId, setClimbId] = useState("robson-kain");
  const [mode, setMode] = useState("winter");
  const [tab, setTab] = useState("forecast");
  const [forecastSeed, setForecastSeed] = useState(0);
  const [liveWeather, setLiveWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const avalancheHistory = useMemo(() => seedAvalancheHistory(), []);
  const selectedClimbId = climbId === "map" ? "robson-kain" : climbId;
  const climb = climbs.find((c) => c.id === selectedClimbId) || climbs[0];
  const hasLiveData = !!liveWeather && !weatherError;
  const history = hasLiveData ? liveWeather.history : [];
  const forecast = hasLiveData ? liveWeather.forecast : [];
  const source = hasLiveData ? liveWeather.source : "NO DATA";
  const unavailableModels = hasLiveData ? liveWeather.unavailableModels || [] : [];

  useEffect(() => {
    let cancelled = false;
    setWeatherLoading(true);
    setWeatherError("");
    fetchOpenMeteoWeather(climb).then((data) => { if (!cancelled) setLiveWeather(data); }).catch((error) => { console.error(error); if (!cancelled) { setLiveWeather(null); setWeatherError(error.message || "Live weather fetch failed. NO DATA AVAILABLE — do not use for decision making."); } }).finally(() => { if (!cancelled) setWeatherLoading(false); });
    return () => { cancelled = true; };
  }, [climb.id, forecastSeed]);

  const windowQuality = useMemo(() => hasLiveData ? scoreWindow(climb, forecast) : 0, [climb, forecast, hasLiveData]);
  const confidence = useMemo(() => hasLiveData ? scoreConfidence(history, forecast, 0) : 0, [history, forecast, hasLiveData]);
  const pattern = useMemo(() => hasLiveData ? classifyPattern(history, forecast) : "NO DATA", [history, forecast, hasLiveData]);
  const avalanche = useMemo(() => analyzeAvalanche(avalancheHistory), [avalancheHistory]);
  const bestWindow = useMemo(() => hasLiveData ? findBestUpcomingWindow(climb, history, forecast) : { label: "NO DATA", windowLength: 0, leadDays: 0, quality: 0, confidence: 0 }, [climb, history, forecast, hasLiveData]);
  const recommendation = useMemo(() => {
    if (!hasLiveData) return "NO DATA — live weather could not be retrieved. Do not use this tool for decision making.";
    if (climb.id === "sir-donald-nw-ridge" && bestWindow.quality >= 7) return `Sir Donald watch: ${bestWindow.label} is the better dry-rock signal. For NW Ridge, require no precip and summit temperatures above freezing; icy rock should heavily downgrade the window.`;
    if (climb.id === "adams-sw-chutes" && bestWindow.quality >= 7.5) return `SW Chutes watch: ${bestWindow.label} may have the better corn-cycle signal. Look for clear sky, light wind, overnight refreeze, and controlled daytime softening rather than new snow.`;
    if (bestWindow.leadDays >= 6 && bestWindow.quality >= 8 && bestWindow.confidence >= 5.5) return `Early signal: a strong ${bestWindow.label} window may be forming. This is not actionable yet, but it is worth watching closely.`;
    if (mode === "winter" && avalanche.riskScore >= 7) return "Weather may be improving, but avalanche context is still a primary constraint. Manual bulletin review required.";
    if (windowQuality >= 8 && confidence >= 7) return "Potential window forming. Next 48–72 hours deserve close manual review.";
    if (windowQuality >= 6) return "Marginal or route-dependent window. Watch model convergence and recent observations.";
    return "No strong immediate window identified. Keep monitoring for model agreement and pressure trend changes.";
  }, [mode, avalanche.riskScore, windowQuality, confidence, bestWindow, climb.id, hasLiveData]);

  const combinedChart = forecast.map((d) => ({ label: d.label, date: d.date, summitWindAvg: Math.round(((d.summitWindGfsKph || 0) + (d.summitWindEcmwfKph || 0)) / 2), midWindAvg: Math.round(((d.midWindGfsKph || 0) + (d.midWindEcmwfKph || 0)) / 2), valleyWindAvg: Math.round(((d.valleyWindGfsKph || 0) + (d.valleyWindEcmwfKph || 0)) / 2), summitTempAvg: Number((((d.summitTempGfsC || 0) + (d.summitTempEcmwfC || 0)) / 2).toFixed(1)), summitTempMinAvg: d.summitTempMinAvgC ?? Number((((d.summitTempGfsC || 0) + (d.summitTempEcmwfC || 0)) / 2).toFixed(1)), summitTempMaxAvg: d.summitTempMaxAvgC ?? Number((((d.summitTempGfsC || 0) + (d.summitTempEcmwfC || 0)) / 2).toFixed(1)), midTempAvg: Number((((d.midTempGfsC || 0) + (d.midTempEcmwfC || 0)) / 2).toFixed(1)), midTempMinAvg: d.midTempMinAvgC ?? Number((((d.midTempGfsC || 0) + (d.midTempEcmwfC || 0)) / 2).toFixed(1)), midTempMaxAvg: d.midTempMaxAvgC ?? Number((((d.midTempGfsC || 0) + (d.midTempEcmwfC || 0)) / 2).toFixed(1)), valleyTempAvg: Number((((d.valleyTempGfsC || 0) + (d.valleyTempEcmwfC || 0)) / 2).toFixed(1)), valleyTempMinAvg: d.valleyTempMinAvgC ?? Number((((d.valleyTempGfsC || 0) + (d.valleyTempEcmwfC || 0)) / 2).toFixed(1)), valleyTempMaxAvg: d.valleyTempMaxAvgC ?? Number((((d.valleyTempGfsC || 0) + (d.valleyTempEcmwfC || 0)) / 2).toFixed(1)), summitRainAvg: Number((((d.summitRainGfsMm || 0) + (d.summitRainEcmwfMm || 0)) / 2).toFixed(1)), summitSnowAvg: Number((((d.summitSnowGfsCm || 0) + (d.summitSnowEcmwfCm || 0)) / 2).toFixed(1)), midRainAvg: Number((((d.midRainGfsMm || 0) + (d.midRainEcmwfMm || 0)) / 2).toFixed(1)), midSnowAvg: Number((((d.midSnowGfsCm || 0) + (d.midSnowEcmwfCm || 0)) / 2).toFixed(1)), valleyRainAvg: Number((((d.valleyRainGfsMm || 0) + (d.valleyRainEcmwfMm || 0)) / 2).toFixed(1)), valleySnowAvg: Number((((d.valleySnowGfsCm || 0) + (d.valleySnowEcmwfCm || 0)) / 2).toFixed(1)), pressureHpa: d.pressureHpa || 0, freezingLevelM: d.freezingLevelM || 0 }));

  return <div className="min-h-screen bg-slate-50 p-4 md:p-8"><div className="mx-auto max-w-7xl space-y-6"><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="flex items-center gap-2 text-sm font-medium text-slate-600"><MountainIcon /> Mountain Window Intelligence</div><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Weather + Avalanche Window Prototype</h1><p className="mt-2 max-w-3xl text-slate-600">Decision-support dashboard for identifying possible alpine climbing and ski mountaineering windows. This version pulls live Open-Meteo forecast/archive data at explicit summit, mid, and valley elevations. If live data is unavailable, the app shows NO DATA and disables scoring.</p></div><div className="flex flex-col gap-2 sm:flex-row"><SelectBox className="w-[280px]" value={climbId} onChange={(value) => { setClimbId(value); if (value === "map") setTab("map"); }} options={[{ value: "map", label: "Select from map…" }, ...climbs.map((c) => ({ value: c.id, label: c.name }))]} /><SelectBox className="w-[180px]" value={mode} onChange={setMode} options={[{ value: "summer", label: "Summer alpine" }, { value: "winter", label: "Winter / ski" }]} /></div></div>

  <Card><CardContent className="p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="text-xl font-semibold text-slate-950">{climb.name}</h2><p className="text-sm text-slate-600">{climb.region} · {climb.summitM} m · {climb.lat.toFixed(3)}, {climb.lon.toFixed(3)} · {climb.style}</p></div><div className="flex flex-wrap gap-2"><Badge variant="secondary">Pattern: {pattern}</Badge><Badge variant="secondary">Best watch: {bestWindow.label} ({bestWindow.windowLength} days)</Badge><Badge variant="outline">Mode: {mode}</Badge><Badge>Manual review required</Badge><button onClick={() => { setLiveWeather(null); setForecastSeed((seed) => seed + 1); }} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">{weatherLoading ? "Loading…" : "Refresh live forecast"}</button></div></div></CardContent></Card>

  <div className="grid gap-4 md:grid-cols-5"><MetricCard icon={SunIcon} label="Immediate Window" value={hasLiveData ? `${windowQuality.toFixed(1)} / 10` : "NO DATA"} detail="Next 72 hrs only" className={scoreColor(windowQuality)} /><MetricCard icon={TrendIcon} label="Best Upcoming Window" value={hasLiveData ? `${bestWindow.quality.toFixed(1)} / 10` : "NO DATA"} detail={hasLiveData ? `${bestWindow.label} · ${bestWindow.windowLength} days · ${bestWindow.leadDays} days lead · live scan` : "NO DATA"} className={scoreColor(bestWindow.quality)} /><MetricCard icon={GaugeIcon} label="Forecast Confidence" value={hasLiveData ? `${bestWindow.confidence.toFixed(1)} / 10` : "NO DATA"} detail="Includes lead-time penalty + model spread" className={scoreColor(bestWindow.confidence)} /><MetricCard icon={ShieldIcon} label="Avalanche Risk Context" value={`${avalanche.riskScore.toFixed(1)} / 10`} detail={mode === "winter" ? avalanche.headline : "Hidden in summer mode"} className={scoreColor(avalanche.riskScore, true)} /><MetricCard icon={TrendIcon} label="Pattern State" value={hasLiveData ? pattern : "NO DATA"} detail="14-day lookback + forecast" /></div>

  <Card><CardContent className="p-5"><div className="flex gap-3"><AlertIcon className="mt-1 h-5 w-5 text-amber-600" /><div><h3 className="font-semibold text-slate-950">Interpretation</h3><p className="mt-1 text-slate-700">{recommendation}</p><p className="mt-2 text-sm text-slate-500">The app should alert on “possible window forming,” not “safe to go.” Final decisions require human review of route conditions, recent observations, avalanche problems, glacier hazards, and team capability.</p></div></div></CardContent></Card>

  {weatherError && <div className="rounded-2xl border border-red-500 bg-red-50 p-6 text-sm text-red-900"><strong>DATA ERROR — DO NOT USE THIS TOOL</strong><div className="mt-2">{weatherError}</div><div className="mt-2">Live weather data could not be retrieved. All scoring, windows, and recommendations are disabled.</div></div>}
  {hasLiveData && <><WindowTimeline forecast={forecast} bestWindow={bestWindow} source={source} /><div className="grid gap-4 lg:grid-cols-2"><RawModelLineChart forecast={forecast} metricKey="summitTempC" unit="°C" title="Raw model traces: summit temperature" note="These are the actual per-model summit-elevation values returned by the current connector, not the aggregate score input." /><RawModelLineChart forecast={forecast} metricKey="summitWindKph" unit="kph" title="Raw model traces: summit wind" note="Use this to see whether models are converging or whether the aggregate is hiding disagreement." /></div><ModelAvailabilityPanel forecast={forecast} climb={climb} unavailableModels={unavailableModels} /></>}
  <AlertRulePanel climb={climb} mode={mode} setMode={setMode} />

  <div className="grid grid-cols-6 gap-2 rounded-2xl bg-white p-1 shadow-sm"><TabButton active={tab === "forecast"} onClick={() => setTab("forecast")}>Forecast</TabButton><TabButton active={tab === "lookback"} onClick={() => setTab("lookback")}>14-day lookback</TabButton><TabButton active={tab === "avalanche"} onClick={() => setTab("avalanche")}>Avalanche</TabButton><TabButton active={tab === "alerts"} onClick={() => setTab("alerts")}>Alerts</TabButton><TabButton active={tab === "map"} onClick={() => setTab("map")}>Map</TabButton><TabButton active={tab === "logic"} onClick={() => setTab("logic")}>Scoring logic</TabButton></div>

  {tab === "forecast" && <div className="grid gap-4 lg:grid-cols-2"><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><WindIcon /> Live forecast: wind by elevation</h3><p className="mb-3 text-sm text-slate-500">Wind is requested from the model at summit, mid-mountain, and valley elevations. Route scoring currently uses the summit-elevation model layer.</p><MiniLineChart data={combinedChart} series={[{ key: "summitWindAvg", label: "Summit wind", unit: "kph", className: "text-slate-900" }, { key: "midWindAvg", label: "Mid-mountain wind", unit: "kph", className: "text-slate-500" }, { key: "valleyWindAvg", label: "Valley wind", unit: "kph", className: "text-slate-400" }]} minOverride={0} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><SunIcon /> Live forecast: temperature by elevation</h3><MiniLineChart data={combinedChart} series={[{ key: "summitTempAvg", label: "Summit avg", unit: "°C", className: "text-slate-900" }, { key: "summitTempMinAvg", label: "Summit low", unit: "°C", className: "text-slate-500" }, { key: "summitTempMaxAvg", label: "Summit high", unit: "°C", className: "text-slate-400" }]} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><RainIcon /> Live forecast: rain by elevation</h3><MiniLineChart data={combinedChart} series={[{ key: "summitRainAvg", label: "Summit rain", unit: "mm", className: "text-slate-900" }, { key: "midRainAvg", label: "Mid-mountain rain", unit: "mm", className: "text-slate-500" }, { key: "valleyRainAvg", label: "Valley rain", unit: "mm", className: "text-slate-400" }]} minOverride={0} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><SnowIcon /> Live forecast: snow by elevation</h3><MiniLineChart data={combinedChart} series={[{ key: "summitSnowAvg", label: "Summit snow", unit: "cm", className: "text-slate-900" }, { key: "midSnowAvg", label: "Mid-mountain snow", unit: "cm", className: "text-slate-500" }, { key: "valleySnowAvg", label: "Valley snow", unit: "cm", className: "text-slate-400" }]} minOverride={0} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><MountainIcon /> Live forecast: freezing level</h3><MiniLineChart data={combinedChart} series={[{ key: "freezingLevelM", label: "Freezing level", unit: "m", className: "text-slate-900" }]} minOverride={0} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><GaugeIcon /> Live forecast: pressure</h3><MiniLineChart data={combinedChart} series={[{ key: "pressureHpa", label: "Pressure", unit: "hPa", className: "text-slate-900" }]} /></CardContent></Card></div>}

  {tab === "lookback" && <div className="grid gap-4 lg:grid-cols-2"><Card><CardContent className="p-5"><h3 className="mb-4 font-semibold">Observed vs originally forecast wind</h3><MiniLineChart data={history} series={[{ key: "observedSummitWindKph", label: "Observed wind", unit: "kph", className: "text-slate-900" }, { key: "forecastSummitWindKphThen", label: "Originally forecast wind", unit: "kph", className: "text-slate-500" }]} minOverride={0} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 font-semibold">Observed vs originally forecast temperature</h3><MiniLineChart data={history} series={[{ key: "observedTempC", label: "Observed temp", unit: "°C", className: "text-slate-900" }, { key: "forecastTempCThen", label: "Originally forecast temp", unit: "°C", className: "text-slate-500" }]} /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 font-semibold">Observed vs originally forecast rain</h3><MiniBarChart data={history} valueKey="observedRainMm" compareKey="forecastRainMmThen" compareLabel="Originally forecast rain" unit=" mm" /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 font-semibold">Observed vs originally forecast snow</h3><MiniBarChart data={history} valueKey="observedSnowCm" compareKey="forecastSnowCmThen" compareLabel="Originally forecast snow" unit=" cm" /></CardContent></Card><Card><CardContent className="p-5"><h3 className="mb-4 font-semibold">Observed vs originally forecast pressure</h3><MiniLineChart data={history} series={[{ key: "pressureHpa", label: "Observed pressure", unit: "hPa", className: "text-slate-900" }, { key: "forecastPressureHpaThen", label: "Originally forecast pressure", unit: "hPa", className: "text-slate-500" }]} /></CardContent></Card></div>}

  {tab === "avalanche" && <div className="grid gap-4 lg:grid-cols-3"><Card className="lg:col-span-2"><CardContent className="p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><SnowIcon /> 14-day avalanche bulletin history</h3><div className="mb-3 flex flex-wrap gap-2 text-xs"><DangerBadge rating={1} /><DangerBadge rating={2} /><DangerBadge rating={3} /><DangerBadge rating={4} /><DangerBadge rating={5} /></div><div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-100 text-left text-slate-600"><tr><th className="p-3">Day</th><th className="p-3">Alpine</th><th className="p-3">Treeline</th><th className="p-3">Problems</th><th className="p-3">Note</th></tr></thead><tbody>{avalancheHistory.map((d) => <tr key={d.label} className="border-t"><td className="p-3 font-medium">{d.label}</td><td className="p-3"><DangerBadge rating={d.alpine} /></td><td className="p-3"><DangerBadge rating={d.treeline} /></td><td className="p-3">{d.problems.join(", ")}</td><td className="p-3 text-slate-600">{d.note}</td></tr>)}</tbody></table></div></CardContent></Card><Card><CardContent className="space-y-4 p-5"><h3 className="font-semibold">Avalanche pattern summary</h3><div><div className="text-sm text-slate-500">Current alpine rating</div><div className="mt-1"><DangerBadge rating={avalanche.last.alpine} /></div></div><div><div className="text-sm text-slate-500">Persistent slab days</div><div className="text-2xl font-semibold">{avalanche.persistentDays} / 14</div></div><div><div className="text-sm text-slate-500">Wind slab days</div><div className="text-2xl font-semibold">{avalanche.windSlabDays} / 14</div></div><p className="text-sm text-slate-700">{avalanche.headline}</p></CardContent></Card></div>}
  {tab === "alerts" && <AlertRulePanel climb={climb} mode={mode} setMode={setMode} />}
  {tab === "map" && <MapPickerPlaceholder onSelect={(id) => { setClimbId(id); setTab("forecast"); }} />}
  {tab === "logic" && <Card><CardContent className="space-y-5 p-5"><div><h3 className="font-semibold">How the prototype scores a window</h3><p className="mt-1 text-slate-600">The app separates immediate 72-hour conditions from live long-range window-watch conditions. All configured Open-Meteo-accessible models are attempted; unavailable products are shown explicitly as unavailable/planned, with NO DATA shown if the API is unavailable.</p></div><div className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl border p-4"><h4 className="font-medium">Immediate Window</h4><p className="mt-2 text-sm text-slate-600">Scores only the next 72 hours.</p></div><div className="rounded-2xl border p-4"><h4 className="font-medium">Best Upcoming Window</h4><p className="mt-2 text-sm text-slate-600">Slides a standard 3-day window across the available live forecast.</p></div><div className="rounded-2xl border p-4"><h4 className="font-medium">Forecast Confidence</h4><p className="mt-2 text-sm text-slate-600">Uses recent verification, model spread, and a lead-time penalty.</p></div></div><div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700"><strong>Next implementation step:</strong> move the Open-Meteo fetch into a backend, add persistent alert rules, and wire email/SMS sending. The alert form can send a manual test alert through /api/send-alert. Scheduled automatic alerts still require persisted alert rules and the cron/check-alert workflow. Current weather fields are modelled near-surface values requested at explicit summit/mid/valley elevations; they are not the same thing as an official point forecast from NWS, SpotWX, Windy, or a dedicated mountain forecast product.</div></CardContent></Card>}
  <div className="flex flex-wrap gap-2"><Button>Create alert rule</Button><Button variant="outline">Export window report</Button><Button variant="outline">Add climb</Button></div>
  </div></div>;
}
