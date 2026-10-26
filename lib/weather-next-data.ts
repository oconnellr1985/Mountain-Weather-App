/** Pure WeatherNext normalization shared by the backend, UI, and tests. */
export const WEATHER_NEXT_ID = "weathernext_3";
export const WEATHER_NEXT_COLLECTION = "projects/gcp-public-data-weathernext/assets/weathernext_3_0_0_0p1deg";
export const WEATHER_NEXT_MODEL = {
  id: WEATHER_NEXT_ID, label: "WeatherNext 3", provider: "Google DeepMind via Earth Engine",
  regions: ["global"] as Array<"global">, maxLeadDays: 15, endpoint: null,
  // One ensemble is one guidance source. This provisional weight is not a skill calibration.
  weight: 0.75, includeInConsensus: true,
  note: "Native grid surface guidance; no summit adjustment, gust, rain/snow split, or freezing level.",
};
export const WEATHER_NEXT_BANDS = [
  "temperature_2m_mean", "temperature_2m_p10", "temperature_2m_p90",
  "wind_speed_10m_mean", "wind_speed_10m_p10", "wind_speed_10m_p90",
  "total_precipitation_1hr_mean", "total_precipitation_1hr_p10", "total_precipitation_1hr_p90",
  "total_cloud_cover_mean", "low_cloud_cover_mean", "medium_cloud_cover_mean", "high_cloud_cover_mean",
  "mean_sea_level_pressure_mean", "surface_solar_radiation_downwards_1hr_mean",
];
export const finite = (v: any): v is number => typeof v === "number" && Number.isFinite(v);
const mean = (v: any[]) => { const a = v.filter(finite); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
const maximum = (v: any[]) => { const a = v.filter(finite); return a.length ? Math.max(...a) : null; };
const rounded = (v: any) => finite(v) ? Math.round(v * 10) / 10 : null;
const convert = (v: any, factor = 1, offset = 0) => finite(v) ? v * factor + offset : null;
const pct = (v: any) => finite(v) ? Math.max(0, Math.min(100, v * 100)) : null;

export function localDate(instant: number | string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(instant));
  const part = (type: string) => parts.find(p => p.type === type)?.value;
  return part("year") + "-" + part("month") + "-" + part("day");
}
export function expectedHours(date: string, timeZone: string) {
  // Count actual hourly instants, including the 23/25-hour days at DST transitions.
  const anchor = Date.parse(date + "T00:00:00Z");
  let count = 0;
  for (let h = -24; h < 48; h++) if (localDate(anchor + h * 3600000, timeZone) === date) count++;
  return count;
}
export function normalizeWeatherNext(payload: any, timeZone: string, now = Date.now()) {
  if (!payload || !Array.isArray(payload.rows)) throw new Error("WeatherNext returned no hourly rows");
  const runTime = Date.parse(payload.runStart);
  if (!Number.isFinite(runTime) || runTime > now + 3600000) throw new Error("WeatherNext initialization time is invalid");
  const stale = now - runTime > 24 * 3600000;
  const today = localDate(now, timeZone);
  const dates = new Map<string, any[]>();
  const seen = new Set<number>();
  for (const row of payload.rows) {
    const valid = Date.parse(row.validTime); // end_time, never system:time_start
    const lead = Number(row.forecastHour);
    if (!Number.isFinite(valid) || !Number.isInteger(lead) || lead < 1 || lead > 360 ||
        Math.abs(valid - runTime - lead * 3600000) > 1000 || seen.has(valid)) continue;
    if (row.runStart && Date.parse(row.runStart) !== runTime) continue;
    seen.add(valid);
    const date = localDate(valid, timeZone);
    if (date < today) continue;
    const b = row.bands || {};
    const hour = {
      validTime: new Date(valid).toISOString(), forecastHour: lead,
      surfaceTempC: convert(b.temperature_2m_mean, 1, -273.15),
      surfaceTempP10C: convert(b.temperature_2m_p10, 1, -273.15),
      surfaceTempP90C: convert(b.temperature_2m_p90, 1, -273.15),
      surfaceWindKph: convert(b.wind_speed_10m_mean, 3.6),
      surfaceWindP10Kph: convert(b.wind_speed_10m_p10, 3.6),
      surfaceWindP90Kph: convert(b.wind_speed_10m_p90, 3.6),
      precipMm: convert(b.total_precipitation_1hr_mean, 1000),
      precipP10Mm: convert(b.total_precipitation_1hr_p10, 1000),
      precipP90Mm: convert(b.total_precipitation_1hr_p90, 1000),
      cloudCoverPct: pct(b.total_cloud_cover_mean),
      cloudCoverLowPct: pct(b.low_cloud_cover_mean),
      cloudCoverMidPct: pct(b.medium_cloud_cover_mean),
      cloudCoverHighPct: pct(b.high_cloud_cover_mean),
      pressureHpa: convert(b.mean_sea_level_pressure_mean, 0.01),
      shortwaveRadiationWm2: convert(b.surface_solar_radiation_downwards_1hr_mean, 1 / 3600),
    };
    if (!finite(hour.surfaceTempC) && !finite(hour.precipMm) && !finite(hour.surfaceWindKph)) continue;
    if (!dates.has(date)) dates.set(date, []);
    dates.get(date)!.push(hour);
  }
  const daily = Array.from(dates.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(0, 15).map(([date, rawHours], i) => {
    const hours = rawHours.sort((a, b) => a.validTime.localeCompare(b.validTime));
    const expected = expectedHours(date, timeZone);
    const complete = hours.length === expected;
    const full = (key: string) => complete && hours.every(h => finite(h[key]));
    // Partial-day accumulation must not be compared with the other models' full-day totals.
    const precip = full("precipMm") ? hours.reduce((sum, h) => sum + h.precipMm, 0) : null;
    const dailyMean = (key: string) => full(key) ? rounded(mean(hours.map(h => h[key]))) : null;
    return {
      modelId: WEATHER_NEXT_ID, modelLabel: WEATHER_NEXT_MODEL.label, provider: WEATHER_NEXT_MODEL.provider,
      weight: WEATHER_NEXT_MODEL.weight, includeInConsensus: complete && !stale,
      date, dayIndex: i + 1, runStart: new Date(runTime).toISOString(), timeZone, stale,
      completeDay: complete, hoursAvailable: hours.length, expectedHours: expected,
      validFrom: hours[0].validTime, validTo: hours[hours.length - 1].validTime,
      surfaceTempC: rounded(mean(hours.map(h => h.surfaceTempC))),
      surfaceWindKph: rounded(maximum(hours.map(h => h.surfaceWindKph))),
      // These fields are intentionally absent from elevation-specific consensus.
      summitTempC: null, summitTempMinC: null, summitTempMaxC: null, midTempC: null, valleyTempC: null,
      summitWindKph: null, midWindKph: null, valleyWindKph: null,
      summitRainMm: null, summitSnowCm: null, freezingLevelM: null,
      precipMm: rounded(precip), sampledPrecipMm: hours.every(h => finite(h.precipMm)) ? rounded(hours.reduce((s, h) => s + h.precipMm, 0)) : null,
      cloudCoverPct: dailyMean("cloudCoverPct"), cloudCoverLowPct: dailyMean("cloudCoverLowPct"),
      cloudCoverMidPct: dailyMean("cloudCoverMidPct"), cloudCoverHighPct: dailyMean("cloudCoverHighPct"),
      pressureHpa: dailyMean("pressureHpa"), shortwaveRadiationWm2: dailyMean("shortwaveRadiationWm2"),
      directRadiationWm2: null, diffuseRadiationWm2: null,
      hourly: hours, requestTier: "earth-engine-surface-ensemble",
      cloudFieldsAvailable: full("cloudCoverPct"), radiationFieldsAvailable: full("shortwaveRadiationWm2"), freezingLevelAvailable: false,
    };
  });
  if (!daily.length) throw new Error("WeatherNext returned no valid forecast hours for this objective");
  return { model: WEATHER_NEXT_MODEL, daily, timeZone, runStart: new Date(runTime).toISOString(), stale };
}

export function weatherNextInsight(forecast: any[] = []) {
  const days = forecast.map(day => ({ day, value: day.modelValues?.find((m: any) => m.modelId === WEATHER_NEXT_ID) })).filter(x => x.value);
  if (!days.length) return null;
  const near = days.filter(x => x.day.dayIndex <= 3);
  const contributing = near.filter(x => x.value.includeInConsensus && finite(x.value.precipMm));
  const delta = contributing.reduce((s, x) => s + (x.day.modelStats?.weatherNextPrecipDeltaMm || 0), 0);
  const total = contributing.reduce((s, x) => s + x.value.precipMm, 0);
  const latest = days[0].value;
  const direction = delta > 0.05 ? "wetter" : delta < -0.05 ? "drier" : "little changed";
  return {
    headline: latest.stale ? "WeatherNext run is stale; excluded from consensus" :
      contributing.length ? "WeatherNext makes the near-term precipitation consensus " + direction : "WeatherNext available as partial-day guidance",
    detail: contributing.length
      ? "Across " + contributing.length + " complete local day(s) in the first three forecast days, WeatherNext predicts " + total.toFixed(1) +
        " mm and changes the weighted precipitation total by " + (delta >= 0 ? "+" : "") + delta.toFixed(1) +
        " mm. Precipitation, cloud, pressure and solar guidance feed the route analysis where complete. Surface temperature and wind are shown separately."
      : "Incomplete local days and stale runs do not change the consensus. Surface temperature and wind are native grid guidance, without a summit adjustment.",
    runStart: latest.runStart, coveredDays: days.length, contributingDays: contributing.length,
  };
}

/** Decode Earth Engine getRegion output by column name rather than fixed offsets. */
export function weatherNextRegionPayload(raw: any) {
  if (!raw || !Array.isArray(raw.table) || raw.table.length < 2 || !Array.isArray(raw.table[0])) throw new Error("WeatherNext point table is empty");
  const header: string[] = raw.table[0];
  const timeIndex = header.indexOf("time"), leadIndex = header.indexOf("forecast_hour_value");
  if (timeIndex < 0 || leadIndex < 0 || WEATHER_NEXT_BANDS.some(b => !header.includes(b))) throw new Error("WeatherNext point table schema is incomplete");
  const rows = raw.table.slice(1).filter(Array.isArray).map((row: any[]) => ({
    runStart: raw.runStart,
    validTime: finite(row[timeIndex]) ? new Date(row[timeIndex]).toISOString() : "",
    forecastHour: row[leadIndex],
    bands: Object.fromEntries(WEATHER_NEXT_BANDS.map(b => [b, row[header.indexOf(b)] ?? null])),
  }));
  return { runStart: raw.runStart, rows };
}
