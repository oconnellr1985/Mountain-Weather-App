import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LAPSE_RATE_C_PER_1000M = 6.5;

type ModelConfig = {
  id: string;
  label: string;
  provider: string;
  endpoint: string;
  modelsParam?: string;
  maxLeadDays: number;
  regions: string[];
};

const MODEL_CATALOG: ModelConfig[] = [
  { id: "gfs", label: "GFS", provider: "NOAA via Open-Meteo", endpoint: "https://api.open-meteo.com/v1/gfs", modelsParam: "gfs_global", maxLeadDays: 16, regions: ["global"] },
  { id: "hrrr", label: "HRRR", provider: "NOAA via Open-Meteo", endpoint: "https://api.open-meteo.com/v1/gfs", modelsParam: "gfs_hrrr", maxLeadDays: 2, regions: ["usa"] },
  { id: "gem_global", label: "GEM Global / GDPS", provider: "ECCC via Open-Meteo", endpoint: "https://api.open-meteo.com/v1/gem", modelsParam: "gem_global", maxLeadDays: 10, regions: ["global"] },
  { id: "gem_regional", label: "GEM Regional / RDPS", provider: "ECCC via Open-Meteo", endpoint: "https://api.open-meteo.com/v1/gem", modelsParam: "gem_regional", maxLeadDays: 3.5, regions: ["canada"] },
  { id: "gem_hrdps_continental", label: "HRDPS Continental", provider: "ECCC via Open-Meteo", endpoint: "https://api.open-meteo.com/v1/gem", modelsParam: "gem_hrdps_continental", maxLeadDays: 2, regions: ["canada"] },
  { id: "ecmwf_ifs", label: "ECMWF IFS", provider: "ECMWF via Open-Meteo", endpoint: "https://api.open-meteo.com/v1/ecmwf", modelsParam: "ifs04", maxLeadDays: 15, regions: ["global"] },
  { id: "ecmwf_aifs", label: "ECMWF AIFS", provider: "ECMWF via Open-Meteo", endpoint: "https://api.open-meteo.com/v1/ecmwf", modelsParam: "aifs025_single", maxLeadDays: 15, regions: ["global"] },
];

function appliesToRegion(model: ModelConfig, region: string) {
  return model.regions.includes("global") || model.regions.includes(region);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function avg(values: unknown[]) {
  const clean = values.filter(isNumber);
  return clean.length ? clean.reduce((s, v) => s + v, 0) / clean.length : null;
}

function sum(values: unknown[]) {
  return values.filter(isNumber).reduce((s, v) => s + v, 0);
}

function max(values: unknown[]) {
  const clean = values.filter(isNumber);
  return clean.length ? Math.max(...clean) : null;
}

function min(values: unknown[]) {
  const clean = values.filter(isNumber);
  return clean.length ? Math.min(...clean) : null;
}

function spread(values: unknown[]) {
  const clean = values.filter(isNumber);
  return clean.length > 1 ? Math.max(...clean) - Math.min(...clean) : 0;
}

function round1(value: number | null) {
  return value === null || !Number.isFinite(value) ? null : Number(value.toFixed(1));
}

function ymd(dateLike: string) {
  return String(dateLike).slice(0, 10);
}

function splitPrecipByTemp(totalMm: number, tempC: number | null) {
  if (!Number.isFinite(totalMm)) return { rainMm: 0, snowCm: 0 };
  if (tempC === null) return { rainMm: totalMm, snowCm: 0 };
  if (tempC <= -1) return { rainMm: 0, snowCm: totalMm };
  if (tempC >= 1) return { rainMm: totalMm, snowCm: 0 };
  const snowFraction = (1 - tempC) / 2;
  return { rainMm: totalMm * (1 - snowFraction), snowCm: totalMm * snowFraction };
}

function estimateLevelTemps(summitTempC: number | null) {
  if (summitTempC === null) return { midTempC: null, valleyTempC: null };
  return { midTempC: summitTempC + 5, valleyTempC: summitTempC + 10 };
}

function estimateLevelWinds(summitWindKph: number | null) {
  if (summitWindKph === null) return { midWindKph: null, valleyWindKph: null };
  return { midWindKph: summitWindKph * 0.75, valleyWindKph: summitWindKph * 0.45 };
}

function estimateFreezingLevelFromSummitTemp(summitTempC: number | null, summitM: number) {
  if (summitTempC === null) return null;
  return Math.round(summitM + (summitTempC / LAPSE_RATE_C_PER_1000M) * 1000);
}

function buildUrl(model: ModelConfig, lat: number, lon: number, summitM: number) {
  const url = new URL(model.endpoint);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("elevation", String(Math.round(summitM)));
  url.searchParams.set("hourly", [
    "temperature_2m",
    "precipitation",
    "rain",
    "snowfall",
    "pressure_msl",
    "wind_speed_10m",
    "freezing_level_height",
  ].join(","));
  url.searchParams.set("forecast_days", String(Math.min(16, Math.ceil(model.maxLeadDays))));
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("precipitation_unit", "mm");
  url.searchParams.set("timezone", "auto");
  if (model.modelsParam) url.searchParams.set("models", model.modelsParam);
  return url.toString();
}

async function fetchOpenMeteoModel(model: ModelConfig, lat: number, lon: number, summitM: number) {
  const requestUrl = buildUrl(model, lat, lon, summitM);
  const response = await fetch(requestUrl, { headers: { Accept: "application/json", "User-Agent": "mountain-window-app/1.0" }, cache: "no-store" });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const reason = json?.reason || json?.error || `${response.status} ${response.statusText}`;
    throw new Error(reason);
  }
  if (!json?.hourly?.time?.length) throw new Error("Open-Meteo returned no hourly time series");
  const hourly = json.hourly;
  const rows = hourly.time.map((time: string, index: number) => {
    const temp = hourly.temperature_2m?.[index];
    const wind = hourly.wind_speed_10m?.[index];
    const precip = hourly.precipitation?.[index] ?? 0;
    const rain = hourly.rain?.[index];
    const snow = hourly.snowfall?.[index];
    const pressure = hourly.pressure_msl?.[index];
    const freezingLevel = hourly.freezing_level_height?.[index];
    const split = splitPrecipByTemp(Number(precip || 0), isNumber(temp) ? temp : null);
    return {
      time,
      date: ymd(time),
      modelId: model.id,
      modelLabel: model.label,
      provider: model.provider,
      modelElevationM: summitM,
      summitTempC: isNumber(temp) ? temp : null,
      summitWindKph: isNumber(wind) ? wind : null,
      precipMm: isNumber(precip) ? precip : 0,
      summitRainMm: isNumber(rain) ? rain : split.rainMm,
      summitSnowCm: isNumber(snow) ? snow : split.snowCm,
      pressureHpa: isNumber(pressure) ? pressure : null,
      freezingLevelM: isNumber(freezingLevel) ? freezingLevel : null,
    };
  });
  const byDay = new Map<string, any[]>();
  for (const row of rows) {
    if (!byDay.has(row.date)) byDay.set(row.date, []);
    byDay.get(row.date)!.push(row);
  }
  const daily = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayRows], index) => {
      const summitTempAvg = avg(dayRows.map((r) => r.summitTempC));
      const summitWindMax = max(dayRows.map((r) => r.summitWindKph));
      const { midTempC, valleyTempC } = estimateLevelTemps(summitTempAvg);
      const { midWindKph, valleyWindKph } = estimateLevelWinds(summitWindMax);
      const freezingLevel = avg(dayRows.map((r) => r.freezingLevelM)) ?? estimateFreezingLevelFromSummitTemp(summitTempAvg, summitM);
      return {
        modelId: model.id,
        modelLabel: model.label,
        provider: model.provider,
        dayIndex: index + 1,
        date,
        modelElevationM: summitM,
        summitTempC: round1(summitTempAvg),
        summitTempMinC: round1(min(dayRows.map((r) => r.summitTempC))),
        summitTempMaxC: round1(max(dayRows.map((r) => r.summitTempC))),
        summitWindKph: round1(summitWindMax),
        midWindKph: round1(midWindKph),
        valleyWindKph: round1(valleyWindKph),
        midTempC: round1(midTempC),
        valleyTempC: round1(valleyTempC),
        precipMm: round1(sum(dayRows.map((r) => r.precipMm))) ?? 0,
        summitRainMm: round1(sum(dayRows.map((r) => r.summitRainMm))) ?? 0,
        summitSnowCm: round1(sum(dayRows.map((r) => r.summitSnowCm))) ?? 0,
        midRainMm: round1(sum(dayRows.map((r) => r.summitRainMm))) ?? 0,
        midSnowCm: round1(sum(dayRows.map((r) => r.summitSnowCm))) ?? 0,
        valleyRainMm: round1(sum(dayRows.map((r) => r.summitRainMm))) ?? 0,
        valleySnowCm: round1(sum(dayRows.map((r) => r.summitSnowCm))) ?? 0,
        pressureHpa: round1(avg(dayRows.map((r) => r.pressureHpa))),
        freezingLevelM: freezingLevel === null ? null : Math.round(freezingLevel),
      };
    })
    .filter((day) => {
      if (day.dayIndex > Math.ceil(model.maxLeadDays)) return false;
      return isNumber(day.summitTempC) || isNumber(day.summitWindKph) || isNumber(day.precipMm);
    });
  if (!daily.length) throw new Error("No usable daily rows after grouping");
  return { model, daily };
}

function aggregateModelDays(modelResults: any[]) {
  const maxDays = Math.max(...modelResults.map((result) => result.daily.length));
  const days: any[] = [];
  for (let i = 0; i < maxDays; i++) {
    const modelValues = modelResults
      .map((result) => {
        const day = result.daily[i];
        if (!day) return null;
        if (day.dayIndex > Math.ceil(result.model.maxLeadDays)) return null;
        return day;
      })
      .filter(Boolean);
    if (!modelValues.length) continue;
    const summitWinds = modelValues.map((m) => m.summitWindKph);
    const midWinds = modelValues.map((m) => m.midWindKph);
    const valleyWinds = modelValues.map((m) => m.valleyWindKph);
    const summitTemps = modelValues.map((m) => m.summitTempC);
    const midTemps = modelValues.map((m) => m.midTempC);
    const valleyTemps = modelValues.map((m) => m.valleyTempC);
    const precip = modelValues.map((m) => m.precipMm);
    const meanSummitWind = avg(summitWinds) ?? 0;
    const meanMidWind = avg(midWinds) ?? 0;
    const meanValleyWind = avg(valleyWinds) ?? 0;
    const meanSummitTemp = avg(summitTemps) ?? 0;
    const meanMidTemp = avg(midTemps) ?? 0;
    const meanValleyTemp = avg(valleyTemps) ?? 0;
    const meanPrecip = avg(precip) ?? 0;
    const summitWindSpread = spread(summitWinds);
    const midWindSpread = spread(midWinds);
    const valleyWindSpread = spread(valleyWinds);
    const summitTempSpread = spread(summitTemps);
    const midTempSpread = spread(midTemps);
    const valleyTempSpread = spread(valleyTemps);
    const precipSpread = spread(precip);
    days.push({
      label: `+${i + 1}`,
      dayIndex: i + 1,
      date: modelValues[0].date,
      summitWindGfsKph: round1(meanSummitWind - summitWindSpread / 2),
      summitWindEcmwfKph: round1(meanSummitWind + summitWindSpread / 2),
      midWindGfsKph: round1(meanMidWind - midWindSpread / 2),
      midWindEcmwfKph: round1(meanMidWind + midWindSpread / 2),
      valleyWindGfsKph: round1(meanValleyWind - valleyWindSpread / 2),
      valleyWindEcmwfKph: round1(meanValleyWind + valleyWindSpread / 2),
      summitTempGfsC: round1(meanSummitTemp - summitTempSpread / 2),
      summitTempEcmwfC: round1(meanSummitTemp + summitTempSpread / 2),
      summitTempMinAvgC: round1(avg(modelValues.map((m) => m.summitTempMinC)) ?? meanSummitTemp),
      summitTempMaxAvgC: round1(avg(modelValues.map((m) => m.summitTempMaxC)) ?? meanSummitTemp),
      midTempGfsC: round1(meanMidTemp - midTempSpread / 2),
      midTempEcmwfC: round1(meanMidTemp + midTempSpread / 2),
      valleyTempGfsC: round1(meanValleyTemp - valleyTempSpread / 2),
      valleyTempEcmwfC: round1(meanValleyTemp + valleyTempSpread / 2),
      precipGfsMm: round1(Math.max(0, meanPrecip - precipSpread / 2)),
      precipEcmwfMm: round1(meanPrecip + precipSpread / 2),
      summitRainGfsMm: round1(avg(modelValues.map((m) => m.summitRainMm)) ?? 0),
      summitRainEcmwfMm: round1(avg(modelValues.map((m) => m.summitRainMm)) ?? 0),
      summitSnowGfsCm: round1(avg(modelValues.map((m) => m.summitSnowCm)) ?? 0),
      summitSnowEcmwfCm: round1(avg(modelValues.map((m) => m.summitSnowCm)) ?? 0),
      freezingLevelM: Math.round(avg(modelValues.map((m) => m.freezingLevelM)) ?? 0),
      pressureHpa: Math.round(avg(modelValues.map((m) => m.pressureHpa)) ?? 0),
      modelStats: {
        modelCount: modelValues.length,
        availableModels: modelValues.map((m) => m.modelLabel),
        windSpreadKph: round1(summitWindSpread),
        tempSpreadC: round1(summitTempSpread),
        precipSpreadMm: round1(precipSpread),
      },
      modelValues: modelValues.map((m) => ({
        modelId: m.modelId,
        modelLabel: m.modelLabel,
        provider: m.provider,
        dayIndex: m.dayIndex,
        date: m.date,
        modelElevationM: m.modelElevationM,
        summitWindKph: m.summitWindKph,
        midWindKph: m.midWindKph,
        valleyWindKph: m.valleyWindKph,
        summitTempC: m.summitTempC,
        summitTempMinC: m.summitTempMinC,
        summitTempMaxC: m.summitTempMaxC,
        midTempC: m.midTempC,
        valleyTempC: m.valleyTempC,
        precipMm: m.precipMm,
        summitRainMm: m.summitRainMm,
        summitSnowCm: m.summitSnowCm,
        freezingLevelM: m.freezingLevelM,
        pressureHpa: m.pressureHpa,
        modelElevationNote: "Requested at objective summit elevation using Open-Meteo elevation parameter; still model-grid interpolated and not a human mountain forecast.",
      })),
    });
  }
  return days;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  const summitM = Number(url.searchParams.get("summitM"));
  const region = url.searchParams.get("region") || "global";
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(summitM)) {
    return NextResponse.json({ error: "Missing or invalid lat/lon/summitM query parameters" }, { status: 400 });
  }
  const models = MODEL_CATALOG.filter((model) => appliesToRegion(model, region));
  const settled = await Promise.allSettled(models.map((model) => fetchOpenMeteoModel(model, lat, lon, summitM)));
  const successful = settled.filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled").map((result) => result.value);
  const unavailableModels = settled
    .map((result, index) => {
      const model = models[index];
      if (result.status === "fulfilled") return null;
      return `${model.label}: ${result.reason?.message || "unavailable"}`;
    })
    .filter(Boolean);
  if (!successful.length) {
    return NextResponse.json({ error: "No direct weather models returned usable data", unavailableModels }, { status: 502 });
  }
  const forecast = aggregateModelDays(successful);
  if (!forecast.length) {
    return NextResponse.json({ error: "Weather models were fetched but no daily forecast rows could be aggregated", unavailableModels }, { status: 502 });
  }
  return NextResponse.json({
    source: "Live direct model feeds via Open-Meteo: NOAA GFS/HRRR, ECCC GEM/GDPS/RDPS/HRDPS, and ECMWF where available. Requested at objective summit elevation; values remain model-grid interpolations.",
    unavailableModels,
    history: [],
    forecast,
  });
}
