import { NextResponse } from "next/server";
import { getWeatherData } from "@/lib/forecast-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const read = (key: string) => {
    const value = url.searchParams.get(key);
    return value === null || value.trim() === "" ? NaN : Number(value);
  };
  const lat = read("lat"), lon = read("lon"), summitM = read("summitM");
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon) || Math.abs(lon) > 180 ||
      !Number.isFinite(summitM) || summitM < -500 || summitM > 9000) {
    return NextResponse.json({ error: "Missing or invalid lat/lon/summitM query parameters" }, { status: 400 });
  }
  const data = await getWeatherData({ lat, lon, summitM, region: url.searchParams.get("region") || "global" });
  return NextResponse.json(data, { status: data.error ? 502 : 200, headers: { "Cache-Control": "private, no-store" } });
}
