/** Official bulletin parsing. Missing, expired and unrated products never imply Low danger. */
export function dangerNumber(value: any): number | null {
  if (value && typeof value === "object") return dangerNumber(value.rating ?? value.value ?? value.display);
  if (typeof value === "number") return Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
  const labels: Record<string, number> = { low: 1, moderate: 2, considerable: 3, high: 4, extreme: 5 };
  return labels[String(value ?? "").toLowerCase()] ?? null;
}
export function plainText(value: any) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}
function officialLink(url: any, fallback: string) {
  try { const u = new URL(url); if (u.protocol === "https:" && /(^|\.)(avalanche\.ca|nwac\.us|avalanche\.org)$/.test(u.hostname)) return u.toString(); } catch { }
  return fallback;
}
export function unavailableAvalanche(message: string, url = "https://avalanche.ca/", source = "Avalanche Canada") {
  return { status: "unavailable", source, url, bulletin: null, avalancheHistory: [], summary: { headline: message, riskScore: null, hasCurrentRating: false, last: { alpine: null, treeline: null, belowTreeline: null, rating: null, problems: [] }, persistentDays: 0, windSlabDays: 0 } };
}
export function normalizeAvcan(data: any, now = Date.now()) {
  const product = data?.report ? data : data?.product || data?.products?.[0];
  const report = product?.report;
  if (!report) return unavailableAvalanche("No Avalanche Canada product covers this location.");
  const url = officialLink(product.url, "https://avalanche.ca/");
  const issued = Date.parse(report.dateIssued), expires = Date.parse(report.validUntil);
  const current = Number.isFinite(issued) && issued <= now && Number.isFinite(expires) && expires > now;
  const problems = (report.problems || []).map((p: any) => plainText(p.type?.display ?? p.type?.value ?? p.type ?? p.name)).filter(Boolean);
  const note = plainText(report.highlights || report.message || "Review the original bulletin.");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: report.timezone || "America/Vancouver" }).format(new Date(now));
  const rows = (report.dangerRatings || []).map((d: any) => ({ label: d.date?.value || d.date, alpine: dangerNumber(d.ratings?.alp), treeline: dangerNumber(d.ratings?.tln), belowTreeline: dangerNumber(d.ratings?.btl), problems, note, scope: "By elevation band" })).filter((d: any) => typeof d.label === "string" && d.label.slice(0, 10) >= today).sort((a: any, b: any) => a.label.localeCompare(b.label));
  const last = rows[0] || { alpine: null, treeline: null, belowTreeline: null, problems };
  const ratings = [last.alpine, last.treeline, last.belowTreeline].filter((v: any) => typeof v === "number");
  const hasCurrentRating = current && ratings.length > 0;
  return { status: !current ? "expired" : hasCurrentRating ? "available" : "unrated", source: report.forecaster || "Avalanche Canada", url,
    bulletin: { issuedAt: report.dateIssued, validUntil: report.validUntil, timeZone: report.timezone, note, problems, scope: "Regional forecast by elevation band; not a slope-specific assessment." }, avalancheHistory: hasCurrentRating ? rows : [],
    summary: { headline: !current ? "The returned bulletin has expired; no current rating is used in scoring." : hasCurrentRating ? note : "Current seasonal statement — no numeric danger rating. " + note, riskScore: hasCurrentRating ? Math.max(...ratings) * 2 : null, hasCurrentRating, last: hasCurrentRating ? last : { alpine: null, treeline: null, problems }, persistentDays: 0, windSlabDays: 0 } };
}
function inRing(lon: number, lat: number, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside; }
  return inside;
}
export function containsPoint(geometry: any, lat: number, lon: number) {
  const polygons = geometry?.type === "Polygon" ? [geometry.coordinates] : geometry?.type === "MultiPolygon" ? geometry.coordinates : [];
  return polygons.some((rings: number[][][]) => rings.length && inRing(lon, lat, rings[0]) && !rings.slice(1).some(ring => inRing(lon, lat, ring)));
}
export function normalizeNwac(data: any, lat: number, lon: number, now = Date.now()) {
  const feature = data?.features?.find((f: any) => containsPoint(f.geometry, lat, lon));
  if (!feature) return unavailableAvalanche("This coordinate is outside the published NWAC forecast polygons. Check NWAC for approach coverage and high-elevation limitations.", "https://nwac.us/", "NWAC via Avalanche.org");
  const p = feature.properties;
  const url = officialLink(p.link, "https://nwac.us/");
  const dateWithOffset = (v: any) => typeof v === "string" && /(?:Z|[+-]\d\d:\d\d)$/.test(v) ? Date.parse(v) : NaN;
  const issued = dateWithOffset(p.start_date), expires = dateWithOffset(p.end_date);
  const wallTime = (v: any) => typeof v === "string" ? v.slice(0, 19) : "";
  const localNow = new Intl.DateTimeFormat("sv-SE", { timeZone: p.timezone || "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(new Date(now)).replace(" ", "T");
  const current = (Number.isFinite(issued) ? issued <= now : /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(wallTime(p.start_date)) && wallTime(p.start_date) <= localNow) && (Number.isFinite(expires) ? expires > now : /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(wallTime(p.end_date)) && wallTime(p.end_date) > localNow);
  const rating = p.off_season ? null : dangerNumber(p.danger_level);
  const hasCurrentRating = current && rating !== null;
  const row = { label: p.end_date, alpine: null, treeline: null, rating: hasCurrentRating ? rating : null, problems: [], note: plainText(p.travel_advice), scope: "Regional maximum across forecast elevations" };
  return { status: !current ? "expired" : hasCurrentRating ? "available" : "unrated", source: "NWAC via Avalanche.org", url,
    bulletin: { issuedAt: p.start_date, validUntil: p.end_date, timeZone: p.timezone, zone: p.name, note: plainText(p.travel_advice), problems: [], scope: "Regional maximum only. Elevation-specific ratings and avalanche problems require the full NWAC bulletin; coverage may not extend to the volcano summit." }, avalancheHistory: hasCurrentRating ? [row] : [],
    summary: { headline: !current ? "NWAC product is expired; no current rating is used in scoring." : hasCurrentRating ? p.name + ": " + plainText(p.danger) + ". " + plainText(p.travel_advice) : p.name + ": seasonal information available, with no numeric danger rating. Review NWAC directly.", riskScore: hasCurrentRating ? rating! * 2 : null, hasCurrentRating, last: row, persistentDays: 0, windSlabDays: 0 } };
}
