import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SPOTWX_BASE_URL = "https://spotwx.io/api.php";
const LAPSE_RATE_C_PER_1000M = 6.5;

const MODEL_CATALOG = [
  { id: "gfs", label: "GFS", provider: "SpotWX / NOAA", maxLeadDays: 16, regions: ["global"] },
  { id: "geps", label: "GEPS", provider: "SpotWX / ECCC ensemble", maxLeadDays: 16, regions: ["canada"] },
  { id: "gdps", label: "GDPS", provider: "SpotWX / ECCC", maxLeadDays: 10, regions: ["global"] },
  { id: "rdps", label: "RDPS", provider: "SpotWX / ECCC", maxLeadDays: 3.5, regions: ["canada"] },
  { id: "hrdps_continental", label: "HRDPS Continental", provider: "SpotWX / ECCC", maxLeadDays: 2, regions: ["canada"] },
  { id: "hrdps_1km_west", label: "HRDPS 1km West", provider: "SpotWX / ECCC", maxLeadDays: 2, regions: ["canada"] },
  { id: "nam", label: "NAM", provider: "SpotWX / NOAA", maxLeadDays: 4, regions: ["usa"] },
  { id: "hrrr", label: "HRRR", provider: "SpotWX / NOAA", maxLeadDays: 2, regions: ["usa"] },
  { id: "rap", label: "RAP", provider: "SpotWX / NOAA", maxLeadDays: 1, regions: ["usa"] },
  { id: "ecmwf_ifs", label: "ECMWF IFS", provider: "SpotWX / ECMWF", maxLeadDays: 10, regions: ["global"] },
  { id: "ecmwf_aifs_single", label: "ECMWF AIFS", provider: "SpotWX / ECMWF", maxLeadDays: 16, regions: ["global"] },
];

function appliesToRegion(model: any, region: string) {
  return model.regions.includes("global") || model.regions.includes(region);
}

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function avg(values: any[]) {
  const clean = values.map(toNumber).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  return clean.length ? clean.reduce((s, v) => s + v, 0) / clean.length : null;
}

function sum(values: any[]) {
  return values.map(toNumber).filter((v): v is number => typeof v === "number" && Number.isFinite(v)).reduce((s, v) => s + v, 0);
}

function max(values: any[]) {
  const clean = values.map(toNumber).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  return clean.length ? Math.max(...clean) : null;
}

function min(values: any[]) {
  const clean = values.map(toNumber).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  return clean.length ? Math.min(...clean) : null;
}

function spread(values: any[]) {
  const clean = values.map(toNumber).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  return clean.length > 1 ? Math.max(...clean) - Math.min(...clean) : 0;
}

function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCsv(text: string) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const row: any = {};
    headers.forEach((header, i) => {
      row[header] = cols[i] ?? "";
    });
    return row;
  });
}

function parseMaybeJsonOrCsv(text: string) {
  const trimmed = text.trim();

  try {
    const json = JSON.parse(trimmed);

    if (Array.isArray(json)) return json;
    if (Array.isArray(json.forecast)) return json.forecast;
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.rows)) return json.rows;

    return [json];
  } catch {
    return parseCsv(text);
  }
}

function getFirstValue(row: any, candidates: string[]) {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== "") return row[key];
  }

  const lowerMap: any = {};
  for (const key of Object.keys(row || {})) lowerMap[key.toLowerCase()] = row[key];

  for (const key of candidates) {
    const value = lowerMap[key.toLowerCase()];
    if (value !== undefined && value !== "") return value;
  }

  return null;
}

function parseDateFromRow(row: any): Date | null {
  const raw =
    getFirstValue(row, ["DATETIME", "datetime", "valid_time", "time", "date_time", "DATE_TIME"]) ||
    getFirstValue(row, ["DATE", "date"]);

  if (!raw) return null;

  const normalized = String(raw).replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    const fallback = new Date(String(raw));
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  return date;
}

function ymd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getTimezoneOffsetFromLon(lon: number) {
  return Math.max(-12, Math.min(14, Math.round(lon / 15)));
}

function buildSpotWxUrl(params: Record<string, string | number>) {
  const url = new URL(SPOTWX_BASE_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  return url.toString();
}

async function fetchSpotWxRows(params: Record<string, string | number>) {
  const url = buildSpotWxUrl(params);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "mountain-window-app/1.0",
      Accept: "text/csv, application/json, text/plain, */*",
    },
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 250)}`);
  }

  if (!text.trim()) {
    throw new Error("empty SpotWX response");
  }

  if (/invalid|unauthorized|forbidden|api key/i.test(text) && text.length < 500) {
    throw new Error(text.slice(0, 250));
  }

  const rows = parseMaybeJsonOrCsv(text);

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`no parseable rows; response starts: ${text.slice(0, 250)}`);
  }

  return { rows, sample: text.slice(0, 300) };
}

async function fetchMetadata(modelId: string, key: string, lat: number, lon: number, tz: number) {
  try {
    const { rows } = await fetchSpotWxRows({
      key,
      lat,
      lon,
      model: modelId,
      output: "metadata",
      tz,
    });

    const row = rows[0] || {};

    const elevation =
      toNumber(getFirstValue(row, [
        "HEIGHT",
        "HGT",
        "ELEVATION",
        "ELEV",
        "MODEL_HEIGHT",
        "MODEL_ELEVATION",
        "model_height",
        "model_elevation",
        "height",
        "elevation",
        "ASL",
      ]));

    return {
      row,
      modelElevationM: elevation,
    };
  } catch (error: any) {
    return {
      row: null,
      modelElevationM: null,
      error: error.message || "metadata fetch failed",
    };
  }
}

function adjustTempToSummit(rawTempC: number | null, modelElevationM: number | null, summitM: number) {
  if (rawTempC === null) return null;
  if (modelElevationM === null || !Number.isFinite(modelElevationM)) return rawTempC;

  const elevationDeltaM = summitM - modelElevationM;
  return rawTempC - (elevationDeltaM / 1000) * LAPSE_RATE_C_PER_1000M;
}

function normalizeHourlyRow(row: any, model: any, metadata: any, summitM: number) {
  const date = parseDateFromRow(row);
  if (!date) return null;

  const rawTempC = toNumber(getFirstValue(row, ["TMP", "T", "TEMP", "temperature"]));
  const summitTempC = adjustTempToSummit(rawTempC, metadata.modelElevationM, summitM);

  const windKph =
    toNumber(getFirstValue(row, ["WSPD", "WIND", "WIND_SPEED", "wind_speed"])) ??
    toNumber(getFirstValue(row, ["WSPD_10M", "WIND_10M"]));

  const precipMm =
    toNumber(getFirstValue(row, ["PRECIP_int", "PRECIP_INT", "APCP", "PCPN", "PRECIP", "precip"])) ??
    0;

  const rainMm =
    toNumber(getFirstValue(row, ["RQP", "RAIN", "rain"])) ??
    (summitTempC !== null && summitTempC > 1 ? precipMm : 0);

  const snowCm =
    toNumber(getFirstValue(row, ["SQP", "SNOW", "snow"])) ??
    (summitTempC !== null && summitTempC <= 1 ? precipMm : 0);

  const pressureHpa =
    toNumber(getFirstValue(row, ["SLP", "MSLP", "PRESSURE", "pressure"])) ??
    null;

  const freezingLevelM =
    toNumber(getFirstValue(row, ["HGT_DRYBULB_0C", "HGT_WETBULB_0C", "HGT_SNOWLVL", "FREEZING_LEVEL"])) ??
    null;

  return {
    date,
    modelId: model.id,
    modelLabel: model.label,
    provider: model.provider,
    modelElevationM: metadata.modelElevationM,
    rawModelTempC: rawTempC,
    summitTempC,
    windKph,
    precipMm,
    rainMm,
    snowCm,
    pressureHpa,
    freezingLevelM,
  };
}

function groupHourlyToDaily(hourlyRows: any[], model: any, summitM: number) {
  const byDate = new Map<string, any[]>();

  for (const row of hourlyRows) {
    if (!row?.date) continue;
    const day = ymd(row.date);
    if (!byDate.has(day)) byDate.set(day, []);
    byDate.get(day)!.push(row);
  }

  const sortedDays = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));

  return sortedDays.map(([date, rows], index) => {
    const summitTemps = rows.map((r) => r.summitTempC).filter((v) => typeof v === "number");
    const winds = rows.map((r) => r.windKph).filter((v) => typeof v === "number");
    const precip = rows.map((r) => r.precipMm).filter((v) => typeof v === "number");
    const rain = rows.map((r) => r.rainMm).filter((v) => typeof v === "number");
    const snow = rows.map((r) => r.snowCm).filter((v) => typeof v === "number");
    const pressures = rows.map((r) => r.pressureHpa).filter((v) => typeof v === "number");
    const freezingLevels = rows.map((r) => r.freezingLevelM).filter((v) => typeof v === "number");

    const summitTempAvg = avg(summitTemps);
    const summitTempMin = min(summitTemps);
    const summitTempMax = max(summitTemps);

    return {
      modelId: model.id,
      modelLabel: model.label,
      provider: model.provider,
      dayIndex: index + 1,
      date,
      modelElevationM: rows[0]?.modelElevationM ?? null,
      summitTempC: summitTempAvg,
      summitTempMinC: summitTempMin,
      summitTempMaxC: summitTempMax,
      summitWindKph: max(winds),
      midWindKph: max(winds) !== null ? max(winds)! * 0.75 : null,
      valleyWindKph: max(winds) !== null ? max(winds)! * 0.45 : null,
      midTempC: summitTempAvg !== null ? summitTempAvg + 5 : null,
      valleyTempC: summitTempAvg !== null ? summitTempAvg + 10 : null,
      precipMm: sum(precip),
      summitRainMm: sum(rain),
      summitSnowCm: sum(snow),
      midRainMm: sum(rain),
      midSnowCm: sum(snow),
      valleyRainMm: sum(rain),
      valleySnowCm: sum(snow),
      pressureHpa: avg(pressures),
      freezingLevelM: avg(freezingLevels),
    };
  }).filter((day) => {
    return (
      typeof day.summitTempC === "number" ||
      typeof day.summitWindKph === "number" ||
      typeof day.precipMm === "number"
    );
  });
}

async function fetchModelForecast(model: any, key: string, lat: number, lon: number, summitM: number, tz: number) {
  const metadata = await fetchMetadata(model.id, key, lat, lon, tz);

  const { rows, sample } = await fetchSpotWxRows({
    key,
    lat,
    lon,
    model: model.id,
    format: "csv",
    output: "forecast",
    tz,
  });

  const hourly = rows
    .map((row: any) => normalizeHourlyRow(row, model, metadata, summitM))
    .filter(Boolean);

  if (!hourly.length) {
    throw new Error(`no usable hourly rows; sample: ${sample}`);
  }

  const daily = groupHourlyToDaily(hourly, model, summitM)
    .filter((day) => day.dayIndex <= Math.ceil(model.maxLeadDays));

  if (!daily.length) {
    throw new Error("no usable daily rows after grouping");
  }

  return {
    model,
    metadata,
    daily,
  };
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
        if (day.pressureHpa !== null && day.pressureHpa < 800) return null;
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

      summitWindGfsKph: Number((meanSummitWind - summitWindSpread / 2).toFixed(1)),
      summitWindEcmwfKph: Number((meanSummitWind + summitWindSpread / 2).toFixed(1)),

      midWindGfsKph: Number((meanMidWind - midWindSpread / 2).toFixed(1)),
      midWindEcmwfKph: Number((meanMidWind + midWindSpread / 2).toFixed(1)),

      valleyWindGfsKph: Number((meanValleyWind - valleyWindSpread / 2).toFixed(1)),
      valleyWindEcmwfKph: Number((meanValleyWind + valleyWindSpread / 2).toFixed(1)),

      summitTempGfsC: Number((meanSummitTemp - summitTempSpread / 2).toFixed(1)),
      summitTempEcmwfC: Number((meanSummitTemp + summitTempSpread / 2).toFixed(1)),
      summitTempMinAvgC: Number((avg(modelValues.map((m) => m.summitTempMinC)) ?? meanSummitTemp).toFixed(1)),
      summitTempMaxAvgC: Number((avg(modelValues.map((m) => m.summitTempMaxC)) ?? meanSummitTemp).toFixed(1)),

      midTempGfsC: Number((meanMidTemp - midTempSpread / 2).toFixed(1)),
      midTempEcmwfC: Number((meanMidTemp + midTempSpread / 2).toFixed(1)),

      valleyTempGfsC: Number((meanValleyTemp - valleyTempSpread / 2).toFixed(1)),
      valleyTempEcmwfC: Number((meanValleyTemp + valleyTempSpread / 2).toFixed(1)),

      precipGfsMm: Number((meanPrecip - precipSpread / 2).toFixed(1)),
      precipEcmwfMm: Number((meanPrecip + precipSpread / 2).toFixed(1)),

      summitRainGfsMm: Number((avg(modelValues.map((m) => m.summitRainMm)) ?? 0).toFixed(1)),
      summitRainEcmwfMm: Number((avg(modelValues.map((m) => m.summitRainMm)) ?? 0).toFixed(1)),

      summitSnowGfsCm: Number((avg(modelValues.map((m) => m.summitSnowCm)) ?? 0).toFixed(1)),
      summitSnowEcmwfCm: Number((avg(modelValues.map((m) => m.summitSnowCm)) ?? 0).toFixed(1)),

      freezingLevelM: Math.round(avg(modelValues.map((m) => m.freezingLevelM)) ?? 0),
      pressureHpa: Math.round(avg(modelValues.map((m) => m.pressureHpa)) ?? 0),

      modelStats: {
        modelCount: modelValues.length,
        availableModels: modelValues.map((m) => m.modelLabel),
        windSpreadKph: Number(summitWindSpread.toFixed(1)),
        tempSpreadC: Number(summitTempSpread.toFixed(1)),
        precipSpreadMm: Number(precipSpread.toFixed(1)),
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
      })),
    });
  }

  return days;
}

function buildHistoryPlaceholder() {
  return [];
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const key = process.env.SPOTWX_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Missing SPOTWX_API_KEY environment variable" },
      { status: 500 }
    );
  }

  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  const summitM = Number(url.searchParams.get("summitM"));
  const region = url.searchParams.get("region") || "global";

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(summitM)) {
    return NextResponse.json(
      { error: "Missing or invalid lat/lon/summitM query parameters" },
      { status: 400 }
    );
  }

  const tz = getTimezoneOffsetFromLon(lon);

  const models = MODEL_CATALOG.filter((model) => appliesToRegion(model, region));

  const settled = await Promise.allSettled(
    models.map((model) => fetchModelForecast(model, key, lat, lon, summitM, tz))
  );

  const successful = settled
    .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
    .map((result) => result.value);

  const unavailableModels = settled.map((result, index) => {
    const model = models[index];
    if (result.status === "fulfilled") return null;
    return `${model.label}: ${result.reason?.message || "unavailable"}`;
  }).filter(Boolean);

  if (!successful.length) {
    return NextResponse.json(
      {
        error: "No SpotWX models returned usable data",
        unavailableModels,
      },
      { status: 502 }
    );
  }

  const forecast = aggregateModelDays(successful);

  if (!forecast.length) {
    return NextResponse.json(
      {
        error: "SpotWX models were fetched but no daily forecast rows could be aggregated",
        unavailableModels,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    source: `Live SpotWX forecast. Temperatures adjusted to summit using ${LAPSE_RATE_C_PER_1000M}°C/km lapse rate when model elevation metadata is available.`,
    unavailableModels,
    history: buildHistoryPlaceholder(),
    forecast,
  });
}
