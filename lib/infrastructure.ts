import { z } from "zod";
import snapshot from "../data/waste-infrastructure.delhi.json";

/**
 * Real-world waste infrastructure layer (OpenStreetMap, ODbL).
 * Small, verified, and honest: only explicitly mapped Delhi sites.
 */

const FacilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locality: z.string(),
  osmType: z.string(),
  osmId: z.number(),
});

export type Facility = z.infer<typeof FacilitySchema>;

const SnapshotSchema = z.object({
  meta: z.object({
    dataset: z.string(),
    source: z.string(),
    fetched: z.string(),
    license: z.string(),
    attribution: z.string(),
  }),
  facilities: z.array(FacilitySchema).min(1),
});

const parsed = SnapshotSchema.parse(snapshot);

export const INFRA_ATTRIBUTION = parsed.meta.attribution;
export const INFRA_SOURCE = parsed.meta.source;
export const INFRA_FETCHED = parsed.meta.fetched;

export function getFacilities(): Facility[] {
  return parsed.facilities;
}

/** Haversine distance in km. */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function nearestFacility(
  lat: number,
  lon: number
): { facility: Facility; km: number } | null {
  const all = getFacilities();
  if (all.length === 0) return null;
  let best = all[0];
  let bestKm = distanceKm(lat, lon, best.latitude, best.longitude);
  for (const f of all.slice(1)) {
    const km = distanceKm(lat, lon, f.latitude, f.longitude);
    if (km < bestKm) {
      best = f;
      bestKm = km;
    }
  }
  return { facility: best, km: Math.round(bestKm * 10) / 10 };
}

export function infrastructureSummary(): string {
  const all = getFacilities();
  const names = all.map((f) => f.name).join(", ");
  return `Mapped major disposal sites (OpenStreetMap, ODbL, verified ${INFRA_FETCHED}): ${all.length} — ${names}. Smaller dhalaos/dustbins are largely unmapped in OSM and honestly absent.`;
}
