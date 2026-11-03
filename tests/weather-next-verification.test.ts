import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyPrecipitation } from "../lib/weather-next-verification";

test("station verification pairs the main-cycle lead band and includes the local midnight interval", () => {
  const start = Date.parse("2026-10-25T07:00:00Z");
  const hourMs = 3600000;
  const lead = 48;
  const observations = new Map<number, number>();
  const rows = Array.from({ length: 24 }, (_, i) => {
    const valid = start + (i + 1) * hourMs;
    observations.set(valid, i === 0 ? 1 : 0);
    const actualLead = lead + new Date(valid).getUTCHours() % 6;
    return {
      validTime: new Date(valid).toISOString(),
      runStart: new Date(valid - actualLead * hourMs).toISOString(),
      forecastHour: actualLead,
      bands: { total_precipitation_1hr_mean: i === 23 ? 0.002 : 0 },
    };
  });
  const now = start + 2 * 86400000;
  const full = verifyPrecipitation(rows, observations, lead, "America/Vancouver", now);
  assert.equal(full.hours, 24);
  assert.equal(full.completeDays, 1);
  assert.equal(full.misses, 1);
  assert.equal(full.falseAlarms, 1);
  assert.equal(full.dailyBiasMm, 1);
  assert.equal(full.dailyMaeMm, 1);
  assert.equal(verifyPrecipitation(rows, observations, 24, "America/Vancouver", now).hours, 0);
  observations.delete(start + hourMs);
  assert.equal(verifyPrecipitation(rows, observations, lead, "America/Vancouver", now).dailyMaeMm, null);
});
