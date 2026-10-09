"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { WasteReport } from "@/lib/waste";
import type { Facility } from "@/lib/infrastructure";

const COLORS: Record<string, string> = {
  LOW: "#059669",
  MODERATE: "#d97706",
  HIGH: "#ea580c",
  CRITICAL: "#dc2626",
};

function dot(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
    iconSize: [16, 16],
  });
}

function landmark() {
  return L.divIcon({
    className: "",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;background:#1d1a15;color:#faf6ee;border:2px solid #faf6ee;box-shadow:0 1px 4px rgba(0,0,0,.5);font:800 12px Arial;border-radius:4px;">L</span>`,
    iconSize: [20, 20],
  });
}

export default function WasteMap({ reports, facilities }: { reports: WasteReport[]; facilities: Facility[] }) {
  const pts = reports.filter((r) => r.latitude != null && r.longitude != null);
  const center: [number, number] = pts.length
    ? [pts[0].latitude as number, pts[0].longitude as number]
    : [28.6139, 77.209];
  return (
    <MapContainer center={center} zoom={11} scrollWheelZoom={false} className="relative z-0 h-[52vh] w-full sm:h-[60vh]">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pts.map((r) => (
        <Marker key={r.id} position={[r.latitude as number, r.longitude as number]} icon={dot(COLORS[r.priority] ?? "#52525b")}>
          <Popup>
            <strong>{r.area}</strong>
            <br />{r.detectedCategories.join(", ")} · {r.priority} ({r.priorityScore}/100)
            <br />Status: {r.status}
            <br /><a href={`/reports/${r.id}`}>Open report</a>
            {r.isDemo ? <br /> : null}
            {r.isDemo ? <em>Demo data</em> : null}
          </Popup>
        </Marker>
      ))}
      {facilities.map((f) => (
        <Marker key={f.id} position={[f.latitude, f.longitude]} icon={landmark()}>
          <Popup>
            <strong>{f.name}</strong>
            <br />Major disposal site · {f.locality}
            <br /><em>Real OSM data (ODbL) — not a report</em>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
