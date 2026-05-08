import { NextResponse } from "next/server";

type ModelConfig = { id: string; label: string; maxLeadHours: number; regions: string[] };

const MODELS: ModelConfig[] = [
  { id: "gfs", label: "GFS", maxLeadHours: 384, regions: ["global"] },
  { id: "geps", label: "GEPS", maxLeadHours: 384, regions: ["canada"] },
  { id: "gdps", label: "GDPS", maxLeadHours: 240, regions: ["global"] },
  { id: "rdps", label: "RDPS", maxLeadHours: 84, regions: ["canada"] },
  { id: "hrdps_continental", label: "HRDPS Continental", maxLeadHours: 48, regions: ["canada"] },
  { id: "hrdps_1km_west", label: "HRDPS 1 km West", maxLeadHours: 48, regions: ["canada"] },
  { id: "nam", label: "NAM", maxLeadHours: 84, regions: ["usa"] },
  { id: "hrrr", label: "HRRR", maxLeadHours: 48, regions: ["usa"] },
  { id: "rap", label: "RAP", maxLeadHours: 21, regions: ["usa"] },
  { id: "ecmwf_ifs", label: "ECMWF IFS", maxLeadHours: 240, regions: ["global"] },
  { id: "ecmwf_aifs_single", label: "ECMWF AIFS", maxLeadHours: 384, regions: ["global"] },
];

function applies(model: ModelConfig, region: string) { return model.regions.includes("global") || model.regions.includes(region); }
function splitCsvLine(line: string) { const out:string[]=[]; let cur=""; let quote=false; for (let i=0;i<line.length;i++){ const c=line[i]; if(c==='"'){ if(quote && line[i+1]==='"'){cur+='"'; i++;} else quote=!quote; } else if(c==="," && !quote){ out.push(cur); cur=""; } else cur+=c; } out.push(cur); return out; }
function parseCsv(text: string): Record<string,string>[] { const lines=text.trim().split(/\r?\n/).filter(Boolean); if(lines.length<2) return []; const headers=splitCsvLine(lines[0]).map(h=>h.trim()); return lines.slice(1).map(line=>{ const vals=splitCsvLine(line); const row:Record<string,string>={}; headers.forEach((h,i)=>row[h]=(vals[i]??"").trim()); return row; }); }
const num=(v:unknown):number|null=>{ if(v===undefined||v===null||v==="") return null; const n=Number(String(v).replace(/[^0-9.+-]/g,"")); return Number.isFinite(n)?n:null; };
function firstNum(row:Record<string,string>, keys:string[]){ for(const k of keys){ const v=num(row[k]); if(v!==null) return v; } return null; }
const mean=(values:number[])=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
const sum=(values:number[])=>values.reduce((a,b)=>a+b,0);
const min=(values:number[])=>values.length?Math.min(...values):null;
const max=(values:number[])=>values.length?Math.max(...values):null;
function dateKey(row:Record<string,string>){ return String(row.DATETIME || row.datetime || row.DateTime || row.DATE_TIME || "").slice(0,10); }
function issuedTime(rows:Record<string,string>[]){ const issued=rows[0]?.ISSUEDATE || rows[0]?.issuedate || rows[0]?.IssueDate || ""; const t=Date.parse(String(issued).replace(" ","T")); return Number.isFinite(t)?t:null; }
function leadHour(row:Record<string,string>, issued:number|null){ const dt=row.DATETIME || row.datetime || row.DateTime || row.DATE_TIME || ""; const t=Date.parse(String(dt).replace(" ","T")); if(!Number.isFinite(t) || !issued) return null; return Math.max(0, Math.round((t-issued)/36e5)); }
function modelElevation(metadataRows:Record<string,string>[]){ if(!metadataRows.length) return null; const hit=Object.entries(metadataRows[0]).find(([k])=>/height|elev|elevation|model.*hgt|model.*height/i.test(k)); return hit?num(hit[1]):null; }
function summitTemp(raw:number|null, modelElev:number|null, summitM:number){ if(raw===null) return null; if(modelElev===null || !Number.isFinite(modelElev)) return raw; return raw - ((summitM-modelElev)/1000)*6.5; }

function makeDaily(model:ModelConfig, rows:Record<string,string>[], modelElev:number|null, summitM:number){
  const issued=issuedTime(rows); const byDate=new Map<string,Record<string,string>[]>();
  for(const row of rows){ const d=dateKey(row); if(!d) continue; const lead=leadHour(row, issued); if(lead!==null && lead>model.maxLeadHours) continue; if(!byDate.has(d)) byDate.set(d,[]); byDate.get(d)!.push(row); }
  return [...byDate.entries()].map(([date,rs],idx)=>{
    const rawTemps=rs.map(r=>firstNum(r,["TMP","TMAX","TMIN"])).filter((v):v is number=>v!==null);
    const temps=rawTemps.map(t=>summitTemp(t, modelElev, summitM)).filter((v):v is number=>v!==null);
    const winds=rs.map(r=>firstNum(r,["WSPD","WSPD_80M","WSPD_40M","GUST"])).filter((v):v is number=>v!==null);
    const precip=rs.map(r=>firstNum(r,["PRECIP_int","RQP","SQP"])).filter((v):v is number=>v!==null);
    const rain=rs.map(r=>firstNum(r,["RQP","PRECIP_int"])).filter((v):v is number=>v!==null);
    const snowWater=rs.map(r=>firstNum(r,["SQP"])).filter((v):v is number=>v!==null);
    const pressure=rs.map(r=>firstNum(r,["SLP"])).filter((v):v is number=>v!==null);
    const freezing=rs.map(r=>firstNum(r,["HGT_DRYBULB_0C","HGT_WETBULB_0C","HGT_SNOWLVL"])).filter((v):v is number=>v!==null);
    const tAvg=mean(temps); const wMax=max(winds); const p=sum(precip);
    if(tAvg===null && wMax===null && p===0) return null;
    return { modelId:model.id, modelLabel:model.label, date, dayIndex:idx+1, modelElevationM:modelElev, tempSource:modelElev===null?"SpotWX raw TMP at model grid elevation (model elevation unavailable)":`SpotWX TMP adjusted from model elevation ${Math.round(modelElev)} m to summit ${summitM} m using 6.5°C/km lapse rate`, summitTempC:tAvg, summitTempMinC:min(temps), summitTempMaxC:max(temps), summitWindKph:wMax, precipMm:p, summitRainMm:sum(rain), summitSnowCm:sum(snowWater)*10, pressureHpa:mean(pressure), freezingLevelM:mean(freezing) };
  }).filter(Boolean);
}

function aggregate(modelDaily:any[][]){
  const maxDays=Math.max(0,...modelDaily.map(m=>m.length)); const days=[];
  for(let i=0;i<maxDays;i++){ const modelValues=modelDaily.map(m=>m[i]).filter(Boolean); if(!modelValues.length) continue;
    const temps=modelValues.map(m=>m.summitTempC).filter((v:any)=>typeof v==="number"); const winds=modelValues.map(m=>m.summitWindKph).filter((v:any)=>typeof v==="number"); const precip=modelValues.map(m=>m.precipMm).filter((v:any)=>typeof v==="number");
    const tempMean=mean(temps)??0; const windMean=mean(winds)??0; const precipMean=mean(precip)??0; const tempSpread=temps.length>1?Math.max(...temps)-Math.min(...temps):0; const windSpread=winds.length>1?Math.max(...winds)-Math.min(...winds):0; const precipSpread=precip.length>1?Math.max(...precip)-Math.min(...precip):0;
    days.push({ label:`D+${i+1}`, date:modelValues[0].date, dayIndex:i+1, summitWindGfsKph:+(windMean-windSpread/2).toFixed(1), summitWindEcmwfKph:+(windMean+windSpread/2).toFixed(1), midWindGfsKph:+(windMean*.75).toFixed(1), midWindEcmwfKph:+(windMean*.85).toFixed(1), valleyWindGfsKph:+(windMean*.45).toFixed(1), valleyWindEcmwfKph:+(windMean*.55).toFixed(1), summitTempGfsC:+(tempMean-tempSpread/2).toFixed(1), summitTempEcmwfC:+(tempMean+tempSpread/2).toFixed(1), midTempGfsC:+(tempMean+3).toFixed(1), midTempEcmwfC:+(tempMean+4).toFixed(1), valleyTempGfsC:+(tempMean+8).toFixed(1), valleyTempEcmwfC:+(tempMean+9).toFixed(1), summitTempMinAvgC:min(modelValues.map(m=>m.summitTempMinC).filter((v:any)=>typeof v==="number")), summitTempMaxAvgC:max(modelValues.map(m=>m.summitTempMaxC).filter((v:any)=>typeof v==="number")), precipGfsMm:+(precipMean-precipSpread/2).toFixed(1), precipEcmwfMm:+(precipMean+precipSpread/2).toFixed(1), summitRainGfsMm:+(mean(modelValues.map(m=>m.summitRainMm).filter((v:any)=>typeof v==="number"))??0).toFixed(1), summitRainEcmwfMm:+(mean(modelValues.map(m=>m.summitRainMm).filter((v:any)=>typeof v==="number"))??0).toFixed(1), summitSnowGfsCm:+(mean(modelValues.map(m=>m.summitSnowCm).filter((v:any)=>typeof v==="number"))??0).toFixed(1), summitSnowEcmwfCm:+(mean(modelValues.map(m=>m.summitSnowCm).filter((v:any)=>typeof v==="number"))??0).toFixed(1), freezingLevelM:Math.round(mean(modelValues.map(m=>m.freezingLevelM).filter((v:any)=>typeof v==="number"))??0), pressureHpa:Math.round(mean(modelValues.map(m=>m.pressureHpa).filter((v:any)=>typeof v==="number"))??0), modelStats:{modelCount:modelValues.length, windSpreadKph:windSpread, tempSpreadC:tempSpread, precipSpreadMm:precipSpread}, modelValues }); }
  return days;
}

async function fetchModel(key:string, lat:string, lon:string, model:ModelConfig, summitM:number, tz:string){
  const base="https://spotwx.io/api.php"; const forecastUrl=`${base}?key=${encodeURIComponent(key)}&lat=${lat}&lon=${lon}&model=${model.id}&tz=${encodeURIComponent(tz)}`; const metadataUrl=`${base}?key=${encodeURIComponent(key)}&lat=${lat}&lon=${lon}&model=${model.id}&output=metadata`;
  const [forecastResp, metaResp]=await Promise.all([fetch(forecastUrl,{cache:"no-store"}), fetch(metadataUrl,{cache:"no-store"}).catch(()=>null)]);
  if(!forecastResp.ok) throw new Error(`${model.label}: SpotWX forecast HTTP ${forecastResp.status}`); const rows=parseCsv(await forecastResp.text()); if(!rows.length) throw new Error(`${model.label}: no CSV rows`);
  let elev:null|number=null; if(metaResp && metaResp.ok) elev=modelElevation(parseCsv(await metaResp.text())); const daily=makeDaily(model, rows, elev, summitM); if(!daily.length) throw new Error(`${model.label}: no usable rows`); return daily;
}

export async function GET(req:Request){
  const u=new URL(req.url); const key=process.env.SPOTWX_API_KEY; if(!key) return NextResponse.json({error:"Missing SPOTWX_API_KEY environment variable"},{status:500});
  const lat=u.searchParams.get("lat"); const lon=u.searchParams.get("lon"); const summitM=Number(u.searchParams.get("summitM")||"0"); const region=u.searchParams.get("region")||"global"; const tz=u.searchParams.get("tz") || "-7";
  if(!lat || !lon || !Number.isFinite(summitM) || summitM<=0) return NextResponse.json({error:"Missing or invalid lat/lon/summitM"},{status:400});
  const applicable=MODELS.filter(m=>applies(m, region)); const results=await Promise.all(applicable.map(async model=>{ try{return {model, daily:await fetchModel(key, lat, lon, model, summitM, tz), error:""};}catch(e:any){return {model, daily:[], error:e?.message || `${model.label}: failed`};}}));
  const successful=results.filter(r=>r.daily.length); const unavailableModels=results.filter(r=>r.error).map(r=>r.error); if(!successful.length) return NextResponse.json({error:"No SpotWX models returned usable data", unavailableModels},{status:502});
  return NextResponse.json({ source:"Live SpotWX CSV API; summit temperatures are lapse-rate adjusted from model grid elevation where metadata is available", unavailableModels, history:[], forecast:aggregate(successful.map(r=>r.daily)) });
}
