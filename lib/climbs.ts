export const climbs = [
  { id: "robson-kain", name: "Mount Robson — Kain Face", region: "Canadian Rockies", lat: 53.110, lon: -119.156, summitM: 3954, style: "summer alpine", thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 0, maxPrecipMm3Day: 0, minFreezingLevelM: 3000, maxFreezingLevelM: 4300, minSummitTempC: -15, idealSummitTempMinC: -10, coldSummitPenaltyPerC: 0.25, windPenaltyPerKph: 0.12, precipPenaltyPerMm: 0.45, strictNoPrecip: true } },
  { id: "sir-donald-nw-ridge", name: "Mount Sir Donald — NW Ridge", region: "Selkirks", lat: 51.263, lon: -117.437, summitM: 3284, style: "summer alpine rock", thresholds: { maxSummitWindKph: 35, maxPrecipMm24h: 0, maxPrecipMm3Day: 0, minFreezingLevelM: 3300, maxFreezingLevelM: 4600, windPenaltyPerKph: 0.06, precipPenaltyPerMm: 1.0, rockDryObjective: true, minSummitTempC: 0, idealValleyTempC: 30, strictNoPrecip: true } },
  { id: "adams-sw-chutes", name: "Mount Adams — SW Chutes", region: "Washington Cascades", lat: 46.202, lon: -121.490, summitM: 3743, style: "spring ski mountaineering", thresholds: { maxSummitWindKph: 30, maxPrecipMm24h: 0.5, maxPrecipMm3Day: 1.5, minFreezingLevelM: 2200, maxFreezingLevelM: 3800, windPenaltyPerKph: 0.11, precipPenaltyPerMm: 0.55, skiCornObjective: true, idealPressureHpa: 1020, idealMidTempMinC: -4, idealMidTempMaxC: 4, idealSummitTempMaxC: 1 } },
  { id: "temple-aemmer", name: "Mount Temple — Aemmer Couloir", region: "Canadian Rockies", lat: 51.350, lon: -116.207, summitM: 3544, style: "winter ski mountaineering", thresholds: { maxSummitWindKph: 35, maxPrecipMm24h: 3, minFreezingLevelM: 1500, maxFreezingLevelM: 3300 } },
];
export type Climb = typeof climbs[number];

export const modelCatalog = [
  { id: "best_match", label: "Best Match", maxLeadDays: 16, regions: ["global"], fetchable: true },
  { id: "gfs_seamless", label: "GFS", maxLeadDays: 16, regions: ["global"], fetchable: true },
  { id: "gem_seamless", label: "GEM / GDPS", maxLeadDays: 10, regions: ["global"], fetchable: true },
  { id: "gem_regional", label: "RDPS", maxLeadDays: 3, regions: ["canada"], fetchable: true },
  { id: "gem_hrdps_continental", label: "HRDPS", maxLeadDays: 2, regions: ["canada"], fetchable: true },
  { id: "nam_conus", label: "NAM", maxLeadDays: 4, regions: ["usa"], fetchable: true },
  { id: "gfs_hrrr", label: "HRRR", maxLeadDays: 2, regions: ["usa"], fetchable: true },
  { id: "rap", label: "RAP", maxLeadDays: 1, regions: ["usa"], fetchable: false },
  { id: "geps", label: "GEPS", maxLeadDays: 16, regions: ["canada"], fetchable: false },
];
