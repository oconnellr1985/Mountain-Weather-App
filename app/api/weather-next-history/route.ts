import { NextResponse } from "next/server";
import { fetchWeatherNextHistoryPoint, safeWeatherNextError, weatherNextConfiguration } from "@/lib/weather-next-server";
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
  try { return NextResponse.json(await fetchWeatherNextHistoryPoint(lat, lon, timeZone), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return NextResponse.json({ status: "unavailable", message: safeWeatherNextError(error), rows: [] }, { headers: { "Cache-Control": "private, no-store" } }); }
}
