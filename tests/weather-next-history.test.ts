import assert from "node:assert/strict";
import test from "node:test";
import { lookbackDates, normalizeWeatherNextHistory } from "../lib/weather-next-history";
const HOUR = 3600000;
function payload(now: number) {
  const rows = Array.from({ length: 17 * 24 + 1 }, (_, i) => {
    const valid = Math.floor(now / HOUR) * HOUR - i * HOUR;
    return { validTime: new Date(valid).toISOString(), runStart: new Date(valid - HOUR).toISOString(), forecastHour: 1, bands: { temperature_2m_mean: 273.15, wind_speed_10m_mean: 10, total_precipitation_1hr_mean: .001, total_cloud_cover_mean: .5, low_cloud_cover_mean: .2, mean_sea_level_pressure_mean: 100000 } };
  });
  return { rows };
}
test("lookback contains the prior 14 complete local dates, never today", () => {
  assert.deepEqual([lookbackDates("America/Vancouver", Date.parse("2026-10-27T03:00Z"))[0], lookbackDates("America/Vancouver", Date.parse("2026-10-27T03:00Z")).at(-1)], ["2026-10-12", "2026-10-25"]);
});
test("archive keeps surface basis, correct SI conversion, and 25-hour DST totals", () => {
  const now = Date.parse("2026-11-03T20:00Z");
  const result = normalizeWeatherNextHistory(payload(now), "America/Los_Angeles", now);
  const day = result.rows.find(r => r.date === "2026-11-01")!;
  assert.equal(day.expectedHours, 25); assert.equal(day.hoursAvailable, 25); assert.equal(day.precipHoursAvailable, 25);
  assert.equal(day.precipMm, 25); assert.equal(day.surfaceTempC, 0); assert.equal(day.surfaceWindKph, 36); assert.equal(day.pressureHpa, 1000); assert.equal(day.cloudCoverPct, 50);
  assert.equal(result.rows.length, 14); assert.equal(result.daysAvailable, 14); assert.equal((day as any).summitTempC, undefined);
});
test("midnight precipitation belongs to the preceding accumulation day", () => {
  const now = Date.parse("2026-10-27T20:00Z"), source = payload(now);
  source.rows.find(r => r.validTime === "2026-10-26T07:00:00.000Z")!.bands.total_precipitation_1hr_mean = .101;
  const days = normalizeWeatherNextHistory(source, "America/Vancouver", now).rows;
  assert.equal(days.find(r => r.date === "2026-10-25")!.precipMm, 124);
  assert.equal(days.find(r => r.date === "2026-10-26")!.precipMm, 24);
});
test("missing hours/values remain gaps; duplicate, long-lead and malformed rows cannot fill them", () => {
  const now = Date.parse("2026-10-27T20:00Z"), source: any = payload(now);
  const hour = source.rows.find((r: any) => r.validTime === "2026-10-26T18:00:00.000Z");
  source.rows = source.rows.filter((r: any) => r !== hour);
  source.rows.push({ ...hour, forecastHour: 2 }, { ...hour, runStart: "2026-10-25T17:00Z" });
  const next = source.rows.find((r: any) => r.validTime === "2026-10-25T18:00:00.000Z");
  next.bands.total_precipitation_1hr_mean = null;
  source.rows.push(next);
  const days = normalizeWeatherNextHistory(source, "America/Vancouver", now).rows;
  assert.equal(days.find(r => r.date === "2026-10-26")!.surfaceTempC, null);
  assert.equal(days.find(r => r.date === "2026-10-26")!.precipMm, null);
  assert.equal(days.find(r => r.date === "2026-10-25")!.precipMm, null);
  assert.equal(days.find(r => r.date === "2026-10-25")!.surfaceTempC, 0);
});
