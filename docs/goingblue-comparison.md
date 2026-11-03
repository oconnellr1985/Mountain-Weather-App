# Going Blue comparison — forecast correctness audit

Reference: https://github.com/aaasen/goingblue (packages/codec-server/src/forecast.ts and agreement.ts).

## Confirmed differences
- Our `lib/forecast-service.ts` requests Open-Meteo at summit elevation but reports mid/valley temperatures as summit +5/+10 C and mid/valley winds as summit *0.75/*0.45. These are heuristics, not independently modeled elevation forecasts. Do not present them as measured/model-native.
- Our summit wind is daily maximum 10 m gust or wind. Going Blue requests pressure-level wind speeds and directions. Add pressure-level variables where supported and retain surface gust as a separate field; do not automatically equate upper-air wind with ridge wind.
- Our model requests include low/mid/high cloud cover but no pressure-level relative humidity or geopotential height. Going Blue derives multi-level cloud bands from these fields, including repairs for unavailable levels. Add an experimental profile endpoint with per-model missingness and explicit vertical coordinates.
- Our daily precipitation uses raw Open-Meteo rain/snowfall. Compare summit temperature, wet-bulb temperature, and freezing-level guidance; don't silently reclassify precipitation without phase uncertainty.
- Our `lib/weather.ts` confidence score blends wind/temp/precip spreads into one heuristic. Going Blue's `agreement.ts` scores per-period precipitation categories against other centers. Build independent per-variable spread indicators; avoid labeling them calibrated probabilities.

## Implementation acceptance criteria
1. Preserve raw provider values and provenance (model, requested elevation, returned grid elevation, field source, time, units).
2. Eliminate or explicitly mark synthetic mid/valley estimates; no fabricated data when a field is unavailable.
3. Distinguish summit 10 m wind/gust from pressure-level wind and show relevant pressure-level altitude.
4. Add hourly summit precipitation-phase diagnostics with wet-bulb/freezing-level uncertainty, keeping source rain/snow values intact.
5. Add vertical cloud profile only when relative humidity and geopotential-height inputs exist; show gaps.
6. Separate wind, temperature, precipitation and freezing-level agreement; report model count, dependence and missingness.
7. Verify against mountain observations before claiming improved accuracy.
8. Add unit tests for null inputs, model coverage, altitude extremes, freezing-level crossings, partial periods and model disagreement.

## Release guardrails
Implement on a feature branch; do not change production until tested and reviewed. This is decision support, not avalanche or route-safety advice.

## Implemented on draft PR #6 (Phases 1–3)

**Phase 1 — provider elevation guidance and provenance**
- Replace hard-coded mid/valley wind scaling of 75%/45% and summit temperature offsets of +5/+10°C with missing values until model-native data can be returned.
- Make one Open-Meteo multi-location request with repeated objective coordinates and explicit summit, representative mid, and lower elevations. Use the returned hourly 2 m temperatures (daily mean/min/max) at each elevation, preserving the provider/model ID, request tier, request/returned elevations, and missing data. The middle/lower targets come from route metadata where available, or are labelled representative heights; they are not necessarily separate geographic weather grid cells.
- Compute snow-surface route temperature from those elevation-specific model outputs, rather than applying a fixed 6.5°C/km client lapse rate. The existing snow-surface hourly diurnal and radiation logic remains heuristic and is *not* observation calibrated.
- The Open-Meteo API itself applies **statistical elevation downscaling**. These are not independently simulated terrain-specific temperature columns. See https://open-meteo.com/en/docs.

**Phase 2 — real pressure-level wind and humidity**
- Fetch geopotential height, wind speed and relative humidity at 925, 850, 700, 600, 500 and 400 hPa where offered. This is a separate optional fetch so an unavailable pressure variable cannot discard the main summit surface forecast.
- HRES 9 km surface winds remain the main ECMWF feed; ECMWF open-data IFS 0.25° is the explicit separate source for pressure-level data. Other current profile sources are GFS, GEM GDPS, and GEM RDPS when available.
- Interpolate model **free-air** wind speeds between forecast geopotential heights to summit, middle and lower *altitude targets*. Do not extrapolate beyond level coverage; preserve gaps. This is not terrain-exposed 10 m gust guidance and is explicitly differentiated in both the chart and backend data.
- Display per-model pressure level, forecast altitude, peak free-air wind and RH. RH is not silently converted to cloud fraction; native low/mid/high cloud-cover remains separate.

**Phase 3 — precipitation phase and variable-specific disagreement**
- Flag hours with precipitation when approximate wet-bulb temperature lies between -2°C and +2°C or freezing level lies within 350 m of summit. These are approximate near-freezing diagnostics, not calibrated precipitation-type probabilities; native rain/snow data are preserved.
- Compute precipitation-category agreement on full-day model totals (none / trace / light / heavy) while keeping missing values out of the denominator. Expose separate wind, temperature, precipitation and freezing-level spreads **with contributing model counts**.
- Present those diagnostics in the Forecast tab. Do not recast the legacy 0–10 confidence score as a calibrated probability.

**Verification and release**
- Vercel preview builds run `npm run test && next build`. Tests cover interpolation bounds, null inputs, missing model fields, near-freezing phase, pressure profiles, and multi-elevation response ordering.
- Verified preview API for Mount Robson: 16 forecast days, seven 3-elevation temperature model sources, four upper-air profile sources; WeatherNext3 was not configured in preview. This verifies that the pipeline runs and the fields are populated, **not** that the model forecasts are more accurate than before.
- Remains a draft PR, not merged to production. Validate UI/mobile behaviour, mountain observations, and production WeatherNext3 access before merge.

## November 3 user review: reliability and decision-first revision

User review correctly identified several high-value failure modes; we deliberately removed unnecessary profile and altitude-average panels from the main Forecast tab.

1. **Wind metric comparability.** A model-only 10m mean wind value was previously inserted into the 10m gust statistic if the model omitted gusts. Now peak 10m gust and peak 10m mean wind are distinct fields; only gusts contribute to the consensus gust spread. Wind speeds aloft at summit altitude are **free-air atmospheric flow, not calibrated summit gust predictions**. The four coloured curves are removed; a concise wind exposure caution is shown only for significant flow.
2. **Surface temperature transparency.** The three-height temperature plot was largely provider statistical downscaling and provides little additional independent information. We retain the summit temperature swing and use lower-elevation provider temperatures for route/snow diagnostics, with missing values preserved. Do not describe downscaled temperature heights as independent local station or atmospheric forecasts.
3. **Data sanity / coverage.** A live HRDPS West response contained 840 cm snowfall with 0 mm precipitation (unreliable). That field is preserved as raw for debugging but excluded from the snowfall aggregate. Future model days with fewer than 24 Open-Meteo hourly slots are excluded from complete-day consensus while a strong partial-day precipitation hazard is surfaced separately. Open-Meteo applies one fixed timezone offset for forecast response; expect 24 forecast hourly slots regardless of DST.
4. **Spread meaning.** Full-day November 6 forecasts ranged from GFS 5.6 mm to GEM RDPS 37.7 mm in an updated run. This is a meaningful >30 mm precipitation spread, not something to conceal using a categorical agreement fraction. Show model count, daily total range, and its implications next to the operational interpretation. The earlier RDPS run's 39.5 mm value was only 17 hours and required a partial-day warning.
5. **Visibility of evidence.** Detailed pressure levels, humidity, and near-freezing diagnostic remains accessible in backend raw data, but not as four permanent dashboard cards. Temperature phase flags appear only when mixed-phase risk is actually identified. Heuristic confidence score is not a calibrated accuracy probability.
6. **Do not merge yet.** Even after tests pass, multi-model agreement needs observational evaluation. The 10 m gust guidance can be unrepresentative of exposed alpine terrain; upper-air guidance flags exposure but is not a direct summit gust forecast. Google WeatherNext3 requires independent production authorization verification.
