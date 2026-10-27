import assert from "node:assert/strict";
import test from "node:test";
import { containsPoint, dangerNumber, normalizeAvcan, normalizeNwac } from "../lib/avalanche-data";
const now = Date.parse("2026-10-27T20:00Z");
const avcan = () => ({ url: "https://avalanche.ca/forecasts/example", report: { dateIssued: "2026-10-27T18:00Z", validUntil: "2026-10-28T23:00Z", timezone: "America/Vancouver", highlights: "<p>Avalanche statement</p>", problems: [{ type: { display: "Persistent slab" } }], dangerRatings: [{ date: { value: "2026-10-27T23:00Z" }, ratings: { alp: { rating: { value: "moderate" } }, tln: { rating: { value: "high" } }, btl: { rating: { value: "low" } } } }] } });
test("Canadian point response parses report, nested ratings, problems, and validity", () => {
  const r = normalizeAvcan(avcan(), now);
  assert.equal(r.status, "available"); assert.equal(r.summary.last.alpine, 2); assert.equal(r.summary.riskScore, 8); assert.equal(r.summary.hasCurrentRating, true);
  assert.deepEqual(r.bulletin!.problems, ["Persistent slab"]); assert.equal(r.bulletin!.note, "Avalanche statement");
});
test("seasonal and expired bulletins never become zero/Low danger", () => {
  const seasonal: any = avcan(); seasonal.report.dangerRatings[0].ratings = { alp: { rating: { value: "earlyseason" } } };
  const r = normalizeAvcan(seasonal, now); assert.equal(r.status, "unrated"); assert.equal(r.summary.riskScore, null); assert.equal(r.summary.hasCurrentRating, false);
  const expired = avcan(); expired.report.validUntil = "2026-10-26T18:00Z";
  assert.equal(normalizeAvcan(expired, now).status, "expired"); assert.equal(normalizeAvcan(expired, now).summary.riskScore, null);
  for (const value of [null, "noRating", "below threshold", 0, -1, { rating: { value: "earlyseason" } }]) assert.equal(dangerNumber(value), null);
});
const geometry = { type: "Polygon", coordinates: [[[-122, 46], [-120, 46], [-120, 49], [-122, 49], [-122, 46]], [[-121.8, 47], [-121.5, 47], [-121.5, 47.5], [-121.8, 47.5], [-121.8, 47]]] };
test("NWAC selects the actual containing zone, handles polygon holes and MultiPolygon", () => {
  assert.equal(containsPoint(geometry, 48, -121), true); assert.equal(containsPoint(geometry, 47.2, -121.6), false);
  assert.equal(containsPoint({ type: "MultiPolygon", coordinates: [geometry.coordinates] }, 48, -121), true);
  const layer = { features: [{ geometry, properties: { name: "Test zone", link: "https://nwac.us/forecasts/avalanche/test", timezone: "America/Los_Angeles", start_date: "2026-10-27T08:00:00", end_date: "2026-10-28T08:00:00", danger_level: 3, danger: "Considerable" } }] };
  const r = normalizeNwac(layer, 48, -121, now);
  assert.equal(r.status, "available"); assert.equal(r.summary.riskScore, 6); assert.equal(r.summary.last.alpine, null); assert.equal(r.summary.last.rating, 3);
  assert.equal(normalizeNwac(layer, 50, -121, now).status, "unavailable");
  layer.features[0].properties.end_date = "2026-10-26T08:00:00";
  assert.equal(normalizeNwac(layer, 48, -121, now).summary.riskScore, null);
});
