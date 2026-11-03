import { test } from "node:test";
import assert from "node:assert/strict";
import { PRESSURE_LEVELS, pressureLevelsForHour, interpolateFreeAirWind, summarizePressureProfile, approximateWetBulbC, diagnosePrecipitationPhase, precipitationCategoryAgreement, parseElevationResponse } from "../lib/vertical-guidance";

const p = [
  { pressureHpa: 850, heightM: 1500, windKph: 12, relativeHumidityPct: 89 },
  { pressureHpa: 700, heightM: 3100, windKph: 42, relativeHumidityPct: 94 },
  { pressureHpa: 600, heightM: 4300, windKph: 58, relativeHumidityPct: 71 },
];
test("pressure-level interpolation uses model geopotential heights, never fixed 45% or 75% scalings", () => {
  assert.equal(interpolateFreeAirWind(p, 2300), 27);
  assert.equal(interpolateFreeAirWind(p, 3700), 50);
  assert.equal(interpolateFreeAirWind(p, 1000), null);
  assert.equal(interpolateFreeAirWind(p, 4700), null);
  assert.equal(interpolateFreeAirWind(p, NaN), null);
  assert.equal(interpolateFreeAirWind([], 2500), null);
  assert.equal(interpolateFreeAirWind([p[0], { ...p[1], heightM: 4400 }], 2000), null);
});
test("hourly profile summary preserves missingness and level-specific humidity", () => {
  const hourly: Record<string, any> = { time: ["2026-11-04T00:00"] };
  for (const level of PRESSURE_LEVELS) {
    hourly[`wind_speed_${level}hPa`] = [null];
    hourly[`geopotential_height_${level}hPa`] = [null];
    hourly[`relative_humidity_${level}hPa`] = [null];
  }
  for (const a of p) {
    hourly[`wind_speed_${a.pressureHpa}hPa`][0] = a.windKph;
    hourly[`geopotential_height_${a.pressureHpa}hPa`][0] = a.heightM;
    hourly[`relative_humidity_${a.pressureHpa}hPa`][0] = a.relativeHumidityPct;
  }
  const profile = summarizePressureProfile(hourly, [0], { summit: 3700, mid: 2300, lower: 1000 });
  assert.equal(profile.summitFreeAirWindKph, 50);
  assert.equal(profile.midFreeAirWindKph, 27);
  assert.equal(profile.lowerFreeAirWindKph, null);
  assert.equal(profile.levelData.find(x => x.pressureHpa === 700)?.relativeHumidityPct, 94);
  assert.equal(pressureLevelsForHour(hourly, 0).find(x => x.pressureHpa === 925)?.windKph, null);
});
test("wet bulb and near-freezing precipitation diagnostics do not reclassify precipitation", () => {
  assert.equal(approximateWetBulbC(null, -2), null);
  assert.ok((approximateWetBulbC(1, 0) ?? 10) < 1);
  const hourly = {
    precipitation: [1.5, 4, 0, null], temperature_2m: [0.8, -12, 1, 1],
    dew_point_2m: [0, -15, 1, 0], freezing_level_height: [3250, 1200, 2700, 2800],
  };
  const phase = diagnosePrecipitationPhase(hourly, [0, 1, 2, 3], 3100);
  assert.equal(phase.precipHours, 2);
  assert.equal(phase.uncertainHours, 1);
  assert.equal(phase.uncertainPrecipMm, 1.5);
  assert.equal(diagnosePrecipitationPhase({ precipitation: [2] }, [0], 3200).status, "not-assessable");
  assert.equal(diagnosePrecipitationPhase({ precipitation: [0] }, [0], 3200).status, "dry");
});
test("precipitation agreement ignores missing rather than zero-filling it", () => {
  assert.deepEqual(precipitationCategoryAgreement([null]), { status: "insufficient-models", modelCount: 0, agreementFraction: null, categories: {} });
  const agreement = precipitationCategoryAgreement([0, 0.2, 0.3, 12, null]);
  assert.equal(agreement.modelCount, 4);
  assert.equal(agreement.agreementFraction, 0.5);
  assert.equal(agreement.categories.trace, 2);
});
test("multi elevation responses must be complete and keep target ordering", () => {
  const rows = [1000, 2000, 3000].map((elevation) => ({ elevation, hourly: { time: ["2026-11-04T00:00"], temperature_2m: [elevation / 100] } }));
  assert.deepEqual(parseElevationResponse(rows, 3).map(x => x.elevation), [1000, 2000, 3000]);
  assert.throws(() => parseElevationResponse(rows.slice(0, 2), 3), /incomplete elevation/);
  assert.deepEqual(parseElevationResponse(rows[0], 1), [rows[0]]);
});
