import { GoogleAuth, ExternalAccountClient } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/oidc";
// The Earth Engine Node SDK is server-only and has no bundled TypeScript declarations.
// @ts-ignore
import ee from "@google/earthengine";
import { WEATHER_NEXT_BANDS, WEATHER_NEXT_COLLECTION, weatherNextRegionPayload, earthEngineGridSpec } from "./weather-next-data";

const SCOPE = "https://www.googleapis.com/auth/cloud-platform";
type Entry = { value?: any; expires: number; pending?: Promise<any> };
const cache = new Map<string, Entry>();
let client: any;
let initialized: Promise<void> | undefined;

export function weatherNextConfiguration() {
  if (process.env.WEATHERNEXT_ENABLED !== "true") return { ready: false, status: "not_configured", message: "WeatherNext needs Google authorization before live data can be loaded." };
  if (process.env.WEATHERNEXT_ACCESS_MODE !== "private") return { ready: false, status: "access_not_configured", message: "WeatherNext requires the app's private access configuration." };
  if (!process.env.GCP_PROJECT_ID) return { ready: false, status: "not_configured", message: "WeatherNext Google Cloud project is not configured." };
  const credentials = !!process.env.GOOGLE_CREDENTIALS_JSON;
  const federation = ["GCP_PROJECT_NUMBER", "GCP_SERVICE_ACCOUNT_EMAIL", "GCP_WORKLOAD_IDENTITY_POOL_ID", "GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID"].every(key => !!process.env[key]);
  if (!credentials && !federation) return { ready: false, status: "not_configured", message: "WeatherNext needs Google authorization before live data can be loaded." };
  return { ready: true, status: "configured", message: "" };
}
async function accessToken() {
  if (!client) {
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      let credentials: any;
      try { credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON); } catch { throw new Error("Google credential configuration is invalid"); }
      if (!["authorized_user", "service_account"].includes(credentials.type)) throw new Error("Unsupported Google credential type");
      client = await new GoogleAuth({ credentials, scopes: [SCOPE] }).getClient();
    } else {
      client = ExternalAccountClient.fromJSON({
        type: "external_account",
        audience: "//iam.googleapis.com/projects/" + process.env.GCP_PROJECT_NUMBER + "/locations/global/workloadIdentityPools/" +
          process.env.GCP_WORKLOAD_IDENTITY_POOL_ID + "/providers/" + process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID,
        subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
        token_url: "https://sts.googleapis.com/v1/token",
        service_account_impersonation_url: "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/" +
          process.env.GCP_SERVICE_ACCOUNT_EMAIL + ":generateAccessToken",
        subject_token_supplier: { getSubjectToken: async () => getVercelOidcToken() },
      });
      if (!client) throw new Error("Google identity federation configuration is invalid");
      client.scopes = [SCOPE];
    }
  }
  const result = await client.getAccessToken();
  if (!result?.token) throw new Error("Google authorization did not return an access token");
  return result.token;
}
async function initialize() {
  const token = await accessToken();
  ee.data.setAuthToken("", "Bearer", token, 3600, [], undefined, false);
  // Bound SDK requests; the caller also bounds the overall point query.
  ee.data.setDeadline(30000);
  if (!initialized) {
    initialized = new Promise<void>((resolve, reject) => {
      ee.initialize(null, null, resolve, reject, null, process.env.GCP_PROJECT_ID);
    }).catch(error => { initialized = undefined; throw error; });
  }
  await initialized;
}
function evaluate(value: any) {
  return new Promise<any>((resolve, reject) => {
    value.evaluate((result: any, error: any) => error ? reject(new Error(String(error))) : resolve(result));
  });
}
async function queryPoint(lat: number, lon: number) {
  await initialize();
  const cutoff = new Date(Date.now() - 72 * 3600000).toISOString().replace(".000Z", "Z");
  const collection = ee.ImageCollection(WEATHER_NEXT_COLLECTION)
    .filter(ee.Filter.gte("start_time", cutoff));
  // Interim runs only reach 48h. Select a completed 360h main cycle for the whole app horizon.
  const last = collection.filter(ee.Filter.eq("forecast_hour", 360)).sort("start_time", false).first();
  const runStart = last.get("start_time");
  const run = collection.filter(ee.Filter.eq("start_time", runStart)).sort("forecast_hour").limit(360);
  const point = ee.Geometry.Point([lon, lat]);
  // Extract a point table in one operation rather than launching 360 region reductions.
  // getRegion uses system:time_start, so replace it with the actual valid timestamp.
  const timed = run.map((item: any) => {
    const image = ee.Image(item);
    return image.select(WEATHER_NEXT_BANDS)
      .addBands(ee.Image.constant(ee.Number(image.get("forecast_hour"))).toInt16().rename("forecast_hour_value"))
      .set("system:time_start", ee.Date(image.get("end_time")).millis());
  });
  const projection = ee.Image(run.first()).select(0).projection();
  // evaluate(Projection) supplies the six numeric coefficients. transform() returns WKT text.
  let grid: any = null;
  try { grid = earthEngineGridSpec(await evaluate(projection)); } catch { /* Metadata is optional. */ }
  let raw: any;
  if (grid) {
    try {
      raw = await evaluate(ee.Dictionary({ runStart,
        table: timed.getRegion({ geometry: point, crs: grid.crs, crsTransform: grid.transform }),
      }));
    } catch { grid = null; }
  }
  // A projection/metadata failure must preserve the previously working weather extraction.
  if (!raw) raw = await evaluate(ee.Dictionary({ runStart, table: timed.getRegion(point, 10000) }));
  raw.grid = grid;
  return weatherNextRegionPayload(raw);
}

async function terrainContext(sampling: any) {
  const empty = { status: "unavailable", modelSurfaceElevationM: null };
  if (!sampling || sampling.latitude < -56 || sampling.latitude > 60) return empty;
  const { longitude: lon, latitude: lat, widthDegrees: dx, heightDegrees: dy } = sampling;
  const bounds = [lon - dx / 2, lat - dy / 2, lon + dx / 2, lat + dy / 2];
  if (bounds[0] < -180 || bounds[2] > 180) return empty;
  let timer: ReturnType<typeof setTimeout>;
  try {
    const stats: any = await Promise.race([
      evaluate(ee.Image("USGS/SRTMGL1_003").select("elevation").reduceRegion({
        reducer: ee.Reducer.mean().combine({ reducer2: ee.Reducer.minMax(), sharedInputs: true }),
        geometry: ee.Geometry.Rectangle(bounds, null, false), scale: 90, maxPixels: 1000000,
      })),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Terrain metadata timeout")), 5000); }),
    ]);
    if (![stats.elevation_mean, stats.elevation_min, stats.elevation_max].every(Number.isFinite)) return empty;
    return {
      status: "available", modelSurfaceElevationM: null,
      referenceMeanM: Math.round(stats.elevation_mean / 10) * 10,
      referenceMinM: Math.round(stats.elevation_min / 10) * 10,
      referenceMaxM: Math.round(stats.elevation_max / 10) * 10,
      source: "NASA/USGS SRTM 30m DEM, sampled at 90m across the WeatherNext cell",
      sourceAsset: "USGS/SRTMGL1_003", bounds,
      note: "Independent terrain context, not Google's model orography. No elevation correction is applied.",
    };
  } catch { return empty; }
  finally { clearTimeout(timer!); }
}
export function safeWeatherNextError(error: any) {
  // Provider errors may include request headers/credentials; never return raw errors.
  const message = String(error?.message || error);
  if (/permission|403|not authorized|access denied|not found/i.test(message)) return "Google identity cannot read WeatherNext. Check dataset approval and Earth Engine project permissions.";
  if (/invalid_grant|unauthorized|401|credential|token|authorization/i.test(message)) return "WeatherNext Google authorization needs renewal or correction.";
  if (/deadline|timeout|timed out/i.test(message)) return "WeatherNext request timed out; other model forecasts remain available.";
  if (/quota|429|too many/i.test(message)) return "WeatherNext quota is temporarily unavailable; other model forecasts remain available.";
  return "WeatherNext could not be loaded from Earth Engine; other model forecasts remain available.";
}
export async function fetchWeatherNextPoint(lat: number, lon: number) {
  const config = weatherNextConfiguration();
  if (!config.ready) throw new Error(config.message);
  const key = lat.toFixed(4) + "," + lon.toFixed(4);
  const hit = cache.get(key);
  if (hit?.pending) return hit.pending;
  if (hit?.value && hit.expires > Date.now()) return hit.value;
  const pending = (async () => {
    let timer: ReturnType<typeof setTimeout>;
    try {
      const value: any = await Promise.race([
        queryPoint(lat, lon),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("WeatherNext query timeout")), 40000); }),
      ]);
      // Optional DEM metadata must not suppress an otherwise valid forecast.
      value.terrainContext = await terrainContext(value.sampling);
      cache.set(key, { value, expires: Date.now() + 20 * 60000 });
      // Bound per-instance memory; this cache is an optimization, not persistent storage.
      if (cache.size > 64) cache.delete(cache.keys().next().value);
      return value;
    } catch (error) { cache.delete(key); throw error; }
    finally { clearTimeout(timer!); }
  })();
  cache.set(key, { expires: 0, pending });
  return pending;
}
