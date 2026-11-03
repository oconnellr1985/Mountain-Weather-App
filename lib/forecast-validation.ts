/** Data-quality gates for daily multi-model comparisons. Never silently turn missing data into zero. */
export const finiteNumber = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

export function assessDailyCoverage(hours: number, expectedHours: number) {
  const complete = Number.isInteger(hours) && Number.isInteger(expectedHours) && hours === expectedHours;
  return { complete, hours, expectedHours, reason: complete ? null : `Partial forecast day: ${hours}/${expectedHours} hourly values` };
}
export function validateSnowfall(snowCm: number | null, precipMm: number | null) {
  if (!finiteNumber(snowCm)) return { value: null as number | null, warning: null as string | null };
  if (snowCm < 0 || snowCm > 150 || (snowCm > 10 && finiteNumber(precipMm) && precipMm < 0.5)) {
    return { value: null, warning: `Unreliable snowfall field (${snowCm.toFixed(1)} cm against ${finiteNumber(precipMm) ? precipMm.toFixed(1) : "unknown"} mm precipitation); excluded pending provider verification` };
  }
  return { value: snowCm, warning: null };
}
export function comparableWindGust(gustKph: number | null, wind10mKph: number | null) {
  return { gustKph: finiteNumber(gustKph) ? gustKph : null, wind10mKph: finiteNumber(wind10mKph) ? wind10mKph : null };
}
export function spreadRange(values: Array<number | null | undefined>) {
  const available = values.filter(finiteNumber);
  return available.length >= 2
    ? { low: Math.min(...available), high: Math.max(...available), spread: Math.max(...available) - Math.min(...available), count: available.length }
    : { low: null, high: null, spread: null, count: available.length };
}
/**
 * Qualitative operational caution only, not calibrated forecast probability.
 * Model spread means difference across comparable variables (same local day and units).
 */
export function buildForecastCautions(days: any[], maxWindKph = 30, maxDailyPrecipMm = 1) {
  return days.slice(0, 5).flatMap((day: any) => {
    const stats = day.modelStats || {};
    const c = stats.fieldModelCountsByVariable || {};
    const alerts: any[] = [];
    const precip = spreadRange((day.modelValues || []).filter((m: any) => m.includeInConsensus !== false).map((m: any) => m.precipMm));
    const gusts = spreadRange((day.modelValues || []).filter((m: any) => m.includeInConsensus !== false).map((m: any) => m.summitWindKph));
    if (precip.count >= 2 && precip.spread !== null && precip.spread >= Math.max(5, maxDailyPrecipMm)) {
      alerts.push({ date: day.date, dayIndex: day.dayIndex, kind: "precipitation", severity: "review", label: `${day.label} · precip ${precip.low?.toFixed(1)}–${precip.high?.toFixed(1)} mm (${precip.count} models)`, detail: "Large full-day precipitation disagreement: review snowfall, timing and route consequences before trusting a window score." });
    }
    if (gusts.count >= 2 && gusts.spread !== null && gusts.spread >= Math.max(20, maxWindKph * 0.6)) {
      alerts.push({ date: day.date, dayIndex: day.dayIndex, kind: "wind", severity: "review", label: `${day.label} · peak 10 m gust ${gusts.low?.toFixed(0)}–${gusts.high?.toFixed(0)} km/h (${gusts.count} models)`, detail: "Models disagree on grid-cell gusts; local terrain effects and wind exposure are unresolved." });
    }
    const partialHeavy = (day.modelValues || []).filter((m: any) => m.dailyCoverage?.complete === false && finiteNumber(m.precipMm) && m.precipMm >= Math.max(10, maxDailyPrecipMm));
    for (const m of partialHeavy) {
      alerts.push({ date: day.date, dayIndex: day.dayIndex, kind: "partial-precipitation", severity: "review", label: `${day.label} · ${m.modelLabel}: ${m.precipMm.toFixed(1)} mm in ${m.dailyCoverage.hours} h`, detail: "A limited-horizon model indicates substantial precipitation over a partial day. Excluded from full-day consensus but not dismissed as a hazard." });
    }
    return alerts;
  });
}

/**
 * Flag potentially hazardous free-air flow near summit altitude in a short forecast
 * horizon. This does not estimate terrain-specific gusts or calibrated risk.
 * At least two independent forecast model sources must supply an upper-air value.
 */
export function selectHighElevationWindExposure(days: any[], routeWindThresholdKph = 35, horizonDays = 5) {
  const level = Math.max(75, (Number.isFinite(routeWindThresholdKph) ? routeWindThresholdKph : 35) * 1.5);
  const candidates = (days || []).slice(0, horizonDays)
    .map((day: any) => ({
      date: day.date,
      dayIndex: day.dayIndex,
      freeAirKph: day.altitudeGuidance?.summitFreeAirWindKph,
      modelCount: day.altitudeGuidance?.upperAirModels ?? 0,
      thresholdKph: level,
    }))
    .filter(x => finiteNumber(x.freeAirKph) && x.modelCount >= 2 && x.freeAirKph > level);
  return candidates.sort((a, b) => b.freeAirKph - a.freeAirKph)[0] ?? null;
}
