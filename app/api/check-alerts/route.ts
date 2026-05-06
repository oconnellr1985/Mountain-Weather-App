import { NextResponse } from "next/server";
import { climbs } from "@/lib/climbs";
import { findBestWindow, getWeather } from "@/lib/weather";
import { buildAlertText } from "@/lib/alert-text";
import { sendBoth } from "@/lib/notify";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret") || req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const climbId = process.env.ALERT_CLIMB_ID || "adams-sw-chutes";
  const minQuality = Number(process.env.ALERT_MIN_QUALITY || 8);
  const minConfidence = Number(process.env.ALERT_MIN_CONFIDENCE || 5.5);
  const climb = climbs.find(c => c.id === climbId) || climbs[0];
  try {
    const weather = await getWeather(climb);
    const best = findBestWindow(climb, weather.history, weather.forecast);
    const shouldAlert = best.quality >= minQuality && best.confidence >= minConfidence;
    if (!shouldAlert) return NextResponse.json({ ok: true, sent: false, best, reason: "Thresholds not met" });
    const text = buildAlertText(climb, best, weather.source);
    await sendBoth(`${climb.name}: possible window ${best.label}`, text);
    return NextResponse.json({ ok: true, sent: true, best });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
