import { test } from "node:test";
import assert from "node:assert/strict";
import { interpolateElevationTemperature } from "../lib/elevation-temperature";

test("requested model temperature points interpolate to route elevations without fixed 6.5 degree lapse assumption", () => {
  const samples = [
    { elevationM: 3900, temperatureC: -14 },
    { elevationM: 3000, temperatureC: -8 },
    { elevationM: 1800, temperatureC: -1 },
  ];
  assert.equal(interpolateElevationTemperature(samples, 3900), -14);
  assert.equal(interpolateElevationTemperature(samples, 3000), -8);
  assert.equal(interpolateElevationTemperature(samples, 2400), -4.5);
  assert.equal(interpolateElevationTemperature(samples, 4000), null);
  assert.equal(interpolateElevationTemperature(samples, 1700), null);
});
test("missing elevation points never become a fabricated zero", () => {
  const samples = [
    { elevationM: 3954, temperatureC: -10 },
    { elevationM: 3354, temperatureC: null },
    { elevationM: 2754, temperatureC: null },
  ];
  assert.equal(interpolateElevationTemperature(samples, 3354), null);
  assert.equal(interpolateElevationTemperature(samples, 3954), -10);
  assert.equal(interpolateElevationTemperature(samples, NaN), null);
});
