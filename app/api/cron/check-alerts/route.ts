import { NextResponse } from "next/server";
import { Resend } from "resend";

const CLIMBS: Record<string, any> = {
  "adams-sw-chutes": { name: "Mount Adams — SW Chutes", lat: 46.202, lon: -121.49, summitM: 3743, region: "usa", activeFromMonth: 1 },
  "robson-kain": { name: "Mount Robson — Kain Face", lat: 53.11, lon: -119.156, summitM: 3954, region: "canada", activeFromMonth: 7 },
  "sir-donald-nw-ridge": { name: "Mount Sir Donald — NW Ridge", lat: 51.263, lon: -117.437, summitM: 3284, region: "canada", activeFromMonth: 7 },
  "temple-aemmer": { name: "Mount Temple — Aemmer Couloir", lat: 51.35, lon: -116.207, summitM: 3544, region: "canada", activeFromMonth: 1 },
};

function getRules() {
  const raw = process.env.ALERT_RULES_JSON;
  if (raw) return JSON.parse(raw);
  return [{ climbId: "adams-sw-chutes", email: process.env.ALERT_TO_EMAIL, minQuality: Number(process.env.DEFAULT_MIN_QUALITY || 8), minConfidence: Number(process.env.DEFAULT_MIN_CONFIDENCE || 5.5), enabled: true }];
}

function monthUtc() { return new Date().getUTCMonth() + 1; }
function baseUrl(req: Request) { const host = req.headers.get("x-forwarded-host") || req.headers.get("host"); const proto = req.headers.get("x-forwarded-proto") || "https"; return `${proto}://${host}`; }

function score(forecast: any[]) {
  const days = forecast.slice(0, 3);
  if (days.length < 3) return { quality: 0, confidence: 0, label: "NO DATA" };
  const avgWind = days.reduce((s, d) => s + ((d.summitWindGfsKph + d.summitWindEcmwfKph) / 2), 0) / days.length;
  const precip = days.reduce((s, d) => s + ((d.precipGfsMm + d.precipEcmwfMm) / 2), 0);
  const modelSpread = days.reduce((s, d) => s + (d.modelStats?.windSpreadKph || 0) + (d.modelStats?.tempSpreadC || 0), 0) / days.length;
  return { quality: Math.max(0, Math.min(10, 10 - Math.max(0, avgWind - 30) * 0.12 - precip * 0.7)), confidence: Math.max(0, Math.min(10, 8 - modelSpread * 0.08)), label: "D+1 to D+3" };
}

async function sendEmail(to: string, subject: string, text: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({ from: process.env.ALERT_FROM_EMAIL!, to, subject, text, html: `<pre style="font-family:system-ui;white-space:pre-wrap">${text}</pre>` });
  if (result.error) throw new Error(result.error.message || "Resend failed");
  return result.data?.id;
}

export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret") || req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.RESEND_API_KEY || !process.env.ALERT_FROM_EMAIL) return NextResponse.json({ error: "Missing Resend env vars" }, { status: 500 });

  const results = [];
  for (const rule of getRules()) {
    try {
      if (!rule.enabled || !rule.email) { results.push({ rule, skipped: "disabled or no email" }); continue; }
      const climb = CLIMBS[rule.climbId];
      if (!climb) throw new Error(`Unknown climbId: ${rule.climbId}`);
      if (climb.activeFromMonth && monthUtc() < climb.activeFromMonth) { results.push({ rule: rule.climbId, skipped: `inactive until month ${climb.activeFromMonth}` }); continue; }
      const weatherUrl = `${baseUrl(req)}/api/weather?climbId=${rule.climbId}&lat=${climb.lat}&lon=${climb.lon}&summitM=${climb.summitM}&region=${climb.region}`;
      const weatherResponse = await fetch(weatherUrl, { cache: "no-store" });
      const weather = await weatherResponse.json();
      if (!weatherResponse.ok) throw new Error(weather.error || "Weather fetch failed");
      const s = score(weather.forecast || []);
      if (s.quality >= (rule.minQuality ?? 8) && s.confidence >= (rule.minConfidence ?? 5.5)) {
        const text = `Mountain Window Alert\n\nObjective: ${climb.name}\nWindow: ${s.label}\nQuality: ${s.quality.toFixed(1)} / 10\nConfidence: ${s.confidence.toFixed(1)} / 10\nSource: ${weather.source}\n\nOpen the app for model traces and manual review.`;
        const id = await sendEmail(rule.email, `Mountain Window Alert: ${climb.name}`, text);
        results.push({ rule: rule.climbId, sent: true, resendId: id, score: s });
      } else results.push({ rule: rule.climbId, sent: false, score: s });
    } catch (e: any) { results.push({ rule: rule.climbId, error: e?.message || "unknown error" }); }
  }
  return NextResponse.json({ ok: true, results });
}
