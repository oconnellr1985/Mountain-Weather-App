export const CHART_AXIS_FONT_SIZE = 12;

const MODEL_STYLES: Record<string, { color: string; dash: string }> = {
  gfs: { color: "#111827", dash: "" },
  ecmwf_ifs: { color: "#2563eb", dash: "8 5" },
  ecmwf_aifs: { color: "#dc2626", dash: "2 5" },
  gem_global: { color: "#059669", dash: "5 4" },
  gem_regional: { color: "#7c3aed", dash: "" },
  gem_hrdps_continental: { color: "#f59e0b", dash: "10 4" },
  gem_hrdps_west: { color: "#0891b2", dash: "3 4" },
  noaa_nbm: { color: "#be123c", dash: "" },
  gfs_hrrr: { color: "#65a30d", dash: "7 3" },
  nam_conus: { color: "#ea580c", dash: "2 3" },
  noaa_rap: { color: "#475569", dash: "6 3" },
  weathernext_3: { color: "#a21caf", dash: "" },
};

export function modelLineStyle(id: string) {
  return MODEL_STYLES[id] || { color: "#64748b", dash: "4 4" };
}

export function modelLabelsForMetric(forecast: any[], metric: string) {
  const models = new Map<string, { id: string; label: string }>();
  for (const day of forecast) for (const model of day.modelValues || []) {
    if (typeof model[metric] === "number" && Number.isFinite(model[metric])) {
      models.set(model.modelId, { id: model.modelId, label: model.modelLabel });
    }
  }
  return Array.from(models.values());
}

export function fieldSourceCounts(day: any) {
  const values = (day.modelValues || []).filter((m: any) => m.includeInConsensus !== false && m.weight > 0);
  const count = (key: string) => values.filter((m: any) => typeof m[key] === "number" && Number.isFinite(m[key])).length;
  return { wind: count("summitWindKph"), temperature: count("summitTempC"), precipitation: count("precipMm") };
}
