import { accumulationDate, expectedHours, finite } from "./weather-next-data";
import { lookbackDates } from "./weather-next-history";

export function verifyPrecipitation(rows: any[], observations: Map<number, number>, lead: number, timeZone: string, now: number) {
  const dates = lookbackDates(timeZone, now);
  const pairs = new Map<number, { forecast: number; observed: number }>();
  for (const row of rows) {
    const valid = Date.parse(row.validTime);
    const mm = row.bands?.total_precipitation_1hr_mean;
    const observed = observations.get(valid);
    const init = Date.parse(row.runStart);
    const hours = row.forecastHour;
    if (!Number.isInteger(hours) || hours < lead || hours >= lead + 6 || valid > now ||
      new Date(init).getUTCHours() % 6 !== 0 || valid - init !== hours * 3600000 ||
      !dates.includes(accumulationDate(valid, timeZone)) || !finite(mm) || mm < 0 || !finite(observed)) continue;
    pairs.set(valid, { forecast: mm * 1000, observed });
  }
  const matched = Array.from(pairs.values());
  const wet = (mm: number) => mm >= 0.2;
  const daily = dates.flatMap(date => {
    const hours = Array.from(pairs).filter(([valid]) => accumulationDate(valid, timeZone) === date).map(([, pair]) => pair);
    if (hours.length !== expectedHours(date, timeZone)) return [];
    return [hours.reduce((error, p) => error + p.forecast - p.observed, 0)];
  });
  return {
    lead, hours: matched.length, completeDays: daily.length,
    hits: matched.filter(p => wet(p.forecast) && wet(p.observed)).length,
    misses: matched.filter(p => !wet(p.forecast) && wet(p.observed)).length,
    falseAlarms: matched.filter(p => wet(p.forecast) && !wet(p.observed)).length,
    dailyBiasMm: daily.length ? daily.reduce((sum, v) => sum + v, 0) / daily.length : null,
    dailyMaeMm: daily.length ? daily.reduce((sum, v) => sum + Math.abs(v), 0) / daily.length : null,
  };
}

export async function stationPrecipitation(id: string, now: number) {
  const url = new URL("https://api.weather.gc.ca/collections/climate-hourly/items");
  url.search = new URLSearchParams({
    CLIMATE_IDENTIFIER: id,
    datetime: new Date(now - 16 * 86400000).toISOString() + "/" + new Date(now).toISOString(),
    limit: "500",
    f: "json",
  }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store" });
  if (!response.ok) throw new Error("Station observations unavailable");
  const data = await response.json();
  const features = data.features || [];
  const observations = new Map<number, number>();
  let station: { id: string; name: string; lon: number; lat: number } | undefined;
  for (const feature of features) {
    const p = feature.properties;
    if (String(p?.CLIMATE_IDENTIFIER) !== id) continue;
    const [lon, lat] = feature.geometry?.coordinates || [];
    if (!finite(lat) || !finite(lon)) continue;
    station ||= { id, name: p.STATION_NAME || id, lon, lat };
    if (station.lat !== lat || station.lon !== lon) continue;
    const timestamp = String(p.UTC_DATE || "");
    const valid = Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(timestamp) ? timestamp : timestamp + "Z");
    if (finite(valid) && valid <= now && finite(p.PRECIP_AMOUNT) && p.PRECIP_AMOUNT >= 0 &&
      ["", "T"].includes(String(p.PRECIP_AMOUNT_FLAG || "").trim())) {
      observations.set(valid, p.PRECIP_AMOUNT);
    }
  }
  return { station, observations };
}
