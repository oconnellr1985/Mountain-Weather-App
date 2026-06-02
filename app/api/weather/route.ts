import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MODEL_CATALOG = [
  { id: "gfs", label: "GFS", provider: "NOAA via Open-Meteo GFS API", regions: ["global"], maxLeadDays: 16, endpoint: "https://api.open-meteo.com/v1/gfs", models: "gfs_seamless", weight: 0.85 },
  { id: "gfs_hrrr", label: "HRRR", provider: "NOAA HRRR via Open-Meteo GFS API", regions: ["usa"], maxLeadDays: 2, endpoint: "https://api.open-meteo.com/v1/gfs", models: "hrrr", weight: 1.25 },
  { id: "nam_conus", label: "NAM", provider: "NOAA GRIB/NOMADS connector required", regions: ["usa"], maxLeadDays: 4, endpoint: null, note: "NAM is explicit NO DATA in this build; requires GRIB/NOMADS parser or third-party API.", weight: 1.05 },
  { id: "noaa_rap", label: "RAP", provider: "NOAA GRIB/NOMADS connector required", regions: ["usa"], maxLeadDays: 1, endpoint: null, note: "RAP is explicit NO DATA in this build; requires GRIB/NOMADS parser or third-party API.", weight: 1.1 },
  { id: "gem_global", label: "GEM Global / GDPS", provider: "ECCC via Open-Meteo GEM API", regions: ["global"], maxLeadDays: 10, endpoint: "https://api.open-meteo.com/v1/gem", models: "gem_global", weight: 0.9 },
  { id: "gem_regional", label: "GEM Regional / RDPS", provider: "ECCC via Open-Meteo GEM API", regions: ["canada"], maxLeadDays: 3.5, endpoint: "https://api.open-meteo.com/v1/gem", models: "gem_regional", weight: 1.15 },
  { id: "gem_hrdps_continental", label: "HRDPS Continental", provider: "ECCC via Open-Meteo GEM API", regions: ["canada"], maxLeadDays: 2, endpoint: "https://api.open-meteo.com/v1/gem", models: "gem_hrdps_continental", weight: 1.25 },
  { id: "ecmwf_ifs025", label: "ECMWF IFS", provider: "ECMWF via Open-Meteo ECMWF API", regions: ["global"], maxLeadDays: 15, endpoint: "https://api.open-meteo.com/v1/ecmwf", models: "ifs025", weight: 1.05 },
  { id: "ecmwf_aifs025", label: "ECMWF AIFS", provider: "ECMWF via Open-Meteo ECMWF API", regions: ["global"], maxLeadDays: 15, endpoint: "https://api.open-meteo.com/v1/ecmwf", models: "aifs025", weight: 0.95 },
];

const BASE_HOURLY = [
  "temperature_2m",
  "wind_speed_10m",
  "wind_gusts_10m",
  "precipitation",
  "rain",
  "snowfall",
  "pressure_msl",
  "freezing_level_height",
];

const CLOUD_HOURLY = [
  "cloud_cover",
  "cloud_cover_low",
  "cloud_cover_mid",
  "cloud_cover_high",
  "shortwave_radiation",
  "direct_radiation",
  "diffuse_radiation",
];

const HOURLY = [...BASE_HOURLY, ...CLOUD_HOURLY].join(",");
const ARCHIVE_HOURLY = "temperature_2m,precipitation,rain,snowfall,pressure_msl,wind_speed_10m";

const isNum = (v: any) => typeof v === "number" && Number.isFinite(v);
const clean = (a: any[]) => a.filter(isNum);
const avg = (a: any[]) => {
  const c = clean(a);
  return c.length ? c.reduce((s, v) => s + v, 0) / c.length : null;
};
const sum = (a: any[]) => clean(a).reduce((s, v) => s + v, 0);
const max = (a: any[]) => {
  const c = clean(a);
  return c.length ? Math.max(...c) : null;
};
const min = (a: any[]) => {
  const c = clean(a);
  return c.length ? Math.min(...c) : null;
};
const spread = (a: any[]) => {
  const c = clean(a);
  return c.length > 1 ? Math.max(...c) - Math.min(...c) : 0;
};
const weightedAvg = (items: any[]) => {
  const v = items.filter((i) => isNum(i.value) && isNum(i.weight) && i.weight > 0);
  const t = v.reduce((s, i) => s + i.weight, 0);
  return t ? v.reduce((s, i) => s + i.value * i.weight, 0) / t : null;
};
const round1 = (v: any) => isNum(v) ? +v.toFixed(1) : null;
const round0 = (v: any) => isNum(v) ? Math.round(v) : null;
const clampPct = (v: any) => isNum(v) ? Math.max(0, Math.min(100, +v.toFixed(1))) : null;

function applies(m: any, region: string) {
  return m.regions.includes("global") || m.regions.includes(region);
}
function dateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}
function dayKey(t: string) {
  return String(t).slice(0, 10);
}
async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url: string, attempts = 3) {
  let last = "";
  for (let i = 0; i < attempts; i++) {
    const r = await fetch(url, { headers: { "User-Agent": "mountain-window-app/2.1" }, cache: "no-store" });
    const txt = await r.text();
    let j: any = {};
    try {
      j = JSON.parse(txt);
    } catch {
      j = { raw: txt };
    }
    if (r.ok) return j;
    last = j.reason || j.error || `${r.status} ${r.statusText}: ${txt.slice(0, 240)}`;
    if (r.status === 429 || /concurrent|rate|too many/i.test(last)) {
      await delay(800 * (i + 1));
      continue;
    }
    break;
  }
  throw new Error(last || "request failed");
}

function urlFor(m: any, lat: number, lon: number, summitM: number, hourly = HOURLY) {
  if (!m.endpoint) return null;
  const u = new URL(m.endpoint);
  u.searchParams.set("latitude", String(lat));
  u.searchParams.set("longitude", String(lon));
  u.searchParams.set("hourly", hourly);
  u.searchParams.set("wind_speed_unit", "kmh");
  u.searchParams.set("precipitation_unit", "mm");
  u.searchParams.set("timezone", "auto");
  u.searchParams.set("forecast_days", String(Math.min(16, Math.ceil(m.maxLeadDays))));
  u.searchParams.set("elevation", String(Math.round(summitM)));
  if (m.models) u.searchParams.set("models", m.models);
  return u.toString();
}

function summarize(m: any, date: string, idx: number[], h: any) {
  const pick = (k: string) => idx.map((i) => h[k]?.[i]).filter(isNum);

  const temps = pick("temperature_2m");
  const wind = pick("wind_speed_10m");
  const gust = pick("wind_gusts_10m");
  const prec = pick("precipitation");
  const rain = pick("rain");
  const snow = pick("snowfall");
  const pressure = pick("pressure_msl");
  const freeze = pick("freezing_level_height");

  const cloud = pick("cloud_cover");
  const cloudLow = pick("cloud_cover_low");
  const cloudMid = pick("cloud_cover_mid");
  const cloudHigh = pick("cloud_cover_high");
  const shortwave = pick("shortwave_radiation");
  const direct = pick("direct_radiation");
  const diffuse = pick("diffuse_radiation");

  const w = max(gust) ?? max(wind);
  const t = avg(temps);

  if (!isNum(t) && !isNum(w) && prec.length === 0) return null;

  return {
    modelId: m.id,
    modelLabel: m.label,
    provider: m.provider,
    weight: m.weight,
    dayIndex: null,
    date,

    summitWindKph: w,
    midWindKph: isNum(w) ? w * 0.75 : null,
    valleyWindKph: isNum(w) ? w * 0.45 : null,

    summitTempC: t,
    summitTempMinC: min(temps),
    summitTempMaxC: max(temps),
    midTempC: isNum(t) ? t + 5 : null,
    valleyTempC: isNum(t) ? t + 10 : null,

    precipMm: sum(prec),
    summitRainMm: sum(rain),
    summitSnowCm: sum(snow),
    midRainMm: sum(rain),
    midSnowCm: sum(snow),
    valleyRainMm: sum(rain),
    valleySnowCm: sum(snow),

    pressureHpa: avg(pressure),
    freezingLevelM: avg(freeze),

    cloudCoverPct: avg(cloud),
    cloudCoverLowPct: avg(cloudLow),
    cloudCoverMidPct: avg(cloudMid),
    cloudCoverHighPct: avg(cloudHigh),
    shortwaveRadiationWm2: avg(shortwave),
    directRadiationWm2: avg(direct),
    diffuseRadiationWm2: avg(diffuse),
  };
}

async function fetchModel(m: any, lat: number, lon: number, summitM: number) {
  if (!m.endpoint) throw new Error(m.note || "connector not implemented");

  // First try with cloud + radiation fields. If one endpoint/model rejects a cloud/radiation variable,
  // fall back to the base weather request rather than losing the whole model.
  let j: any;
  let cloudFieldsAvailable = true;
  try {
    j = await fetchJson(urlFor(m, lat, lon, summitM, HOURLY)!);
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (/cloud_cover|shortwave|direct_radiation|diffuse_radiation|invalid variable/i.test(msg)) {
      cloudFieldsAvailable = false;
      j = await fetchJson(urlFor(m, lat, lon, summitM, BASE_HOURLY.join(","))!);
    } else {
      throw e;
    }
  }

  if (!j.hourly || !Array.isArray(j.hourly.time)) throw new Error(j.reason || j.error || "No hourly data returned");

  const by = new Map<string, number[]>();
  j.hourly.time.forEach((t: string, i: number) => {
    const k = dayKey(t);
    if (!by.has(k)) by.set(k, []);
    by.get(k)!.push(i);
  });

  const daily = [...by.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, idx], i) => {
      const x: any = summarize(m, d, idx, j.hourly);
      if (x) {
        x.dayIndex = i + 1;
        x.cloudFieldsAvailable = cloudFieldsAvailable;
      }
      return x;
    })
    .filter(Boolean)
    .filter((d: any) => d.dayIndex <= Math.ceil(m.maxLeadDays));

  if (!daily.length) throw new Error("No usable daily rows after grouping");
  return { model: m, daily };
}

function aggregate(results: any[]) {
  const maxDays = Math.max(...results.map((r) => r.daily.length));
  const days: any[] = [];

  for (let i = 0; i < maxDays; i++) {
    const vals = results
      .map((r) => {
        const d = r.daily[i];
        if (!d || d.dayIndex > Math.ceil(r.model.maxLeadDays)) return null;
        return d;
      })
      .filter(Boolean);

    if (!vals.length) continue;

    const w = (k: string) => weightedAvg(vals.map((m: any) => ({ value: m[k], weight: m.weight || 1 })));
    const wz = (k: string) => w(k) ?? 0;
    const a = (k: string) => avg(vals.map((m: any) => m[k]));

    const sw = wz("summitWindKph");
    const mt = wz("summitTempC");
    const precip = wz("precipMm");

    const ws = spread(vals.map((m: any) => m.summitWindKph));
    const ts = spread(vals.map((m: any) => m.summitTempC));
    const ps = spread(vals.map((m: any) => m.precipMm));

    const cloud = w("cloudCoverPct");
    const cloudLow = w("cloudCoverLowPct");
    const cloudMid = w("cloudCoverMidPct");
    const cloudHigh = w("cloudCoverHighPct");

    days.push({
      label: `+${i + 1}`,
      dayIndex: i + 1,
      date: vals[0].date,

      summitWindGfsKph: round1(sw - ws / 2),
      summitWindEcmwfKph: round1(sw + ws / 2),
      midWindGfsKph: round1(wz("midWindKph") - spread(vals.map((m: any) => m.midWindKph)) / 2),
      midWindEcmwfKph: round1(wz("midWindKph") + spread(vals.map((m: any) => m.midWindKph)) / 2),
      valleyWindGfsKph: round1(wz("valleyWindKph") - spread(vals.map((m: any) => m.valleyWindKph)) / 2),
      valleyWindEcmwfKph: round1(wz("valleyWindKph") + spread(vals.map((m: any) => m.valleyWindKph)) / 2),

      summitTempGfsC: round1(mt - ts / 2),
      summitTempEcmwfC: round1(mt + ts / 2),
      summitTempMinAvgC: round1(a("summitTempMinC") ?? mt),
      summitTempMaxAvgC: round1(a("summitTempMaxC") ?? mt),
      midTempGfsC: round1(wz("midTempC") - spread(vals.map((m: any) => m.midTempC)) / 2),
      midTempEcmwfC: round1(wz("midTempC") + spread(vals.map((m: any) => m.midTempC)) / 2),
      valleyTempGfsC: round1(wz("valleyTempC") - spread(vals.map((m: any) => m.valleyTempC)) / 2),
      valleyTempEcmwfC: round1(wz("valleyTempC") + spread(vals.map((m: any) => m.valleyTempC)) / 2),

      precipGfsMm: round1(precip - ps / 2),
      precipEcmwfMm: round1(precip + ps / 2),
      summitRainGfsMm: round1(wz("summitRainMm")),
      summitRainEcmwfMm: round1(wz("summitRainMm")),
      summitSnowGfsCm: round1(wz("summitSnowCm")),
      summitSnowEcmwfCm: round1(wz("summitSnowCm")),

      freezingLevelM: round0(w("freezingLevelM")),
      pressureHpa: round0(w("pressureHpa")),

      cloudCoverPct: clampPct(cloud),
      cloudCoverLowPct: clampPct(cloudLow),
      cloudCoverMidPct: clampPct(cloudMid),
      cloudCoverHighPct: clampPct(cloudHigh),
      shortwaveRadiationWm2: round1(w("shortwaveRadiationWm2")),
      directRadiationWm2: round1(w("directRadiationWm2")),
      diffuseRadiationWm2: round1(w("diffuseRadiationWm2")),

      modelStats: {
        modelCount: vals.length,
        availableModels: vals.map((m: any) => m.modelLabel),
        weightedModels: vals.map((m: any) => `${m.modelLabel} (${m.weight})`),
        windSpreadKph: round1(ws),
        tempSpreadC: round1(ts),
        precipSpreadMm: round1(ps),
        cloudSpreadPct: round1(spread(vals.map((m: any) => m.cloudCoverPct))),
      },

      modelValues: vals.map((m: any) => ({
        modelId: m.modelId,
        modelLabel: m.modelLabel,
        provider: m.provider,
        weight: m.weight,
        dayIndex: m.dayIndex,
        date: m.date,

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

        cloudCoverPct: m.cloudCoverPct,
        cloudCoverLowPct: m.cloudCoverLowPct,
        cloudCoverMidPct: m.cloudCoverMidPct,
        cloudCoverHighPct: m.cloudCoverHighPct,
        shortwaveRadiationWm2: m.shortwaveRadiationWm2,
        directRadiationWm2: m.directRadiationWm2,
        diffuseRadiationWm2: m.diffuseRadiationWm2,
        cloudFieldsAvailable: m.cloudFieldsAvailable,
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

  const u = new URL("https://archive-api.open-meteo.com/v1/archive");
  u.searchParams.set("latitude", String(lat));
  u.searchParams.set("longitude", String(lon));
  u.searchParams.set("start_date", dateStr(start));
  u.searchParams.set("end_date", dateStr(end));
  u.searchParams.set("hourly", ARCHIVE_HOURLY);
  u.searchParams.set("wind_speed_unit", "kmh");
  u.searchParams.set("precipitation_unit", "mm");
  u.searchParams.set("timezone", "auto");
  u.searchParams.set("elevation", String(Math.round(summitM)));

  try {
    const j = await fetchJson(u.toString(), 2);
    if (!j.hourly?.time) return [];

    const by = new Map<string, number[]>();
    j.hourly.time.forEach((t: string, i: number) => {
      const k = dayKey(t);
      if (!by.has(k)) by.set(k, []);
      by.get(k)!.push(i);
    });

    return [...by.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, idx]) => ({
      label: date,
      date,
      observedPrecipMm: sum(idx.map((i) => j.hourly.precipitation?.[i])),
      observedRainMm: sum(idx.map((i) => j.hourly.rain?.[i])),
      observedSnowCm: sum(idx.map((i) => j.hourly.snowfall?.[i])),
      observedWindKph: max(idx.map((i) => j.hourly.wind_speed_10m?.[i])),
      observedPressureHpa: avg(idx.map((i) => j.hourly.pressure_msl?.[i])),
      observedSummitTempC: avg(idx.map((i) => j.hourly.temperature_2m?.[i])),
      observedSummitTempMinC: min(idx.map((i) => j.hourly.temperature_2m?.[i])),
      observedSummitTempMaxC: max(idx.map((i) => j.hourly.temperature_2m?.[i])),
    }));
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat"));
  const lon = Number(u.searchParams.get("lon"));
  const summitM = Number(u.searchParams.get("summitM"));
  const region = u.searchParams.get("region") || "global";

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(summitM)) {
    return NextResponse.json({ error: "Missing or invalid lat/lon/summitM query parameters" }, { status: 400 });
  }

  const models = MODEL_CATALOG.filter((m) => applies(m, region));
  const successful: any[] = [];
  const unavailableModels: string[] = [];

  for (const m of models) {
    try {
      successful.push(await fetchModel(m, lat, lon, summitM));
      await delay(175);
    } catch (e: any) {
      unavailableModels.push(`${m.label}: ${e?.message || "unavailable"}`);
    }
  }

  if (!successful.length) {
    return NextResponse.json({ error: "No direct model feeds returned usable data", unavailableModels }, { status: 502 });
  }

  return NextResponse.json({
    source: "Direct Open-Meteo national-model feeds including total/low/mid/high cloud cover and radiation fields where supported. Elevation parameter is set to objective summit where supported. NAM/RAP are explicit NO DATA until a NOAA GRIB parser or alternate API is added.",
    unavailableModels,
    historySource: "Open-Meteo archive API daily observed/reanalysis lookback at objective summit elevation where supported.",
    history: await history(lat, lon, summitM),
    forecast: aggregate(successful),
  });
}
