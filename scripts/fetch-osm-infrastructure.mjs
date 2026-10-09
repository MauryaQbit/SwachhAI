// Reproducible fetch for data/waste-infrastructure.delhi.json
// Source: OpenStreetMap via Nominatim (ODbL 1.0, © OpenStreetMap contributors).
// Usage: node scripts/fetch-osm-infrastructure.mjs [--write]
//   Default prints the snapshot JSON. --write overwrites the data file.
// Nominatim usage policy: ≤1 req/sec + identifying User-Agent (respected below).

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const UA = "SwachhAI-hackathon-demo (reproducible OSM fetch)";
const BBOX = { minLat: 28.4, minLon: 76.84, maxLat: 28.88, maxLon: 77.35 }; // Delhi NCT
const VIEWBOX = `${BBOX.minLon},${BBOX.maxLat},${BBOX.maxLon},${BBOX.minLat}`;

const QUERIES = [
  "Bhalswa landfill Delhi",
  "Ghazipur landfill Delhi",
  "Okhla landfill Delhi",
  "landfill Delhi India",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function inBbox(lat, lon) {
  return lat >= BBOX.minLat && lat <= BBOX.maxLat && lon >= BBOX.minLon && lon <= BBOX.maxLon;
}

const seen = new Map();
for (const q of QUERIES) {
  const params = new URLSearchParams({
    q,
    countrycodes: "in",
    format: "jsonv2",
    limit: "15",
    viewbox: VIEWBOX,
    bounded: "1",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status} for query "${q}"`);
  const data = await res.json();
  for (const d of data) {
    const lat = Number(d.lat);
    const lon = Number(d.lon);
    const key = `${d.osm_type}/${d.osm_id}`;
    if (!d.name || !inBbox(lat, lon) || seen.has(key)) continue;
    if (!/landfill|disposal|dumping/i.test(`${d.name} ${d.category ?? ""} ${d.type ?? ""}`)) continue;
    seen.set(key, {
      id: `osm-${d.osm_type}-${d.osm_id}`,
      name: d.name,
      kind: "landfill",
      latitude: lat,
      longitude: lon,
      locality: (d.display_name ?? "").split(",").slice(1, 4).join(",").trim(),
      osmType: d.osm_type,
      osmId: Number(d.osm_id),
    });
  }
  await sleep(1200);
}

const snapshot = {
  meta: {
    dataset: "Major waste disposal sites, Delhi NCT, India",
    source: "OpenStreetMap via Nominatim search API (https://nominatim.openstreetmap.org)",
    fetched: new Date().toISOString().slice(0, 10),
    method:
      "Name + bounded-viewbox queries, countrycodes=in; results kept only when OSM returned an explicit named feature inside the Delhi NCT bbox (28.40,76.84–28.88,77.35). See scripts/fetch-osm-infrastructure.mjs to reproduce.",
    queries: QUERIES,
    license: "Open Database License (ODbL) 1.0 — https://osm.org/copyright",
    attribution: "Data © OpenStreetMap contributors",
    note: "Only explicitly mapped/named sites are kept; unmapped dhalaos and dustbins are honestly absent rather than invented. Coordinates are site centroids from OSM geometries.",
  },
  facilities: [...seen.values()],
};

const out = JSON.stringify(snapshot, null, 2) + "\n";
if (process.argv.includes("--write")) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  writeFileSync(join(root, "data", "waste-infrastructure.delhi.json"), out);
  console.log(`wrote ${seen.size} facilities`);
} else {
  console.log(out);
}
