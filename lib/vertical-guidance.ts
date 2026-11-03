/**
 * Model-native vertical guidance. Pressure-level winds describe the free atmosphere,
 * NOT terrain-exposed 10 m summit winds or sheltered valley winds.
 */
export const PRESSURE_LEVELS = [925, 850, 700, 600, 500, 400] as const;
export const PROFILE_VARIABLES = PRESSURE_LEVELS.flatMap(level => [
  `geopotential_height_${level}hPa`,
  `wind_speed_${level}hPa`,
  `relative_humidity_${level}hPa`,
]);
export const isFiniteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const round = (v: number, decimals = 1) => Number(v.toFixed(decimals));
export type PressureLevel = { pressureHpa: number; heightM: number | null; windKph: number | null; relativeHumidityPct: number | null };

export function pressureLevelsForHour(hourly: Record<string, any>, index: number): PressureLevel[] {
  return PRESSURE_LEVELS.map(level => {
    const read = (field: string) => {
      const value = hourly[`${field}_${level}hPa`]?.[index];
      return isFiniteNumber(value) ? value : null;
    };
    return { pressureHpa: level, heightM: read("geopotential_height"), windKph: read("wind_speed"), relativeHumidityPct: read("relative_humidity") };
  });
}
export function interpolateFreeAirWind(levels: PressureLevel[], elevationM: number): number | null {
  if (!isFiniteNumber(elevationM)) return null;
  const valid = levels.filter(level => isFiniteNumber(level.heightM) && isFiniteNumber(level.windKph) && level.windKph >= 0)
    .sort((a, b) => (a.heightM as number) - (b.heightM as number));
  if (valid.length < 2) return null;
  for (let i = 1; i < valid.length; i++) {
    const low = valid[i - 1], high = valid[i];
    if (elevationM < (low.heightM as number) || elevationM > (high.heightM as number)) continue;
    const gap = (high.heightM as number) - (low.heightM as number);
    // Do not bridge gaps larger than adjacent synoptic pressure levels.
    if (gap <= 0 || gap > 2400) return null;
    return round((low.windKph as number) + (elevationM - (low.heightM as number)) / gap * ((high.windKph as number) - (low.windKph as number)));
  }
  return null; // No extrapolation beneath the lowest pressure level or above the highest.
}
export function summarizePressureProfile(hourly: Record<string, any>, indices: number[], targetM: { summit: number; mid: number; lower: number }) {
  const maxima: Record<"summit" | "mid" | "lower", number[]> = { summit: [], mid: [], lower: [] };
  const levelReadings = PRESSURE_LEVELS.map(level => ({ pressureHpa: level, heights: [] as number[], winds: [] as number[], humidity: [] as number[] }));
  for (const i of indices) {
    const levels = pressureLevelsForHour(hourly, i);
    for (let k = 0; k < levels.length; k++) {
      const p = levels[k], store = levelReadings[k];
      if (isFiniteNumber(p.heightM)) store.heights.push(p.heightM);
      if (isFiniteNumber(p.windKph)) store.winds.push(p.windKph);
      if (isFiniteNumber(p.relativeHumidityPct)) store.humidity.push(p.relativeHumidityPct);
    }
    for (const key of ["summit", "mid", "lower"] as const) {
      const wind = interpolateFreeAirWind(levels, targetM[key]);
      if (isFiniteNumber(wind)) maxima[key].push(wind);
    }
  }
  const mean = (values: number[]) => values.length ? round(values.reduce((s, v) => s + v, 0) / values.length) : null;
  const max = (values: number[]) => values.length ? round(Math.max(...values)) : null;
  return {
    summitFreeAirWindKph: max(maxima.summit),
    midFreeAirWindKph: max(maxima.mid),
    lowerFreeAirWindKph: max(maxima.lower),
    levelData: levelReadings.map(l => ({
      pressureHpa: l.pressureHpa, heightM: mean(l.heights), maxWindKph: max(l.winds),
      relativeHumidityPct: mean(l.humidity),
    })),
    hoursWithProfile: indices.filter(i => pressureLevelsForHour(hourly, i).some(p => isFiniteNumber(p.heightM) && isFiniteNumber(p.windKph))).length,
  };
}
/** Stull (2011) approximate wet-bulb (C) from model T and dew point, for flagging uncertain precipitation phase only. */
export function approximateWetBulbC(tempC: number | null, dewPointC: number | null): number | null {
  if (!isFiniteNumber(tempC) || !isFiniteNumber(dewPointC)) return null;
  const saturated = (t: number) => 6.112 * Math.exp((17.67 * t) / (t + 243.5));
  const rh = Math.max(1, Math.min(100, saturated(Math.min(tempC, dewPointC)) / saturated(tempC) * 100));
  const wb = tempC * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(tempC + rh) - Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) - 4.686035;
  return round(Math.min(tempC, wb));
}
export function diagnosePrecipitationPhase(hourly: Record<string, any>, indices: number[], summitElevationM: number) {
  let precipHours = 0, uncertainHours = 0, assessableHours = 0, uncertainPrecipMm = 0;
  for (const i of indices) {
    const precip = hourly.precipitation?.[i];
    if (!isFiniteNumber(precip) || precip <= 0.05) continue;
    precipHours++;
    const temp = hourly.temperature_2m?.[i];
    const dew = hourly.dew_point_2m?.[i];
    const freezing = hourly.freezing_level_height?.[i];
    const wetBulb = approximateWetBulbC(temp, dew);
    if (!isFiniteNumber(wetBulb) && !isFiniteNumber(freezing)) continue;
    assessableHours++;
    // A diagnostic of ambiguous phase, not an automatic reallocation of rain/snow amounts.
    const uncertain = (isFiniteNumber(wetBulb) && wetBulb >= -2 && wetBulb <= 2) ||
      (isFiniteNumber(freezing) && Math.abs(summitElevationM - freezing) <= 350);
    if (uncertain) { uncertainHours++; uncertainPrecipMm += precip; }
  }
  return { precipHours, assessableHours, uncertainHours,
    uncertainPrecipMm: assessableHours ? round(uncertainPrecipMm) : null,
    status: !precipHours ? "dry" : !assessableHours ? "not-assessable" : uncertainHours ? "mixed-phase-risk" : "no-near-freezing-signal",
    basis: "model temperature, dew point (approximate wet bulb) and freezing level; source rain/snow unchanged",
  };
}
export function precipitationCategoryAgreement(values: Array<number | null>) {
  const categories = values.filter(isFiniteNumber).map(v => v < 0.1 ? "none" : v < 1 ? "trace" : v < 10 ? "light" : "heavy");
  if (categories.length < 2) return { status: "insufficient-models", modelCount: categories.length, agreementFraction: null, categories: {} };
  const counts: Record<string, number> = {};
  for (const c of categories) counts[c] = (counts[c] || 0) + 1;
  return { status: "available", modelCount: categories.length,
    agreementFraction: round(Math.max(...Object.values(counts)) / categories.length, 2), categories: counts };
}
export function parseElevationResponse(payload: unknown, targetCount: number): any[] {
  if (Array.isArray(payload) && payload.length === targetCount && payload.every(x => Array.isArray(x?.hourly?.time))) return payload;
  if (targetCount === 1 && !Array.isArray(payload) && Array.isArray((payload as any)?.hourly?.time)) return [payload];
  throw new Error("Open-Meteo returned an incomplete elevation response");
}
