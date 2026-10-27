# WeatherNext 3 in Mountain Weather

The app loads WeatherNext for every objective through the shared forecast service. The interactive API and alert calculation helper use the same providers and date-based consensus. No route or objective ID enables the model selectively.

## Production connection

The existing Vercel project is mountain-weather-window in rorys-projects-2b98f0be. Google Cloud project: mountain-weather-512523. The project currently has Vercel sign-in protection on its Vercel domains. Keep the WeatherNext UI and API within this private access boundary; the real-time data licence restricts redistribution. Adding an unprotected custom domain requires a separate access/licensing review.

Run the following in [Google Cloud Shell](https://shell.cloud.google.com/?project=mountain-weather-512523), signed in as the Google account already approved for WeatherNext:

```bash
git clone --depth 1 https://github.com/oconnellr1985/Mountain-Weather-App.git mountain-weather-connect
cd mountain-weather-connect
python3 scripts/connect-weather-next.py
```

The script asks for Google authorization and, if necessary, Vercel sign-in. It verifies read access to the collection, stores the refreshable credential as a production Vercel Secret, and redeploys the existing app. Credential contents are not printed or written to the repository. Do not paste credentials into chat. Existing Cloud Shell application-default credentials are replaced by this sign-in. Use --no-redeploy to save authorization only.

This user credential preserves the approved account's dataset access. A new service account is a different identity and must be verified for WeatherNext access before switching to it. User authorization can be revoked from the Google account; if it expires or is revoked, WeatherNext becomes unavailable and other model forecasts continue.

Supported production server configuration:

| Variable | Purpose |
| --- | --- |
| GCP_PROJECT_ID | Registered Earth Engine project |
| WEATHERNEXT_ENABLED=true | Enable the provider |
| WEATHERNEXT_ACCESS_MODE=private | Confirm private app access |
| GOOGLE_CREDENTIALS_JSON | Vercel Secret: authorized_user or service_account JSON |

For a keyless service-account deployment, omit GOOGLE_CREDENTIALS_JSON and configure GCP_PROJECT_NUMBER, GCP_SERVICE_ACCOUNT_EMAIL, GCP_WORKLOAD_IDENTITY_POOL_ID and GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID. Enable Vercel OIDC and configure a Google Workload Identity pool restricted to the exact team, project and production subject. Grant Earth Engine Resource Viewer and Service Usage Consumer on the registered project, and Workload Identity User on the service account. Verify that identity's publisher-dataset access separately. This alternative is implemented but has not been live-tested against this account.

## Forecast and analysis behavior

- Source: projects/gcp-public-data-weathernext/assets/weathernext_3_0_0_0p1deg.
- Select the newest main initialization with a 360-hour asset. The newer interim 48-hour runs do not replace the full-horizon run.
- Use start_time as initialization and end_time as valid time. Validate forecast_hour against both timestamps. Do not infer valid time from system:time_start.
- Sample the original 0.1-degree cell at each objective with a single point-table extraction using the source projection and transform. Return the sampled cell center and footprint.
- Google model-terrain elevation is not supplied by this Earth Engine feed. Keep it null. An optional independent SRTM terrain mean/range across the sampled cell provides context only; it must not be relabelled as model orography or used for an unverified summit adjustment. SRTM is sampled at 90m and elevations are rounded to 10m. Its failure does not remove valid weather data.
- Convert Kelvin to Celsius, m/s to km/h, hourly precipitation metres to millimetres, cloud fractions to percent, Pa to hPa and hourly solar J/m2 to mean W/m2.
- Group by the objective's IANA local time zone returned by the other provider, including DST. Join providers by local calendar date.
- Native 2m temperature and 10m wind are displayed separately. They are not adjusted to summit/mid/valley elevation. Wind is not a gust.
- Other providers are requested with the objective summit elevation through Open-Meteo's statistical downscaling. The app's wind trace uses daily peak gust where present, falling back to peak 10m speed; it does not vertically interpolate wind to summit height. Temperature height and wind statistic differences are stated explicitly in the model table.
- Raw summit charts omit WeatherNext because it has no summit temperature/wind values. Common precipitation and cloud charts include it with a stable magenta style. Legends grow with their contents and wrap on mobile. SVG chart coordinates follow the rendered width to keep axis labels at 12 CSS pixels.
- The window watch shows source counts separately for wind, temperature and precipitation, and identifies whether WeatherNext contributes on each day. WeatherNext affects compatible precipitation, cloud, pressure and solar scoring inputs plus precipitation-disagreement confidence; it does not affect summit temperature/wind or rain/snow/freezing-level values.
- Fresh, complete local days add precipitation, total/layer cloud, sea-level pressure and shortwave radiation to per-field weighted consensus. Missing fields stay null. Partial-day precipitation never substitutes for a full-day total.
- The provisional WeatherNext weight is 0.75: one ensemble is one source, rather than 64 independent models. This is not a validated skill-based weight.
- Precipitation disagreement enters the existing confidence calculation; compatible weighted fields feed route scores, visibility, solar analysis and window ranking. The summary reports the precipitation-consensus change with and without WeatherNext.
- Rain/snow split and freezing level remain unavailable. No values are invented from surface temperature.
- P10/P90 remain hourly distributions. Daily-total precipitation quantiles, daily-peak wind quantiles and route-window probabilities cannot be reconstructed by adding or maximizing hourly percentiles.
- Runs over 24 hours old are visible but excluded from consensus. Authentication, quota, timeout and schema failures have explicit status messages and do not suppress other models.
- Point responses are deduplicated and cached for 20 minutes per function instance, with at most 64 coordinate entries. The cache is an optimization, not durable storage. Requests have time limits.

GET /api/weather returns weatherNext status/run metadata, per-day modelValues entries with modelId weathernext_3 and normalized hourly statistics, and modelStats.weatherNextPrecipDeltaMm. Responses use private, no-store caching. Raw Google credentials and provider error details are never returned.

## Validation

Run npm ci, npm test and npm run typecheck. Run npm run build with the existing app's RESEND_API_KEY configured. An isolated build can use RESEND_API_KEY=re_build_placeholder; building does not send mail.

Tests cover SI conversion, actual valid times, missing values, partial days, DST, malformed/duplicate timestamps, stale-run exclusion, date joins, one-source weighting, precipitation consensus, unchanged summit fields, route score changes and safe error messages. Live end-to-end verification requires the Google connection above; passing fixture tests alone does not establish live access.

## References

- [WeatherNext Earth Engine guide](https://developers.google.com/weathernext/guides/earth-engine)
- [Dataset schema and units](https://developers.google.com/earth-engine/datasets/catalog/projects_gcp-public-data-weathernext_assets_weathernext_3_0_0_0p1deg)
- [Google authentication](https://developers.google.com/earth-engine/guides/auth)
- [Vercel Google Cloud federation](https://vercel.com/docs/oidc/gcp)
- [WeatherNext terms](https://storage.googleapis.com/weathernext-public/terms-of-use.pdf)

WeatherNext is experimental supplementary guidance. Official alerts, forecasts, avalanche bulletins and current observations remain necessary for mountain decisions.
