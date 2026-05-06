import { NextResponse } from "next/server";
import { climbs } from "@/lib/climbs";
import { findBestWindow, getWeather, scoreConfidence, scoreWindowForDays } from "@/lib/weather";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const climbId = searchParams.get("climbId") || "robson-kain";
  const climb = climbs.find(c => c.id === climbId) || climbs[0];
  try {
    const weather = await getWeather(climb);
    const best = findBestWindow(climb, weather.history, weather.forecast);
    const immediateQuality = scoreWindowForDays(climb, weather.forecast.slice(0,3));
    const confidence = scoreConfidence(weather.history, weather.forecast, 0);
    return NextResponse.json({ ok: true, climb, ...weather, best, immediateQuality, confidence });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || "NO DATA" }, { status: 503 });
  }
}
