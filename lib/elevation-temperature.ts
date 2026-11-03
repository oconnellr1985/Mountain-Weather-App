/**
 * Interpolation between explicit elevation-downscaled Open-Meteo temperature requests.
 * Inputs are provider outputs; do not extrapolate or silently use a fixed local lapse rate.
 * Open-Meteo itself may apply a statistical lapse-rate correction upstream.
 */
export type ElevationTemperaturePoint = { elevationM: number; temperatureC: number | null };
export function interpolateElevationTemperature(points: ElevationTemperaturePoint[], targetM: number): number | null {
  if (typeof targetM !== "number" || !Number.isFinite(targetM)) return null;
  const valid = points.filter(p => Number.isFinite(p.elevationM) && typeof p.temperatureC === "number" && Number.isFinite(p.temperatureC))
    .sort((a, b) => a.elevationM - b.elevationM);
  const exact = valid.find(p => p.elevationM === targetM);
  if (exact) return exact.temperatureC;
  for (let i = 1; i < valid.length; i++) {
    const lo = valid[i - 1], hi = valid[i];
    if (targetM > lo.elevationM && targetM < hi.elevationM && hi.elevationM > lo.elevationM) {
      const ratio = (targetM - lo.elevationM) / (hi.elevationM - lo.elevationM);
      return Number(((lo.temperatureC as number) + ratio * ((hi.temperatureC as number) - (lo.temperatureC as number))).toFixed(2));
    }
  }
  return null; // Never fabricate conditions beyond the requested altitude range.
}
