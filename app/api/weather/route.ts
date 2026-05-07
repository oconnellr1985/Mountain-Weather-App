import { NextResponse } from "next/server";

const MODEL_MAP = [
  { id: "gfs", label: "GFS" },
  { id: "gdps", label: "GDPS" },
  { id: "geps", label: "GEPS" },
  { id: "rdps", label: "RDPS" },
  { id: "nam", label: "NAM" },
  { id: "hrrr", label: "HRRR" },
  { id: "rap", label: "RAP" },
];

function buildFakeForecast() {
  const days = [];

  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const label = i === 0 ? "Today" : `D+${i}`;

    const modelValues = MODEL_MAP.map((m) => ({
      modelId: m.id,
      modelLabel: m.label,
      summitWindKph: 15 + Math.random() * 25,
      summitTempC: -12 + Math.random() * 10,
      precipMm: Math.random() * 2,
    }));

    const winds = modelValues.map((m) => m.summitWindKph);
    const temps = modelValues.map((m) => m.summitTempC);
    const precips = modelValues.map((m) => m.precipMm);

    days.push({
      label,
      dayIndex: i + 1,
      date: date.toISOString().slice(0, 10),

      summitWindGfsKph: winds[0],
      summitWindEcmwfKph: winds[1],

      summitTempGfsC: temps[0],
      summitTempEcmwfC: temps[1],

      precipGfsMm: precips[0],
      precipEcmwfMm: precips[1],

      summitRainGfsMm: precips[0],
      summitRainEcmwfMm: precips[1],

      summitSnowGfsCm: precips[0] * 3,
      summitSnowEcmwfCm: precips[1] * 3,

      midWindGfsKph: winds[0] - 5,
      midWindEcmwfKph: winds[1] - 5,

      valleyWindGfsKph: winds[0] - 10,
      valleyWindEcmwfKph: winds[1] - 10,

      valleyTempGfsC: temps[0] + 10,
      valleyTempEcmwfC: temps[1] + 10,

      midTempGfsC: temps[0] + 5,
      midTempEcmwfC: temps[1] + 5,

      summitTempMinAvgC: Math.min(...temps) - 2,
      summitTempMaxAvgC: Math.max(...temps) + 2,

      freezingLevelM: 2500 + Math.random() * 1200,
      pressureHpa: 1015 + Math.random() * 15,

      modelStats: {
        modelCount: modelValues.length,
        windSpreadKph:
          Math.max(...winds) - Math.min(...winds),
        precipSpreadMm:
          Math.max(...precips) - Math.min(...precips),
        tempSpreadC:
          Math.max(...temps) - Math.min(...temps),
      },

      modelValues,
    });
  }

  return days;
}

export async function GET() {
  try {
    return NextResponse.json({
      source: "Backend fallback weather service",
      unavailableModels: [],
      history: [],
      forecast: buildFakeForecast(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unknown backend weather error",
      },
      { status: 500 }
    );
  }
}
