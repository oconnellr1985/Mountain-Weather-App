import { NextResponse } from "next/server";
import { fetchWeatherNextHistoryPoint, fetchWeatherNextPoint, safeWeatherNextError, weatherNextConfiguration } from "@/lib/weather-next-server";
import { normalizeWeatherNext } from "@/lib/weather-next-data";
import { stationPrecipitation, verifyPrecipitation } from "@/lib/weather-next-verification";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(req: Request) {
  const u = new URL(req.url);
  const read = (key: string) => u.searchParams.get(key)?.trim() ? Number(u.searchParams.get(key)) : NaN;
  const lat = read("lat"), lon = read("lon"), timeZone = u.searchParams.get("timeZone") || "";
  try { new Intl.DateTimeFormat("en-CA", { timeZone }).format(); } catch { return NextResponse.json({ error: "Invalid time zone" }, { status: 400 }); }
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon) || Math.abs(lon) > 180) return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  const config = weatherNextConfiguration();
  if (!config.ready) return NextResponse.json({ status: config.status, message: config.message, rows: [] }, { headers: { "Cache-Control": "private, no-store" } });
  const headers = { "Cache-Control": "private, no-store" };
  const stationId = u.searchParams.get("station")?.trim().toUpperCase();
  try {
    if (u.searchParams.get("mode") === "interim") {
      const value = await fetchWeatherNextPoint(lat, lon, true);
      if (!value) return NextResponse.json({ status: "unavailable", message: "No interim cycle is available." }, { headers });
      const forecast = normalizeWeatherNext(value, timeZone);
      return NextResponse.json({
        status: "available", runStart: forecast.runStart, latestValidTime: forecast.latestValidTime, ingestionTime: value.ingestionTime,
        hours: forecast.daily.flatMap(day => day.hourly).map(({ validTime, precipMm }) => ({ validTime, precipMm })),
      }, { headers });
    }
    if (stationId) {
      if (!/^[A-Z0-9]{7}$/.test(stationId)) return NextResponse.json({ message: "Enter a seven-character ECCC climate identifier." }, { status: 400, headers });
      const now = Date.now();
      const { station, observations } = await stationPrecipitation(stationId, now);
      if (!station || !observations.size) return NextResponse.json({ status: "unavailable", message: "No usable hourly precipitation observations were returned for that station." }, { headers });
      const rows = await Promise.all([24, 48, 72].map(async lead => {
        try {
          const forecast = await fetchWeatherNextHistoryPoint(station.lat, station.lon, timeZone, lead, now);
          return verifyPrecipitation(forecast.rows, observations, lead, timeZone, now);
        } catch {
          return { lead, unavailable: true };
        }
      }));
      return NextResponse.json({ status: "available", station, rows }, { headers });
    }
    return NextResponse.json(await fetchWeatherNextHistoryPoint(lat, lon, timeZone), { headers });
  }
  catch (error) { return NextResponse.json({ status: "unavailable", message: safeWeatherNextError(error), rows: [] }, { headers: { "Cache-Control": "private, no-store" } }); }
}
