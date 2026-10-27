import { expectedHours, finite, localDate, weatherNextRegionPayload } from "./weather-next-data";
const HOUR = 3600000;
export function lookbackDates(timeZone: string, now = Date.now()) {
  const today = localDate(now, timeZone);
  const anchor = Date.parse(today + "T12:00:00Z");
  return Array.from({ length: 14 }, (_, i) => new Date(anchor - (14 - i) * 86400000).toISOString().slice(0, 10));
}
/** Decode each initialization independently; never treat a rolling archive as one run. */
export function decodeWeatherNextHistory(raw: any) {
  const payload = weatherNextRegionPayload(raw);
  const header = raw.table[0] as string[];
  const init = header.indexOf("run_start_millis");
  if (init < 0) throw new Error("WeatherNext archive is missing initialization times");
  payload.rows.forEach((row: any, index: number) => { const value = raw.table[index + 1][init]; row.runStart = finite(value) ? new Date(value).toISOString() : ""; });
  return payload;
}
export function normalizeWeatherNextHistory(payload: any, timeZone: string, now = Date.now()) {
  const dates = lookbackDates(timeZone, now);
  const samples = new Map<number, any>();
  for (const row of payload?.rows || []) {
    const valid = Date.parse(row.validTime), init = Date.parse(row.runStart);
    if (!finite(valid) || !finite(init) || row.forecastHour !== 1 || valid > now || Math.abs(valid - init - HOUR) > 1000 || samples.has(valid)) continue;
    samples.set(valid, row);
  }
  const mean = (values: any[]) => values.length && values.every(finite) ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const round = (v: any) => finite(v) ? (Math.round(v * 10) / 10 || 0) : null;
  const rows = dates.map((date, i) => {
    const expected = expectedHours(date, timeZone);
    const hours = Array.from(samples.entries()).filter(([valid]) => localDate(valid, timeZone) === date).map(([, row]) => row);
    // Accumulations end at validTime: the interval ending at local midnight belongs to the preceding day.
    const precipHours = Array.from(samples.entries()).filter(([valid]) => localDate(valid - 1, timeZone) === date).map(([, row]) => row);
    const field = (band: string, factor = 1, offset = 0) => hours.length === expected ? round((v => finite(v) ? v * factor + offset : null)(mean(hours.map(h => h.bands?.[band])))) : null;
    const temps = hours.map(h => h.bands?.temperature_2m_mean);
    const wind = hours.map(h => h.bands?.wind_speed_10m_mean);
    const precipitation = precipHours.map(h => h.bands?.total_precipitation_1hr_mean);
    return { date, label: `D-${14 - i}`, hoursAvailable: hours.length, precipHoursAvailable: precipHours.length, expectedHours: expected, completeDay: hours.length === expected && precipHours.length === expected,
      surfaceTempC: field("temperature_2m_mean", 1, -273.15),
      surfaceTempMinC: hours.length === expected && temps.every(finite) ? round(Math.min(...temps) - 273.15) : null,
      surfaceTempMaxC: hours.length === expected && temps.every(finite) ? round(Math.max(...temps) - 273.15) : null,
      surfaceWindKph: hours.length === expected && wind.every(finite) ? round(Math.max(...wind) * 3.6) : null,
      precipMm: precipHours.length === expected && precipitation.every(finite) ? round(precipitation.reduce((a, b) => a + b, 0) * 1000) : null,
      cloudCoverPct: field("total_cloud_cover_mean", 100), cloudCoverLowPct: field("low_cloud_cover_mean", 100), pressureHpa: field("mean_sea_level_pressure_mean", .01),
    };
  });
  if (!rows.some(r => r.hoursAvailable > 0)) throw new Error("No WeatherNext archive hours were returned in the lookback window");
  return { status: "available", timeZone, source: "Google WeatherNext 3 via Earth Engine", leadHours: 1, rows, daysAvailable: rows.filter(r => r.completeDay).length, sampling: payload.sampling || null,
    note: "Archived one-hour-ahead ensemble means, not observations. Native grid surface temperature and wind are not summit-adjusted. No rain/snow partition or freezing level is available. Missing hours remain gaps; daily precipitation sums the hourly means, not percentiles.",
    attribution: "© 2026 DeepMind Technologies Limited's machine learning models used to create the experimental data made available at https://developers.google.com/earth-engine/datasets/catalog/projects_gcp-public-data-weathernext_assets_weathernext_3_0_0_0p1deg under CC BY 4.0 licence terms." };
}
