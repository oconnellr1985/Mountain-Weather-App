"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
type Objective = { id: string; name: string; lat: number; lon: number; summitM: number };
export default function ObjectiveMap({ objectives, selected, onSelect }: { objectives: Objective[]; selected: Objective; onSelect: (id: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current).setView([selected.lat, selected.lon], 11);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>' }).addTo(instance);
    L.control.scale({ imperial: false }).addTo(instance);
    map.current = instance; markers.current = L.layerGroup().addTo(instance);
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container.current);
    return () => { observer.disconnect(); instance.remove(); map.current = null; markers.current = null; };
  }, []);
  useEffect(() => {
    if (!map.current || !markers.current) return;
    markers.current.clearLayers();
    objectives.forEach(objective => {
      const active = objective.id === selected.id;
      const content = document.createElement("div");
      const name = document.createElement("strong"); name.textContent = objective.name;
      const details = document.createElement("p"); details.textContent = `${objective.summitM.toLocaleString()} m · ${objective.lat.toFixed(4)}, ${objective.lon.toFixed(4)}`;
      const button = document.createElement("button"); button.textContent = "View forecast";
      button.className = "rounded-lg bg-slate-900 px-3 py-2 text-white";
      button.onclick = () => onSelect(objective.id);
      content.append(name, details, button);
      const marker = L.marker([objective.lat, objective.lon], { title: objective.name, alt: objective.name, icon: L.divIcon({ className: "objective-map-marker", html: `<span class="${active ? "objective-pin-selected" : "objective-pin"}"></span>`, iconSize: [24, 24], iconAnchor: [12, 12] }), zIndexOffset: active ? 1000 : 0 }).bindPopup(content, { maxWidth: 260 }).addTo(markers.current!);
    });
    map.current.setView([selected.lat, selected.lon], 11);
  }, [objectives, selected.id, onSelect]);
  return <section className="rounded-2xl border bg-white p-4 shadow-sm" aria-label="Objective map">
    <div className="mb-3 flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Objective map</h3><p className="mt-1 text-sm text-slate-600">{selected.name} · {selected.lat.toFixed(4)}, {selected.lon.toFixed(4)}</p><p className="mt-1 text-xs text-slate-500">Drag to pan; use +/−, your mouse wheel or pinch to zoom. Select a marker to open its forecast.</p></div><div className="flex flex-wrap gap-2"><button className="rounded-xl border px-3 py-2 text-sm" onClick={() => map.current?.setView([selected.lat, selected.lon], 11)}>Centre on objective</button><button className="rounded-xl border px-3 py-2 text-sm" onClick={() => map.current?.fitBounds(L.latLngBounds(objectives.map(c => [c.lat, c.lon])), { padding: [30, 30] })}>Show all objectives</button></div></div>
    <div ref={container} className="relative z-0 h-[480px] w-full rounded-xl border" aria-label={`Interactive OpenStreetMap centred on ${selected.name}`} data-objective-map />
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600"><span>Magenta: selected objective · Blue: other objectives</span><a className="underline" href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lon}`} target="_blank" rel="noreferrer">Open in Google Maps</a><a className="underline" href={`https://www.openstreetmap.org/?mlat=${selected.lat}&mlon=${selected.lon}#map=12/${selected.lat}/${selected.lon}`} target="_blank" rel="noreferrer">Open in OpenStreetMap</a></div>
    <p className="mt-2 text-xs text-slate-500">Markers show the app's forecast coordinates. Traverses use a representative high point; route tracks are not shown.</p>
  </section>;
}
