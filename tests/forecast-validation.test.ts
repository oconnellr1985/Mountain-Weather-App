import { test } from "node:test";
import assert from "node:assert/strict";
import { assessDailyCoverage, validateSnowfall, comparableWindGust, spreadRange, buildForecastCautions, selectHighElevationWindExposure } from "../lib/forecast-validation";
import { aggregate } from "../lib/forecast-service";

test("partial future-day RDPS guidance is excluded from complete-day consensus, but its significant warning survives", () => {
  const a = { modelId:"gfs", modelLabel:"GFS", includeInConsensus:true, weight:1, date:"2026-11-06", dayIndex:1, summitWindKph:30, summitTempC:-10, precipMm:5.6, dailyCoverage:assessDailyCoverage(24,24) };
  const b = { modelId:"rdps", modelLabel:"GEM RDPS", includeInConsensus:false, weight:1, date:"2026-11-06", dayIndex:1, summitWindKph:40, summitTempC:-11, precipMm:39.5, dailyCoverage:assessDailyCoverage(17,24) };
  const c = { modelId:"ecmwf", modelLabel:"ECMWF", includeInConsensus:true, weight:1, date:"2026-11-06", dayIndex:1, summitWindKph:50, summitTempC:-12, precipMm:17.7, dailyCoverage:assessDailyCoverage(24,24) };
  const forecast = aggregate([{model:{id:"gfs",maxLeadDays:16},daily:[a]},{model:{id:"rdps",maxLeadDays:3.5},daily:[b]},{model:{id:"ecmwf",maxLeadDays:15},daily:[c]}]);
  assert.equal(forecast[0].modelStats.precipSpreadMm, 12.1);
  assert.equal(forecast[0].modelStats.consensusModelCount, 2);
  assert.equal(forecast[0].modelStats.partialDayModels[0].hours, 17);
  const alerts=buildForecastCautions(forecast,30,1);
  assert.ok(alerts.some(x=>x.kind==="partial-precipitation" && x.label.includes("39.5")));
  assert.ok(alerts.some(x=>x.kind==="precipitation" && x.label.includes("5.6–17.7")));
});
test("implausible provider snowfall cannot contaminate the snow totals", () => {
  assert.deepEqual(validateSnowfall(840,0),{value:null,warning:"Unreliable snowfall field (840.0 cm against 0.0 mm precipitation); excluded pending provider verification"});
  assert.equal(validateSnowfall(27.6,39.5).value,27.6);
  assert.equal(validateSnowfall(0,0).value,0);
  assert.equal(validateSnowfall(null,0).value,null);
});
test("peak 10 m mean wind cannot be compared as peak gust", () => {
  assert.deepEqual(comparableWindGust(null,5.4),{gustKph:null,wind10mKph:5.4});
  assert.deepEqual(comparableWindGust(40,17),{gustKph:40,wind10mKph:17});
  assert.deepEqual(spreadRange([2.9,41.4,45,null]),{low:2.9,high:45,spread:42.1,count:3});
});
test("comparable ranges have null spreads when only one model remains", () => {
  assert.deepEqual(assessDailyCoverage(17,24),{complete:false,hours:17,expectedHours:24,reason:"Partial forecast day: 17/24 hourly values"});
  assert.equal(spreadRange([null,4]).spread,null);
  assert.equal(spreadRange([null,null]).count,0);
});

test("exposure warning uses multiple upper-air model sources and the same lookahead window as the operational summary", () => {
  const days = Array.from({ length: 6 }, (_, i) => ({ date: `2026-11-${String(i + 3).padStart(2,"0")}`, dayIndex: i + 1,
    altitudeGuidance: { summitFreeAirWindKph: [45, 68, 78, 124.8, 80, 240][i], upperAirModels: [3,4,4,4,1,4][i] } }));
  const warning = selectHighElevationWindExposure(days, 30);
  assert.equal(warning?.date, "2026-11-06");
  assert.equal(warning?.freeAirKph, 124.8);
  assert.equal(warning?.modelCount, 4);
  assert.equal(selectHighElevationWindExposure(days.slice(0, 2), 30), null);
  assert.equal(selectHighElevationWindExposure([{date:"2026-11-03", dayIndex:1, altitudeGuidance:{summitFreeAirWindKph:110,upperAirModels:1}}],30),null);
  assert.equal(selectHighElevationWindExposure([],30),null);
});
test("production 840 cm outlier cannot distort weighted summit snow totals", () => {
  const good = { modelId:"gfs", modelLabel:"GFS", weight:1, includeInConsensus:true, date:"2026-11-03", dayIndex:1, summitTempC:-10, summitWindKph:20, summitSnowCm:0.42, precipMm:0.6 };
  const validated = validateSnowfall(840,0);
  const anomalous = { modelId:"hrdps_west", modelLabel:"HRDPS West", weight:1.3, includeInConsensus:true, date:"2026-11-03", dayIndex:1, summitTempC:-9, summitWindKph:25, summitSnowCm:validated.value, rawSummitSnowCm:840, precipMm:0, dataQualityWarnings:[validated.warning] };
  const day=aggregate([{model:{id:"gfs",maxLeadDays:16},daily:[good]},{model:{id:"hrdps_west",maxLeadDays:2},daily:[anomalous]}])[0];
  assert.equal(day.summitSnowGfsCm,0.4);
  assert.equal(day.summitSnowEcmwfCm,0.4);
  assert.ok(day.modelStats.dataQualityWarnings.some(w=>w.includes("840.0 cm")));
});
