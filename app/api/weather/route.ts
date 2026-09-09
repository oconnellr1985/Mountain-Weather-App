import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ModelConfig = {
  id: string;
  label: string;
  provider: string;
  regions: Array<"global" | "north_america">;
  maxLeadDays: number;
  endpoint: string | null;
  models?: string;
  weight: number;
  includeInConsensus?: boolean;
  note?: string;
};

const GENERIC_FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

/**
 * Internal ids are stable app ids. `models` values are current Open-Meteo model ids.
 * Regional North-American models are attempted for both Canadian and U.S. objectives;
 * Open-Meteo is allowed to determine whether a coordinate is actually inside the model domain.
 */
const MODEL_CATALOG: ModelConfig[] = [
  { id: "gfs", label: "GFS", provider: "NOAA GFS via Open-Meteo", regions: ["global"], maxLeadDays: 16, endpoint: GENERIC_FORECAST_ENDPOINT, models: "ncep_gfs_seamless", weight: 0.85 },
  { id: "ecmwf_ifs", label: "ECMWF IFS HRES 9 km", provider: "ECMWF via Open-Meteo", regions: ["global"], maxLeadDays: 15, endpoint: GENERIC_FORECAST_ENDPOINT, models: "ecmwf_ifs", weight: 1.10 },
  { id: "ecmwf_aifs", label: "ECMWF AIFS", provider: "ECMWF AIFS via Open-Meteo", regions: ["global"], maxLeadDays: 15, endpoint: GENERIC_FORECAST_ENDPOINT, models: "ecmwf_aifs025_single", weight: 0.95 },
  { id: "gem_global", label: "GEM Global / GDPS", provider: "ECCC GDPS via Open-Meteo", regions: ["global"], maxLeadDays: 10, endpoint: GENERIC_FORECAST_ENDPOINT, models: "cmc_gem_gdps", weight: 0.90 },

  { id: "gem_regional", label: "GEM Regional / RDPS", provider: "ECCC RDPS via Open-Meteo", regions: ["north_america"], maxLeadDays: 3.5, endpoint: GENERIC_FORECAST_ENDPOINT, models: "cmc_gem_rdps", weight: 1.15 },
  { id: "gem_hrdps_continental", label: "HRDPS Continental", provider: "ECCC HRDPS via Open-Meteo", regions: ["north_america"], maxLeadDays: 2, endpoint: GENERIC_FORECAST_ENDPOINT, models: "cmc_gem_hrdps", weight: 1.25 },
  { id: "gem_hrdps_west", label: "HRDPS West (experimental)", provider: "ECCC HRDPS West via Open-Meteo", regions: ["north_america"], maxLeadDays: 2, endpoint: GENERIC_FORECAST_ENDPOINT, models: "cmc_gem_hrdps_west", weight: 1.30 },

  { id: "gfs_hrrr", label: "HRRR", provider: "NOAA HRRR via Open-Meteo", regions: ["north_america"], maxLeadDays: 2, endpoint: GENERIC_FORECAST_ENDPOINT, models: "ncep_hrrr_conus", weight: 1.25 },
  { id: "nam_conus", label: "NAM CONUS", provider: "NOAA NAM via Open-Meteo", regions: ["north_america"], maxLeadDays: 2.5, endpoint: GENERIC_FORECAST_ENDPOINT, models: "ncep_nam_conus", weight: 1.05 },

  // NBM is very useful U.S./border-region guidance, but it is a blend/post-processed product rather than an
  // independent dynamical model. Show it in the model table without double-counting it in consensus scoring.
  { id: "noaa_nbm", label: "NBM (blended guidance)", provider: "NOAA NBM via Open-Meteo", regions: ["north_america"], maxLeadDays: 11, endpoint: GENERIC_FORECAST_ENDPOINT, models: "ncep_nbm_conus", weight: 0, includeInConsensus: false },

  // RAP is not currently exposed by Open-Meteo. Keep it explicit and visible rather than fabricating data.
  { id: "noaa_rap", label: "RAP", provider: "NOAA/NOMADS connector pending", regions: ["north_america"], maxLeadDays: 2.125, endpoint: null, note: "RAP is not available through Open-Meteo; direct NOAA/NOMADS GRIB ingestion is still required.", weight: 1.10 },
];

const CORE_HOURLY = [
  "temperature_2m",
  "wind_speed_10m",
  "wind_gusts_10m",
  "precipitation",
  "rain",
  "snowfall",
  "pressure_msl",
];

const FREEZING_HOURLY = ["freezing_level_height"];
const CLOUD_HOURLY = ["cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high"];
const RADIATION_HOURLY = ["shortwave_radiation", "direct_radiation", "diffuse_radiation"];

const REQUEST_TIERS = [
  { name: "full", fields: [...CORE_HOURLY, ...FREEZING_HOURLY, ...CLOUD_HOURLY, ...RADIATION_HOURLY] },
  { name: "no-radiation", fields: [...CORE_HOURLY, ...FREEZING_HOURLY, ...CLOUD_HOURLY] },
  { name: "weather-cloud", fields: [...CORE_HOURLY, ...CLOUD_HOURLY] },
  { name: "core", fields: CORE_HOURLY },
];

const ARCHIVE_HOURLY = "temperature_2m,precipitation,rain,snowfall,pressure_msl,wind_speed_10m";

const isNum = (v: any) => typeof v === "number" && Number.isFinite(v);
const clean = (a: any[]) => a.filter(isNum);
const avg = (a: any[]) => { const c = clean(a); return c.length ? c.reduce((s, v) => s + v, 0) / c.length : null; };
const sum = (a: any[]) => clean(a).reduce((s, v) => s + v, 0);
const max = (a: any[]) => { const c = clean(a); return c.length ? Math.max(...c) : null; };
const min = (a: any[]) => { const c = clean(a); return c.length ? Math.min(...c) : null; };
const spread = (a: any[]) => { const c = clean(a); return c.length > 1 ? Math.max(...c) - Math.min(...c) : 0; };
const weightedAvg = (items: any[]) => {
  const v = items.filter((i) => isNum(i.value) && isNum(i.weight) && i.weight > 0);
  const totalWeight = v.reduce((s, i) => s + i.weight, 0);
  return totalWeight ? v.reduce((s, i) => s + i.value * i.weight, 0) / totalWeight : null;
};
const round1 = (v: any) => isNum(v) ? +v.toFixed(1) : null;
const round0 = (v: any) => isNum(v) ? Math.round(v) : null;
const clampPct = (v: any) => isNum(v) ? Math.max(0, Math.min(100, +v.toFixed(1))) : null;

function applies(model: ModelConfig, region: string) {
  if (model.regions.includes("global")) return true;
  return model.regions.includes("north_america") && (region === "usa" || region === "canada" || region === "north_america");
}
function dateStr(d: Date) { return d.toISOString().slice(0, 10); }
function dayKey(t: string) { return String(t).slice(0, 10); }
async function delay(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function fetchJson(url: string, attempts = 3) {
  let last = "";
  for (let i = 0; i < attempts; i++) {
    const response = await fetch(url, { headers: { "User-Agent": "mountain-window-app/3.0" }, cache: "no-store" });
    const text = await response.text();
    let json: any = {};
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (response.ok) return json;
    last = json.reason || json.error || `${response.status} ${response.statusText}: ${text.slice(0, 260)}`;
    if (response.status === 429 || /concurrent|rate|too many/i.test(last)) {
      await delay(900 * (i + 1));
      continue;
    }
    break;
  }
  throw new Error(last || "request failed");
}

function isDomainError(message: string) {
  return /outside.*domain|out of domain|location.*not.*available|coordinates?.*not.*supported|no data.*location|domain does not contain/i.test(message);
}
function isVariableError(message: string) {
  return /invalid.*variable|variable.*not.*available|unsupported.*variable|cannot initialize.*variable|unknown.*variable/i.test(message);
}

function urlFor(model: ModelConfig, lat: number, lon: number, summitM: number, fields: string[]) {
  if (!model.endpoint) return null;
  const url = new URL(model.endpoint);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("hourly", fields.join(","));
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("precipitation_unit", "mm");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", String(Math.min(16, Math.max(1, Math.ceil(model.maxLeadDays)))));
  url.searchParams.set("elevation", String(Math.round(summitM)));
  if (model.models) url.searchParams.set("models", model.models);
  return url.toString();
}

function summarize(model: ModelConfig, date: string, idx: number[], hourly: any) {
  const pick = (key: string) => idx.map((i) => hourly[key]?.[i]).filter(isNum);

  const temps = pick("temperature_2m");
  const wind = pick("wind_speed_10m");
  const gust = pick("wind_gusts_10m");
  const precip = pick("precipitation");
  const rain = pick("rain");
  const snow = pick("snowfall");
  const pressure = pick("pressure_msl");
  const freezing = pick("freezing_level_height");
  const cloud = pick("cloud_cover");
  const cloudLow = pick("cloud_cover_low");
  const cloudMid = pick("cloud_cover_mid");
  const cloudHigh = pick("cloud_cover_high");
  const shortwave = pick("shortwave_radiation");
  const direct = pick("direct_radiation");
  const diffuse = pick("diffuse_radiation");

  const peakWind = max(gust) ?? max(wind);
  const temp = avg(temps);
  if (!isNum(temp) && !isNum(peakWind) && precip.length === 0) return null;

  return {
    modelId: model.id,
    modelLabel: model.label,
    provider: model.provider,
    weight: model.weight,
    includeInConsensus: model.includeInConsensus !== false,
    dayIndex: null,
    date,
    summitWindKph: peakWind,
    midWindKph: isNum(peakWind) ? peakWind * 0.75 : null,
    valleyWindKph: isNum(peakWind) ? peakWind * 0.45 : null,
    summitTempC: temp,
    summitTempMinC: min(temps),
    summitTempMaxC: max(temps),
    midTempC: isNum(temp) ? temp + 5 : null,
    valleyTempC: isNum(temp) ? temp + 10 : null,
    precipMm: sum(precip),
    summitRainMm: sum(rain),
    summitSnowCm: sum(snow),
    midRainMm: sum(rain),
    midSnowCm: sum(snow),
    valleyRainMm: sum(rain),
    valleySnowCm: sum(snow),
    pressureHpa: avg(pressure),
    freezingLevelM: avg(freezing),
    cloudCoverPct: avg(cloud),
    cloudCoverLowPct: avg(cloudLow),
    cloudCoverMidPct: avg(cloudMid),
    cloudCoverHighPct: avg(cloudHigh),
    shortwaveRadiationWm2: avg(shortwave),
    directRadiationWm2: avg(direct),
    diffuseRadiationWm2: avg(diffuse),
  };
}

async function fetchModel(model: ModelConfig, lat: number, lon: number, summitM: number) {
  if (!model.endpoint) throw new Error(model.note || "connector not implemented");

  let json: any = null;
  let requestTier = "";
  let lastError = "";

  for (const tier of REQUEST_TIERS) {
    try {
      json = await fetchJson(urlFor(model, lat, lon, summitM, tier.fields)!);
      requestTier = tier.name;
      break;
    } catch (error: any) {
      lastError = String(error?.message || error || "request failed");
      if (isDomainError(lastError)) throw new Error(`out of domain at ${lat.toFixed(3)}, ${lon.toFixed(3)}`);
      if (isVariableError(lastError)) continue;
      // Some Open-Meteo model endpoints report generic validation errors for unavailable derived fields.
      // Permit one lower-feature retry before giving up.
      if (tier.name !== "core" && /invalid|not available|unsupported|cannot initialize/i.test(lastError)) continue;
      throw error;
    }
  }

  if (!json) throw new Error(lastError || "No supported variable set returned data");
  if (!json.hourly || !Array.isArray(json.hourly.time)) throw new Error(json.reason || json.error || "No hourly data returned");

  const byDay = new Map<string, number[]>();
  json.hourly.time.forEach((time: string, i: number) => {
    const key = dayKey(time);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(i);
  });

  const daily = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, indices], i) => {
      const row: any = summarize(model, date, indices, json.hourly);
      if (row) {
        row.dayIndex = i + 1;
        row.requestTier = requestTier;
        row.cloudFieldsAvailable = Array.isArray(json.hourly.cloud_cover);
        row.radiationFieldsAvailable = Array.isArray(json.hourly.shortwave_radiation);
        row.freezingLevelAvailable = Array.isArray(json.hourly.freezing_level_height);
      }
      return row;
    })
    .filter(Boolean)
    .filter((row: any) => row.dayIndex <= Math.ceil(model.maxLeadDays));

  if (!daily.length) throw new Error("No usable daily rows after grouping");
  return { model, daily };
}

function aggregate(results: any[]) {
  const maxDays = Math.max(...results.map((result) => result.daily.length));
  const days: any[] = [];

  for (let i = 0; i < maxDays; i++) {
    const allValues = results
      .map((result) => {
        const day = result.daily[i];
        if (!day || day.dayIndex > Math.ceil(result.model.maxLeadDays)) return null;
        return day;
      })
      .filter(Boolean);

    if (!allValues.length) continue;

    const consensusValues = allValues.filter((value: any) => value.includeInConsensus !== false && value.weight > 0);
    const basis = consensusValues.length ? consensusValues : allValues;

    const weighted = (key: string) => weightedAvg(basis.map((value: any) => ({ value: value[key], weight: value.weight || 1 })));
    const weightedZero = (key: string) => weighted(key) ?? 0;
    const average = (key: string) => avg(basis.map((value: any) => value[key]));

    const summitWind = weightedZero("summitWindKph");
    const summitTemp = weightedZero("summitTempC");
    const precip = weightedZero("precipMm");
    const windSpread = spread(basis.map((value: any) => value.summitWindKph));
    const tempSpread = spread(basis.map((value: any) => value.summitTempC));
    const precipSpread = spread(basis.map((value: any) => value.precipMm));

    days.push({
      label: `+${i + 1}`,
      dayIndex: i + 1,
      date: allValues[0].date,

      // Legacy field names retained because the frontend uses these as lower/upper consensus traces,
      // not literal GFS-vs-ECMWF values.
      summitWindGfsKph: round1(summitWind - windSpread / 2),
      summitWindEcmwfKph: round1(summitWind + windSpread / 2),
      midWindGfsKph: round1(weightedZero("midWindKph") - spread(basis.map((v: any) => v.midWindKph)) / 2),
      midWindEcmwfKph: round1(weightedZero("midWindKph") + spread(basis.map((v: any) => v.midWindKph)) / 2),
      valleyWindGfsKph: round1(weightedZero("valleyWindKph") - spread(basis.map((v: any) => v.valleyWindKph)) / 2),
      valleyWindEcmwfKph: round1(weightedZero("valleyWindKph") + spread(basis.map((v: any) => v.valleyWindKph)) / 2),

      summitTempGfsC: round1(summitTemp - tempSpread / 2),
      summitTempEcmwfC: round1(summitTemp + tempSpread / 2),
      summitTempMinAvgC: round1(average("summitTempMinC") ?? summitTemp),
      summitTempMaxAvgC: round1(average("summitTempMaxC") ?? summitTemp),
      midTempGfsC: round1(weightedZero("midTempC") - spread(basis.map((v: any) => v.midTempC)) / 2),
      midTempEcmwfC: round1(weightedZero("midTempC") + spread(basis.map((v: any) => v.midTempC)) / 2),
      valleyTempGfsC: round1(weightedZero("valleyTempC") - spread(basis.map((v: any) => v.valleyTempC)) / 2),
      valleyTempEcmwfC: round1(weightedZero("valleyTempC") + spread(basis.map((v: any) => v.valleyTempC)) / 2),

      precipGfsMm: round1(Math.max(0, precip - precipSpread / 2)),
      precipEcmwfMm: round1(Math.max(0, precip + precipSpread / 2)),
      summitRainGfsMm: round1(weightedZero("summitRainMm")),
      summitRainEcmwfMm: round1(weightedZero("summitRainMm")),
      summitSnowGfsCm: round1(weightedZero("summitSnowCm")),
      summitSnowEcmwfCm: round1(weightedZero("summitSnowCm")),

      freezingLevelM: round0(weighted("freezingLevelM")),
      pressureHpa: round0(weighted("pressureHpa")),
      cloudCoverPct: clampPct(weighted("cloudCoverPct")),
      cloudCoverLowPct: clampPct(weighted("cloudCoverLowPct")),
      cloudCoverMidPct: clampPct(weighted("cloudCoverMidPct")),
      cloudCoverHighPct: clampPct(weighted("cloudCoverHighPct")),
      shortwaveRadiationWm2: round1(weighted("shortwaveRadiationWm2")),
      directRadiationWm2: round1(weighted("directRadiationWm2")),
      diffuseRadiationWm2: round1(weighted("diffuseRadiationWm2")),

      modelStats: {
        modelCount: allValues.length,
        consensusModelCount: basis.length,
        availableModels: allValues.map((value: any) => value.modelLabel),
        consensusModels: basis.map((value: any) => value.modelLabel),
        guidanceOnlyModels: allValues.filter((value: any) => value.includeInConsensus === false).map((value: any) => value.modelLabel),
        weightedModels: basis.map((value: any) => `${value.modelLabel} (${value.weight})`),
        windSpreadKph: round1(windSpread),
        tempSpreadC: round1(tempSpread),
        precipSpreadMm: round1(precipSpread),
        cloudSpreadPct: round1(spread(basis.map((value: any) => value.cloudCoverPct))),
      },

      modelValues: allValues.map((value: any) => ({
        modelId: value.modelId,
        modelLabel: value.modelLabel,
        provider: value.provider,
        weight: value.weight,
        includeInConsensus: value.includeInConsensus,
        dayIndex: value.dayIndex,
        date: value.date,
        summitWindKph: value.summitWindKph,
        midWindKph: value.midWindKph,
        valleyWindKph: value.valleyWindKph,
        summitTempC: value.summitTempC,
        summitTempMinC: value.summitTempMinC,
        summitTempMaxC: value.summitTempMaxC,
        midTempC: value.midTempC,
        valleyTempC: value.valleyTempC,
        precipMm: value.precipMm,
        summitRainMm: value.summitRainMm,
        summitSnowCm: value.summitSnowCm,
        freezingLevelM: value.freezingLevelM,
        pressureHpa: value.pressureHpa,
        cloudCoverPct: value.cloudCoverPct,
        cloudCoverLowPct: value.cloudCoverLowPct,
        cloudCoverMidPct: value.cloudCoverMidPct,
        cloudCoverHighPct: value.cloudCoverHighPct,
        shortwaveRadiationWm2: value.shortwaveRadiationWm2,
        directRadiationWm2: value.directRadiationWm2,
        diffuseRadiationWm2: value.diffuseRadiationWm2,
        requestTier: value.requestTier,
        cloudFieldsAvailable: value.cloudFieldsAvailable,
        radiationFieldsAvailable: value.radiationFieldsAvailable,
        freezingLevelAvailable: value.freezingLevelAvailable,
      })),
    });
  }

  return days;
}

async function history(lat: number, lon: number, summitM: number) {
  const end = new Date();
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - 13);

  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("start_date", dateStr(start));
  url.searchParams.set("end_date", dateStr(end));
  url.searchParams.set("hourly", ARCHIVE_HOURLY);
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("precipitation_unit", "mm");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("elevation", String(Math.round(summitM)));

  try {
    const json = await fetchJson(url.toString(), 2);
    if (!json.hourly?.time) return [];

    const byDay = new Map<string, number[]>();
    json.hourly.time.forEach((time: string, i: number) => {
      const key = dayKey(time);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(i);
    });

    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, indices]) => ({
      label: date,
      date,
      observedPrecipMm: sum(indices.map((i) => json.hourly.precipitation?.[i])),
      observedRainMm: sum(indices.map((i) => json.hourly.rain?.[i])),
      observedSnowCm: sum(indices.map((i) => json.hourly.snowfall?.[i])),
      observedWindKph: max(indices.map((i) => json.hourly.wind_speed_10m?.[i])),
      observedPressureHpa: avg(indices.map((i) => json.hourly.pressure_msl?.[i])),
      observedSummitTempC: avg(indices.map((i) => json.hourly.temperature_2m?.[i])),
      observedSummitTempMinC: min(indices.map((i) => json.hourly.temperature_2m?.[i])),
      observedSummitTempMaxC: max(indices.map((i) => json.hourly.temperature_2m?.[i])),
    }));
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const lat = Number(requestUrl.searchParams.get("lat"));
  const lon = Number(requestUrl.searchParams.get("lon"));
  const summitM = Number(requestUrl.searchParams.get("summitM"));
  const region = requestUrl.searchParams.get("region") || "global";

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(summitM)) {
    return NextResponse.json({ error: "Missing or invalid lat/lon/summitM query parameters" }, { status: 400 });
  }

  const models = MODEL_CATALOG.filter((model) => applies(model, region));
  const successful: any[] = [];
  const unavailableModels: string[] = [];

  // Deliberately sequential to reduce Open-Meteo concurrency/rate-limit failures on Vercel.
  for (const model of models) {
    try {
      successful.push(await fetchModel(model, lat, lon, summitM));
      await delay(180);
    } catch (error: any) {
      unavailableModels.push(`${model.label}: ${error?.message || "unavailable"}`);
    }
  }

  if (!successful.length) {
    return NextResponse.json({ error: "No direct model feeds returned usable data", unavailableModels }, { status: 502 });
  }

  return NextResponse.json({
    source: "Direct Open-Meteo model-specific feeds: GFS, ECMWF IFS HRES/AIFS, ECCC GDPS/RDPS/HRDPS, NOAA HRRR/NAM/NBM where the objective lies inside the model domain. Regional-domain applicability is determined by the data provider rather than by the Canada/U.S. border. RAP remains explicit NO DATA pending a direct NOAA/NOMADS connector.",
    unavailableModels,
    modelCatalog: models.map((model) => ({
      id: model.id,
      label: model.label,
      provider: model.provider,
      maxLeadDays: model.maxLeadDays,
      includeInConsensus: model.includeInConsensus !== false,
      sourceModelId: model.models || null,
    })),
    historySource: "Open-Meteo archive API lookback at objective elevation where supported.",
    history: await history(lat, lon, summitM),
    forecast: aggregate(successful),
  });
}
