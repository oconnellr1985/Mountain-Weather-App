import type { Climb } from "./climbs";

const avg = (values: number[]) => { const v = values.filter(Number.isFinite); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0; };
const clampScore = (v: number) => Math.max(0, Math.min(10, Number(v) || 0));

export async function getWeather(climb: Climb) {
  // Alerts and the interactive app share providers, local dates and WeatherNext consensus.
  const { getWeatherData } = await import("./forecast-service");
  const region = climb.region.includes("Washington") ? "usa" : "canada";
  const data = await getWeatherData({ lat: climb.lat, lon: climb.lon, summitM: climb.summitM, region });
  if (data.error) throw new Error(data.error);
  return data;
}

export function scoreWindowForDays(climb:Climb, forecastDays:any[] = []) { if (!forecastDays.length) return 0; const t:any = climb.thresholds; const windPenalty = forecastDays.reduce((s,d)=>s+Math.max(0,(((d.summitWindGfsKph||0)+(d.summitWindEcmwfKph||0))/2-t.maxSummitWindKph)*(t.windPenaltyPerKph??0.08)),0); const dailyPrecipPenalty = forecastDays.reduce((s,d)=>s+Math.max(0,(((d.precipGfsMm||0)+(d.precipEcmwfMm||0))/2-t.maxPrecipMm24h)*(t.precipPenaltyPerMm??0.5)),0); const cum=forecastDays.reduce((s,d)=>s+((d.precipGfsMm||0)+(d.precipEcmwfMm||0))/2,0); const cumPenalty=Math.max(0,(cum-(t.maxPrecipMm3Day ?? t.maxPrecipMm24h*forecastDays.length))*(t.precipPenaltyPerMm??0.5)); const freezingPenalty=forecastDays.reduce((s,d)=>s+((d.freezingLevelM<t.minFreezingLevelM||d.freezingLevelM>t.maxFreezingLevelM)?0.8:0),0); const tempPenalty=forecastDays.reduce((s,d)=>{ if(typeof t.minSummitTempC !== "number" || t.rockDryObjective) return s; const temp=((d.summitTempGfsC||0)+(d.summitTempEcmwfC||0))/2; const ideal=t.idealSummitTempMinC ?? t.minSummitTempC; if(temp<t.minSummitTempC) return s+Math.min(3.5,(t.minSummitTempC-temp)*(t.coldSummitPenaltyPerC??0.2)+1.2); if(temp<ideal) return s+Math.min(1.5,(ideal-temp)*(t.coldSummitPenaltyPerC??0.2)); return s;},0); const strict=t.strictNoPrecip&&cum>0?0.6:0; return clampScore(10-windPenalty-dailyPrecipPenalty-cumPenalty-freezingPenalty-tempPenalty-strict); }
export function scoreConfidence(history:any[], forecast:any[], start=0) { const recent=history.slice(-4); if(!recent.length) return 0; const modelSpread=avg(forecast.slice(start,start+5).map(d=>d.modelStats?d.modelStats.windSpreadKph+d.modelStats.precipSpreadMm*4+d.modelStats.tempSpreadC*1.5:0)); return clampScore(8.2-modelSpread*0.08-start*0.35); }
export function findBestWindow(climb:Climb, history:any[], forecast:any[]) { if(forecast.length<3) return {label:"NO DATA",quality:0,confidence:0,leadDays:0,windowLength:0}; const candidates=[]; for(let start=0;start<=forecast.length-3;start++){ const days=forecast.slice(start,start+3); const quality=scoreWindowForDays(climb,days); const confidence=scoreConfidence(history,forecast,start); candidates.push({ label:`D+${start+1} to D+${start+3}`, startDay:start+1, endDay:start+3, leadDays:start+1, windowLength:3, quality, confidence, selectionScore:quality*3+confidence*.25-(start+1)*.08 }); } const positive=candidates.filter(c=>c.quality>.25); return (positive.length?positive:candidates).sort((a,b)=>b.selectionScore-a.selectionScore)[0]; }
