import { test } from "node:test";
import assert from "node:assert/strict";
import { CHART_AXIS_FONT_SIZE, fieldSourceCounts, modelLabelsForMetric, modelLineStyle } from "../lib/forecast-display";
import { weatherNextRegionPayload, WEATHER_NEXT_BANDS, normalizeWeatherNext, earthEngineGridSpec } from "../lib/weather-next-data";

const gfs = { modelId: "gfs", modelLabel: "GFS", weight: 1, summitTempC: -16.8, summitWindKph: 30, precipMm: 4 };
const wn = { modelId: "weathernext_3", modelLabel: "WeatherNext 3", weight: 0.75, includeInConsensus: true, summitTempC: null, summitWindKph: null, surfaceTempC: -5.7, surfaceWindKph: 6, precipMm: 2 };

test("Earth Engine affine metadata rejects the WKT transform API and permits a safe extraction fallback", () => {
  assert.equal(earthEngineGridSpec({ crs: "EPSG:4326", transform: "PARAM_MT[Affine]" }), null);
  assert.equal(earthEngineGridSpec({ crs: "EPSG:4326", transform: [0.1, 0] }), null);
  assert.deepEqual(earthEngineGridSpec({ type: "Projection", crs: "EPSG:4326", transform: [0.1, 0, -180, 0, -0.1, 90] }), { crs: "EPSG:4326", transform: [0.1, 0, -180, 0, -0.1, 90] });
});

test("WeatherNext has a stable distinct color and is omitted from unsupported summit legends", () => {
  assert.notEqual(modelLineStyle("weathernext_3").color, modelLineStyle("gfs").color);
  assert.equal(CHART_AXIS_FONT_SIZE, 12);
  const forecast = [{ modelValues: [gfs, wn] }];
  assert.deepEqual(modelLabelsForMetric(forecast, "summitTempC").map(x => x.id), ["gfs"]);
  assert.deepEqual(modelLabelsForMetric(forecast, "summitWindKph").map(x => x.id), ["gfs"]);
  assert.deepEqual(modelLabelsForMetric(forecast, "precipMm").map(x => x.id), ["gfs", "weathernext_3"]);
  assert.equal(modelLineStyle("gfs").color, modelLineStyle(modelLabelsForMetric([{ modelValues: [wn, gfs] }], "precipMm")[1].id).color);
});

test("window source counts distinguish WeatherNext compatible fields and exclude stale/partial guidance", () => {
  const nbm = { ...gfs, modelId: "noaa_nbm", weight: 0, includeInConsensus: false };
  assert.deepEqual(fieldSourceCounts({ modelValues: [gfs, wn, nbm] }), { wind: 1, temperature: 1, precipitation: 2 });
  assert.deepEqual(fieldSourceCounts({ modelValues: [gfs, { ...wn, includeInConsensus: false }, nbm] }), { wind: 1, temperature: 1, precipitation: 1 });
});

test("native sampling retains the actual cell footprint without inventing a model elevation", () => {
  const header = ["id", "longitude", "latitude", "time", "forecast_hour_value", ...WEATHER_NEXT_BANDS];
  const runStart = "2026-10-27T06:00:00Z";
  const rows = Array.from({ length: 48 }, (_, i) => ["step" + i, 242.55, 51.25, Date.parse(runStart) + (i + 1) * 3600000, i + 1, ...WEATHER_NEXT_BANDS.map(b => b.startsWith("temperature") ? 273.15 : 0)]);
  const result = weatherNextRegionPayload({ runStart, table: [header, ...rows], grid: { crs: "EPSG:4326", transform: [0.1, 0, -180, 0, -0.1, 90] } });
  assert.equal(result.modelSurfaceElevationM, null);
  assert.ok(Math.abs(result.sampling!.longitude + 117.45) < 1e-8);
  assert.equal(result.sampling!.heightDegrees, 0.1);
  assert.ok(result.sampling!.widthKm > 6 && result.sampling!.widthKm < 8);
  const normalized = normalizeWeatherNext({ ...result, terrainContext: { status: "available", referenceMeanM: 2100, referenceMinM: 1200, referenceMaxM: 3700, modelSurfaceElevationM: null } }, "UTC", Date.parse(runStart) + 3600000);
  assert.equal(normalized.terrainContext.referenceMeanM, 2100);
  assert.equal(normalized.daily[0].surfaceTempC, 0, "DEM context must not silently adjust forecast values");
  assert.equal(normalized.daily[0].summitTempC, null);
  assert.equal(normalized.daily[0].summitWindKph, null);
  const unsupported = weatherNextRegionPayload({ runStart, table: [header, ...rows], grid: { crs: "EPSG:3857", transform: [10000, 0, 0, 0, -10000, 0] } });
  assert.equal(unsupported.sampling, null);
  assert.equal(unsupported.rows.length, 48, "missing terrain metadata must not remove weather rows");
});
