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
