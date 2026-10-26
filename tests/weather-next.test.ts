import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeWeatherNext, expectedHours, localDate, weatherNextInsight, WEATHER_NEXT_ID, WEATHER_NEXT_MODEL, WEATHER_NEXT_BANDS, weatherNextRegionPayload } from "../lib/weather-next-data";
import { aggregate, MODEL_CATALOG } from "../lib/forecast-service";
import { safeWeatherNextError, weatherNextConfiguration } from "../lib/weather-next-server";
import { scoreWindowForDays } from "../lib/weather";
import { climbs } from "../lib/climbs";

const init = "2026-10-25T00:00:00Z";
const now = Date.parse("2026-10-25T12:00:00Z");
const payload = (options: any = {}) => ({
  runStart: init,
  rows: Array.from({ length: 360 }, (_, i) => ({
    runStart: init, forecastHour: i + 1,
    // Deliberately wrong init-time system property: validTime must govern grouping.
    "system:time_start": Date.parse(init),
    validTime: new Date(Date.parse(init) + (i + 1) * 3600000).toISOString(),
    bands: {
      temperature_2m_mean: 273.15, temperature_2m_p10: 270.15, temperature_2m_p90: 276.15,
      wind_speed_10m_mean: 10, wind_speed_10m_p10: 5, wind_speed_10m_p90: 15,
      total_precipitation_1hr_mean: 0.001, total_precipitation_1hr_p10: 0, total_precipitation_1hr_p90: 0.003,
      total_cloud_cover_mean: 0.5, low_cloud_cover_mean: 0.25, medium_cloud_cover_mean: 0.4, high_cloud_cover_mean: 0.6,
      mean_sea_level_pressure_mean: 101325, surface_solar_radiation_downwards_1hr_mean: 360000,
      ...options,
    },
  })),
});
function conventional(date: string, precip = 0) {
  return { modelId: "gfs", modelLabel: "GFS", provider: "NOAA", weight: 1, includeInConsensus: true,
    dayIndex: 1, date, summitTempC: -8, summitTempMinC: -12, summitTempMaxC: -5, midTempC: -3, valleyTempC: 2,
    summitWindKph: 30, midWindKph: 20, valleyWindKph: 10, precipMm: precip,
    summitRainMm: 0, summitSnowCm: 0, freezingLevelM: 2300, pressureHpa: 1000, cloudCoverPct: 20 };
}
test("valid timestamps, SI conversion, native surface basis and 15-day horizon", () => {
  const result = normalizeWeatherNext(payload(), "America/Vancouver", now);
  assert.equal(result.daily.length, 15);
  const day = result.daily.find(d => d.completeDay)!;
  assert.equal(day.precipMm, 24);
  assert.equal(day.surfaceTempC, 0);
  assert.equal(day.surfaceWindKph, 36);
  assert.equal(day.cloudCoverPct, 50);
  assert.equal(day.pressureHpa, 1013.3);
  assert.equal(day.shortwaveRadiationWm2, 100);
  assert.equal(day.summitTempC, null);
  assert.equal(day.summitWindKph, null);
  assert.equal(day.freezingLevelM, null);
  assert.equal(day.summitSnowCm, null);
  assert.equal(day.hourly[0].surfaceTempP10C, -3);
  assert.ok(!("precipP90Mm" in day), "hourly quantiles must not be promoted to daily-total quantiles");
  assert.notEqual(result.daily[0].date, result.daily[2].date);
});
test("partial days, missing precipitation and missing cloud remain unavailable to consensus", () => {
  const result = normalizeWeatherNext(payload(), "UTC", now);
  assert.equal(result.daily[0].completeDay, false);
  assert.equal(result.daily[0].includeInConsensus, false);
  assert.equal(result.daily[0].precipMm, null);
  const broken = payload();
  broken.rows[50].bands.total_precipitation_1hr_mean = null;
  broken.rows[50].bands.total_cloud_cover_mean = null;
  const changed = normalizeWeatherNext(broken, "America/Vancouver", now).daily.find(d => d.hourly.some(h => h.forecastHour === 51))!;
  assert.equal(changed.precipMm, null);
  assert.equal(changed.cloudCoverPct, null);
});
test("DST changes use 23/25 actual hourly instants; local day alignment is explicit", () => {
  assert.equal(expectedHours("2025-03-09", "America/Edmonton"), 23);
  assert.equal(expectedHours("2025-11-02", "America/Edmonton"), 25);
  assert.equal(expectedHours("2026-10-26", "America/Edmonton"), 24);
  assert.equal(localDate("2026-10-26T03:00:00Z", "America/Vancouver"), "2026-10-25");
});
test("duplicate and inconsistent lead times cannot create complete days", () => {
  const p = payload();
  p.rows[50] = p.rows[49];
  p.rows[80].validTime = p.rows[79].validTime;
  const r = normalizeWeatherNext(p, "UTC", now);
  assert.ok(r.daily.filter(d => !d.completeDay).length >= 2);
});
test("stale runs stay visible but cannot change consensus", () => {
  const wn = normalizeWeatherNext(payload(), "UTC", Date.parse(init) + 25 * 3600000);
  assert.equal(wn.stale, true);
  assert.ok(wn.daily.every(d => !d.includeInConsensus));
  const d = wn.daily[0];
  const result = aggregate([{ model: { id: "gfs", maxLeadDays: 16 }, daily: [conventional(d.date, 4)] }, wn]);
  assert.equal((result[0].precipGfsMm + result[0].precipEcmwfMm) / 2, 4);
});
test("date joins preserve missing dates; compatible fields change scores without changing summit fields", () => {
  const wn = normalizeWeatherNext(payload(), "UTC", now);
  const d = wn.daily.find(d => d.completeDay)!;
  const base = { model: { id: "gfs", maxLeadDays: 16 }, daily: [conventional(d.date, 0), conventional("2026-11-12", 3)] };
  const old = aggregate([base]);
  const updated = aggregate([base, wn]);
  assert.equal(updated.length, 2, "WeatherNext alone cannot fabricate summit forecast days");
  assert.equal(updated[1].date, "2026-11-12");
  assert.equal(updated[1].modelValues.length, 1);
  const first = updated[0];
  assert.equal((first.summitTempGfsC + first.summitTempEcmwfC) / 2, -8);
  assert.equal((first.summitWindGfsKph + first.summitWindEcmwfKph) / 2, 30);
  assert.ok(first.modelStats.weatherNextPrecipDeltaMm > 0);
  assert.ok(Math.abs((first.precipGfsMm + first.precipEcmwfMm) / 2 - 24 * 0.75 / 1.75) < 0.11);
  assert.equal(first.modelStats.consensusModelCount, 2, "the ensemble counts as one source");
  const climb = { thresholds: { maxSummitWindKph: 40, maxPrecipMm24h: 0, maxPrecipMm3Day: 0, minFreezingLevelM: 0, maxFreezingLevelM: 9000 } } as any;
  assert.ok(scoreWindowForDays(climb, [first]) < scoreWindowForDays(climb, [old[0]]));
  assert.match(weatherNextInsight(updated)!.headline, /wetter/);
});
test("WeatherNext is global and has no objective-specific switch", () => {
  const model = MODEL_CATALOG.find(m => m.id === WEATHER_NEXT_ID)!;
  assert.ok(model.regions.includes("global"));
  assert.equal(model.maxLeadDays, 15);
  assert.ok(climbs.length >= 4);
  assert.equal(WEATHER_NEXT_MODEL.weight, 0.75);
});
test("malformed data and provider errors fail safely without leaking secrets", () => {
  assert.throws(() => normalizeWeatherNext({ rows: [] }, "UTC", now));
  assert.throws(() => normalizeWeatherNext(payload(), "Bogus/Timezone", now));
  assert.ok(!safeWeatherNextError(new Error("request failed Authorization Bearer secret-123")).includes("secret-123"));
  assert.match(safeWeatherNextError(new Error("403 permission denied")), /cannot read WeatherNext/);
  assert.equal(weatherNextConfiguration().ready, false);
});

test("point-table extraction preserves valid times, lead hours and nulls independent of column order", () => {
  const p = payload();
  const header = ["id", "time", "forecast_hour_value", ...[...WEATHER_NEXT_BANDS].reverse()];
  const first = p.rows[0];
  const raw = { runStart: init, table: [header, header.map(h => h === "id" ? "step1" : h === "time" ? Date.parse(first.validTime) : h === "forecast_hour_value" ? 1 : first.bands[h])] };
  const decoded = weatherNextRegionPayload(raw);
  assert.equal(decoded.rows[0].validTime, first.validTime);
  assert.equal(decoded.rows[0].forecastHour, 1);
  assert.equal(decoded.rows[0].bands.temperature_2m_mean, 273.15);
  assert.throws(() => weatherNextRegionPayload({runStart:init,table:[["time"],[now]]}), /schema/);
});
