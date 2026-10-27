import { NextResponse } from "next/server";
import { normalizeAvcan, normalizeNwac, unavailableAvalanche } from "@/lib/avalanche-data";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const u = new URL(req.url);
  const read = (key: string) => u.searchParams.get(key)?.trim() ? Number(u.searchParams.get(key)) : NaN;
  const lat = read("lat"), lon = read("lon");
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon) || Math.abs(lon) > 180) return NextResponse.json({ error: "Missing or invalid lat/lon query parameters" }, { status: 400 });
  const usa = u.searchParams.get("region") === "usa";
  const url = usa ? "https://api.avalanche.org/v2/public/products/map-layer/NWAC" : `https://api.avalanche.ca/forecasts/en/products/point?lat=${lat}&long=${lon}`;
  let result;
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Mountain-Weather-App/2.0" } });
    if (!response.ok) throw new Error("Official feed unavailable");
    const data = await response.json();
    result = usa ? normalizeNwac(data, lat, lon) : normalizeAvcan(data);
  } catch { result = unavailableAvalanche("The official avalanche feed could not be loaded. No danger rating is assumed; check the original bulletin.", usa ? "https://nwac.us/" : "https://avalanche.ca/", usa ? "NWAC via Avalanche.org" : "Avalanche Canada"); }
  return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
}
