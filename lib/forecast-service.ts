import { WEATHER_NEXT_ID, WEATHER_NEXT_MODEL, normalizeWeatherNext } from "./weather-next-data";
import { fetchWeatherNextPoint, safeWeatherNextError, weatherNextConfiguration } from "./weather-next-server";
import { PROFILE_VARIABLES, PRESSURE_LEVELS, summarizePressureProfile, diagnosePrecipitationPhase, precipitationCategoryAgreement, parseElevationResponse } from "./vertical-guidance";

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
export const MODEL_CATALOG: ModelConfig[] = [
  WEATHER_NEXT_MODEL,
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
  { name: "full", fields: [...CORE_HOURLY, "dew_point_2m", ...FREEZING_HOURLY, ...CLOUD_HOURLY, ...RADIATION_HOURLY] },
  { name: "no-dewpoint", fields: [...CORE_HOURLY, ...FREEZING_HOURLY, ...CLOUD_HOURLY, ...RADIATION_HOURLY] },
  { name: "no-radiation", fields: [...CORE_HOURLY, ...FREEZING_HOURLY, ...CLOUD_HOURLY] },
  { name: "weather-cloud", fields: [...CORE_HOURLY, ...CLOUD_HOURLY] },
  { name: "core", fields: CORE_HOURLY },
];

const ARCHIVE_HOURLY = "temperature_2m,precipitation,rain,snowfall,pressure_msl,wind_speed_10m";

const isNum = (v: any) => typeof v === "number" && Number.isFinite(v);
const clean = (a: any[]) => a.filter(isNum);
const avg = (a: any[]) => { const c = clean(a); return c.length ? c.reduce((s, v) => s + v, 0) / c.length : null; };
const sum = (a: any[]) => clean(a).reduce((s, v) => s + v, 0);
const sumOrNull = (a: any[]) => clean(a).length ? sum(a) : null;
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
    const response = await fetch(url, { headers: { "User-Agent": "mountain-window-app/3.0" }, cache: "no-store", signal: AbortSignal.timeout(12000) });
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

function urlFor(model: ModelConfig, lat: number, lon: number, summitM: number, fields: string[], elevations?: number[], modelOverride?: string) {
  if (!model.endpoint) return null;
  const url = new URL(model.endpoint);
  url.searchParams.set("latitude", elevations ? elevations.map(() => lat).join(",") : String(lat));
  url.searchParams.set("longitude", elevations ? elevations.map(() => lon).join(",") : String(lon));
  url.searchParams.set("hourly", fields.join(","));
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("precipitation_unit", "mm");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", String(Math.min(16, Math.max(1, Math.ceil(model.maxLeadDays)))));
  url.searchParams.set("elevation", elevations ? elevations.map(x => Math.round(x)).join(",") : String(Math.round(summitM)));
  if (modelOverride || model.models) url.searchParams.set("models", modelOverride || model.models!);
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
  const dewpoint = pick("dew_point_2m");

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
    windBasis: gust.length ? "daily_peak_gust" : "daily_peak_10m_wind",
    midWindKph: null,
    valleyWindKph: null,
    summitTempC: temp,
    summitTempMinC: min(temps),
    summitTempMaxC: max(temps),
    midTempC: null,
    valleyTempC: null,
    precipMm: sumOrNull(precip),
    summitRainMm: sumOrNull(rain),
    summitSnowCm: sumOrNull(snow),
    midRainMm: null,
    midSnowCm: null,
    valleyRainMm: null,
    valleySnowCm: null,
    pressureHpa: avg(pressure),
    dewPointC: avg(dewpoint),
    atmosphericProfile: [],
    phaseDiagnostic: diagnosePrecipitationPhase(hourly, idx, 0), // Recomputed with actual summit elevation below.
    precipitationPhaseNote: "Model rain/snow values unchanged; near-freezing phase is a diagnostic only.",
    elevationAdjustmentNote: "Open-Meteo downscaled temperature at requested elevation; not a separate valley grid cell.",
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

async function fetchModel(model: ModelConfig, lat: number, lon: number, summitM: number, midM: number, valleyM: number) {
  if (!model.endpoint) throw new Error(model.note || "connector not implemented");

  let json: any = null;
  let surfaceRows: any[] = [];
  let requestTier = "";
  const elevations = [summitM, midM, valleyM];
  let elevationRequestStatus = "unavailable";
  let lastError = "";

  for (const tier of REQUEST_TIERS) {
    try {
      const response = await fetchJson(urlFor(model, lat, lon, summitM, tier.fields, elevations)!);
      surfaceRows = parseElevationResponse(response, elevations.length);
      json = surfaceRows[0];
      elevationRequestStatus = "three-elevation";
      requestTier = tier.name;
      break;
    } catch (error: any) {
      lastError = String(error?.message || error || "request failed");
      if (isDomainError(lastError)) throw new Error(`out of domain at ${lat.toFixed(3)}, ${lon.toFixed(3)}`);
      if (/incomplete elevation response/i.test(lastError)) break; // retry with single summit location below
      if (isVariableError(lastError)) continue;
      // Some Open-Meteo model endpoints report generic validation errors for unavailable derived fields.
      // Permit one lower-feature retry before giving up.
      if (tier.name !== "core" && /invalid|not available|unsupported|cannot initialize/i.test(lastError)) continue;
      throw error;
    }
  }

  // Not all model endpoints accept multi-location calls. Fall back to summit-only,
  // and explicitly leave lower-elevation outputs unavailable instead of inventing them.
  if (!json) for (const tier of REQUEST_TIERS) {
    try {
      json = await fetchJson(urlFor(model, lat, lon, summitM, tier.fields)!);
      surfaceRows = parseElevationResponse(json, 1);
      elevationRequestStatus = "summit-only";
      requestTier = tier.name;
      break;
    } catch (error: any) {
      lastError = String(error?.message || error || "request failed");
      if (isDomainError(lastError)) throw new Error(`out of domain at ${lat.toFixed(3)}, ${lon.toFixed(3)}`);
      if (!isVariableError(lastError) && !/invalid|not available|unsupported|cannot initialize/i.test(lastError)) throw error;
    }
  }
  if (!json) throw new Error(lastError || "No supported variable set returned data");
  // Separate optional free-atmosphere profile request: its failure NEVER suppresses
  // the model's main surface forecast. ECMWF HRES 9 km needs IFS025 for pressure data.
  let upperAir: any = null;
  let upperAirSource: string | null = null;
  if (["gfs", "ecmwf_ifs", "gem_global", "gem_regional"].includes(model.id)) {
    const modelAlias = model.id === "ecmwf_ifs" ? "ecmwf_ifs025" : model.models;
    for (const fields of [PROFILE_VARIABLES, PROFILE_VARIABLES.filter(v => !v.startsWith("relative_humidity_"))]) {
      try {
        const raw = await fetchJson(urlFor(model, lat, lon, summitM, fields, undefined, modelAlias)! , 1);
        if (Array.isArray(raw?.hourly?.time)) { upperAir = raw.hourly; upperAirSource = modelAlias || null; break; }
      } catch { /* Optional upper-air data; surface guidance remains valid. */ }
    }
  }
  if (!json.hourly || !Array.isArray(json.hourly.time)) throw new Error(json.reason || json.error || "No hourly data returned");

  const byDay = new Map<string, number[]>();
  json.hourly.time.forEach((time: string, i: number) => {
    const key = dayKey(time);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(i);
  });

  const elevationData = surfaceRows.slice(1).map(row => row.hourly || {});
  const temperatureAtDay = (hourly: any, date: string) => {
    const values = (hourly.time || []).map((t: string, i: number) => dayKey(t) === date ? hourly.temperature_2m?.[i] : null);
    return { average: avg(values), min: min(values), max: max(values) };
  };
  const profileIndices = (date: string) => (upperAir?.time || []).flatMap((t: string, i: number) => dayKey(t) === date ? [i] : []);
  const daily = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, indices], i) => {
      const row: any = summarize(model, date, indices, json.hourly);
      if (row) {
        row.dayIndex = i + 1;
        row.requestTier = requestTier;
        const middle = elevationData[0] ? temperatureAtDay(elevationData[0], date) : null;
        const lower = elevationData[1] ? temperatureAtDay(elevationData[1], date) : null;
        row.midTempC = middle?.average ?? null;
        row.midTempMinC = middle?.min ?? null;
        row.midTempMaxC = middle?.max ?? null;
        row.valleyTempC = lower?.average ?? null;
        row.valleyTempMinC = lower?.min ?? null;
        row.valleyTempMaxC = lower?.max ?? null;
        row.phaseDiagnostic = diagnosePrecipitationPhase(json.hourly, indices, summitM);
        row.requestedElevationsM = { summit: summitM, mid: midM, lower: valleyM };
        row.returnedElevationsM = surfaceRows.map(x => Number.isFinite(x.elevation) ? x.elevation : null);
        row.elevationRequestStatus = elevationRequestStatus;
        if (upperAir) {
          const p = summarizePressureProfile(upperAir, profileIndices(date), { summit: summitM, mid: midM, lower: valleyM });
          row.summitFreeAirWindKph = p.summitFreeAirWindKph;
          row.midFreeAirWindKph = p.midFreeAirWindKph;
          row.lowerFreeAirWindKph = p.lowerFreeAirWindKph;
          row.atmosphericProfile = p.levelData;
          row.upperAirSource = upperAirSource;
          row.upperAirHours = p.hoursWithProfile;
        }
        row.midWindKph = row.midFreeAirWindKph ?? null;
        row.valleyWindKph = row.lowerFreeAirWindKph ?? null;
        row.cloudFieldsAvailable = Array.isArray(json.hourly.cloud_cover);
        row.radiationFieldsAvailable = Array.isArray(json.hourly.shortwave_radiation);
        row.freezingLevelAvailable = Array.isArray(json.hourly.freezing_level_height);
      }
      return row;
    })
    .filter(Boolean)
    .filter((row: any) => row.dayIndex <= Math.ceil(model.maxLeadDays));

  if (!daily.length) throw new Error("No usable daily rows after grouping");
  return { model, daily, timeZone: json.timezone };
}

export function aggregate(results: any[]) {
  // Join by the objective's local calendar date, never by a provider's row index.
  // Surface-only WeatherNext must not create days with empty summit guidance.
  const dates = Array.from(new Set<string>(results.filter(r => r.model.id !== WEATHER_NEXT_ID).flatMap(r => r.daily.map((d: any) => d.date)))).sort();
  const days: any[] = [];

  for (let i = 0; i < dates.length; i++) {
    const allValues = results
      .map((result) => {
        const day = result.daily.find((row: any) => row.date === dates[i]);
        if (!day || day.dayIndex > Math.ceil(result.model.maxLeadDays)) return null;
        return { ...day, dayIndex: i + 1 };
      })
      .filter(Boolean);

    if (!allValues.length) continue;

    const consensusValues = allValues.filter((value: any) => value.includeInConsensus !== false && value.weight > 0);
    const basis = consensusValues.length ? consensusValues : allValues.filter((value: any) => value.modelId !== WEATHER_NEXT_ID);

    const weighted = (key: string) => weightedAvg(basis.map((value: any) => ({ value: value[key], weight: value.weight || 1 })));
    const weightedZero = (key: string) => weighted(key) ?? 0;
    const nullableBounds = (key: string) => { const center = weighted(key); if (!isNum(center)) return [null, null]; const width = spread(basis.map((v: any) => v[key])); return [round1(center - width / 2), round1(center + width / 2)]; };
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
      midWindGfsKph: nullableBounds("midWindKph")[0],
      midWindEcmwfKph: nullableBounds("midWindKph")[1],
      valleyWindGfsKph: nullableBounds("valleyWindKph")[0],
      valleyWindEcmwfKph: nullableBounds("valleyWindKph")[1],

      summitTempGfsC: round1(summitTemp - tempSpread / 2),
      summitTempEcmwfC: round1(summitTemp + tempSpread / 2),
      summitTempMinAvgC: round1(average("summitTempMinC") ?? summitTemp),
      summitTempMaxAvgC: round1(average("summitTempMaxC") ?? summitTemp),
      midTempGfsC: nullableBounds("midTempC")[0],
      midTempEcmwfC: nullableBounds("midTempC")[1],
      valleyTempGfsC: nullableBounds("valleyTempC")[0],
      valleyTempEcmwfC: nullableBounds("valleyTempC")[1],

      precipGfsMm: round1(Math.max(0, precip - precipSpread / 2)),
      precipEcmwfMm: round1(precip + Math.min(precip, precipSpread / 2)),
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

      altitudeGuidance: {
        summitM: allValues.find((v: any) => v.requestedElevationsM)?.requestedElevationsM?.summit ?? null,
        midM: allValues.find((v: any) => v.requestedElevationsM)?.requestedElevationsM?.mid ?? null,
        lowerM: allValues.find((v: any) => v.requestedElevationsM)?.requestedElevationsM?.lower ?? null,
        summitFreeAirWindKph: round1(weighted("summitFreeAirWindKph")),
        midFreeAirWindKph: round1(weighted("midFreeAirWindKph")),
        lowerFreeAirWindKph: round1(weighted("lowerFreeAirWindKph")),
        midTempC: round1(weighted("midTempC")),
        midTempMinC: round1(weighted("midTempMinC")),
        midTempMaxC: round1(weighted("midTempMaxC")),
        lowerTempC: round1(weighted("valleyTempC")),
        lowerTempMinC: round1(weighted("valleyTempMinC")),
        lowerTempMaxC: round1(weighted("valleyTempMaxC")),
        temperatureModels: basis.filter((v: any) => isNum(v.midTempC) && isNum(v.valleyTempC)).length,
        upperAirModels: basis.filter((v: any) => isNum(v.summitFreeAirWindKph)).length,
      },
      phaseGuidance: {
        modelsWithPrecipitation: basis.filter((v: any) => (v.phaseDiagnostic?.precipHours ?? 0) > 0).length,
        modelsFlaggingUncertainPhase: basis.filter((v: any) => v.phaseDiagnostic?.uncertainHours > 0).length,
        uncertainPhasePrecipMeanMm: round1(avg(basis.map((v: any) => v.phaseDiagnostic?.uncertainPrecipMm))),
        note: "Near-freezing precipitation phase diagnostic; native rain/snow quantities unchanged.",
      },
      atmosphericProfiles: allValues.filter((v: any) => v.atmosphericProfile?.some((p: any) => isNum(p.maxWindKph) || isNum(p.relativeHumidityPct))).map((v: any) => ({ modelId: v.modelId, modelLabel: v.modelLabel, sourceModel: v.upperAirSource, levels: v.atmosphericProfile })),
      modelStats: {
        modelCount: allValues.length,
        consensusModelCount: basis.length,
        fieldModelCounts: {
          wind: basis.filter((v: any) => isNum(v.summitWindKph)).length,
          temperature: basis.filter((v: any) => isNum(v.summitTempC)).length,
          precipitation: basis.filter((v: any) => isNum(v.precipMm)).length,
        },
        availableModels: allValues.map((value: any) => value.modelLabel),
        consensusModels: basis.map((value: any) => value.modelLabel),
        guidanceOnlyModels: allValues.filter((value: any) => value.includeInConsensus === false).map((value: any) => value.modelLabel),
        weightedModels: basis.map((value: any) => `${value.modelLabel} (${value.weight})`),
        windSpreadKph: round1(windSpread),
        tempSpreadC: round1(tempSpread),
        precipSpreadMm: round1(precipSpread),
        weatherNextPrecipDeltaMm: (() => {
          const wn = basis.find((v: any) => v.modelId === WEATHER_NEXT_ID && isNum(v.precipMm));
          const others = basis.filter((v: any) => v.modelId !== WEATHER_NEXT_ID);
          const without = weightedAvg(others.map((v: any) => ({ value: v.precipMm, weight: v.weight })));
          return wn && isNum(without) ? round1(precip - without) : null;
        })(),
        precipitationAgreement: precipitationCategoryAgreement(basis.map((v: any) => v.precipMm)),
        freezingSpreadM: round0(spread(basis.map((v: any) => v.freezingLevelM))),
        fieldModelCountsByVariable: { wind: basis.filter((v: any) => isNum(v.summitWindKph)).length, upperAirWind: basis.filter((v: any) => isNum(v.midFreeAirWindKph)).length, temperature: basis.filter((v: any) => isNum(v.summitTempC)).length, lowerTemperature: basis.filter((v: any) => isNum(v.valleyTempC)).length, precipitation: basis.filter((v: any) => isNum(v.precipMm)).length, freezing: basis.filter((v: any) => isNum(v.freezingLevelM)).length },
        cloudSpreadPct: round1(spread(basis.map((value: any) => value.cloudCoverPct))),
      },

      modelValues: allValues.map((value: any) => ({ ...value })),
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

    return Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, indices]) => ({
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

export async function getWeatherData({ lat, lon, summitM, midM, valleyM, region = "global" }: { lat: number; lon: number; summitM: number; midM?: number; valleyM?: number; region?: string }) {
  // Representative targets are explicit and auditable, not hardcoded weather adjustments.
  // If the caller does not know route elevations, use provisional bands and flag them.
  const lowerTargetM = isNum(valleyM) && valleyM < summitM ? valleyM : Math.max(0, summitM - 1200);
  const midTargetM = isNum(midM) && midM > lowerTargetM && midM < summitM ? midM : Math.round((summitM + lowerTargetM) / 2);
  const models = MODEL_CATALOG.filter(model => applies(model, region));
  const successful: any[] = [];
  const unavailableModels: string[] = [];
  const configuration = weatherNextConfiguration();
  // Start Earth Engine while the Open-Meteo requests run; always settle errors independently.
  const weatherNextPromise = configuration.ready
    ? fetchWeatherNextPoint(lat, lon).then(value => ({ value, error: null })).catch(error => ({ value: null, error }))
    : Promise.resolve({ value: null, error: null });
  const historyPromise = history(lat, lon, summitM);
  for (const model of models.filter(m => m.id !== WEATHER_NEXT_ID)) {
    try {
      successful.push(await fetchModel(model, lat, lon, summitM, midTargetM, lowerTargetM));
      await delay(180);
    } catch (error: any) {
      unavailableModels.push(model.label + ": " + (error?.message || "unavailable"));
    }
  }
  const result = await weatherNextPromise;
  let weatherNext: any = { status: configuration.status, message: configuration.message };
  if (result.error) {
    weatherNext = { status: "unavailable", message: safeWeatherNextError(result.error) };
  } else if (result.value) {
    const timeZone = successful.find(r => r.timeZone)?.timeZone;
    try {
      if (!timeZone) throw new Error("Objective time zone unavailable");
      const normalized = normalizeWeatherNext(result.value, timeZone);
      successful.push(normalized);
      weatherNext = {
        status: normalized.stale ? "stale" : "available", runStart: normalized.runStart, timeZone,
        message: normalized.stale ? "WeatherNext run is over 24 hours old and excluded from consensus." : "",
        source: "Google Earth Engine", resolution: "0.1 degrees", horizonHours: 360,
        targetElevationM: summitM, modelSurfaceElevationM: null,
        sampling: normalized.sampling, terrainContext: normalized.terrainContext,
        note: WEATHER_NEXT_MODEL.note,
      };
    } catch {
      weatherNext = { status: "unavailable", message: "WeatherNext returned incomplete or invalid forecast metadata; excluded from analysis." };
    }
  }
  if (!["available", "stale"].includes(weatherNext.status)) unavailableModels.push("WeatherNext 3: " + weatherNext.message);
  if (!successful.some(r => r.model.id !== WEATHER_NEXT_ID)) {
    await historyPromise;
    return { error: "No direct model feeds returned usable summit data", unavailableModels, weatherNext, forecast: [], history: [] };
  }
  return {
    source: "Direct model-specific Open-Meteo feeds, with Google WeatherNext 3 via Earth Engine when authorized. WeatherNext uses native grid surface temperature/wind; complete-day precipitation, cloud, pressure and solar means enter the weighted analysis as one additional source. No WeatherNext summit adjustment, snowfall split or freezing level is inferred. RAP remains NO DATA pending a direct connector.",
    target: { latitude: lat, longitude: lon, elevationM: summitM, midElevationM: midTargetM, lowerElevationM: lowerTargetM, targetElevationIsApproximate: !isNum(valleyM), windBasis: "grid-cell 10m peak gust/wind; pressure-level winds separately interpolated at actual model geopotential heights (free atmosphere, not terrain wind)", precipitationBasis: "grid-area total; provider rain/snow partition with independent wet-bulb/freezing-level uncertainty diagnostics", elevationGuidance: "Open-Meteo multi-location elevation-downscaled temperature at same coordinates; pressure-level interpolated wind is free-air and is not a ridge/valley surface forecast" },
    unavailableModels, weatherNext, timeZone: successful.find(r => r.timeZone)?.timeZone,
    modelCatalog: models.map(model => ({
      id: model.id, label: model.label, provider: model.provider, maxLeadDays: model.maxLeadDays,
      includeInConsensus: model.includeInConsensus !== false, sourceModelId: model.models || null,
    })),
    historySource: "Open-Meteo archive API lookback at objective elevation where supported.",
    history: await historyPromise,
    forecast: aggregate(successful),
  };
}
