import { describe, it, expect } from "vitest";
import {
  getFacilities,
  nearestFacility,
  distanceKm,
  infrastructureSummary,
} from "../lib/infrastructure";

describe("real infrastructure data (OSM snapshot)", () => {
  it("loads only verified facilities inside the Delhi bbox", () => {
    const all = getFacilities();
    expect(all.length).toBeGreaterThanOrEqual(1);
    for (const f of all) {
      expect(f.name.length).toBeGreaterThan(0);
      expect(f.latitude).toBeGreaterThanOrEqual(28.4);
      expect(f.latitude).toBeLessThanOrEqual(28.88);
      expect(f.longitude).toBeGreaterThanOrEqual(76.84);
      expect(f.longitude).toBeLessThanOrEqual(77.35);
      expect(f.osmId).toBeGreaterThan(0);
    }
  });

  it("haversine sanity: Laxmi Nagar to Ghazipur landfill is a short hop", () => {
    const km = distanceKm(28.6692, 77.2765, 28.6232992, 77.3266629);
    expect(km).toBeGreaterThan(1);
    expect(km).toBeLessThan(15);
  });

  it("nearest facility resolves plausibly per zone", () => {
    const east = nearestFacility(28.6692, 77.2765); // Laxmi Nagar
    expect(east?.facility.name).toBe("Ghazipur Landfill");
    const north = nearestFacility(28.7267, 77.1123); // Rohini
    expect(north?.facility.name).toBe("Bhalswa Landfill");
    const south = nearestFacility(28.5355, 77.2753); // Okhla
    expect(south?.facility.name).toBe("Okhla Landfill");
  });

  it("summary names real sites and states the license", () => {
    const s = infrastructureSummary();
    expect(s).toMatch(/Ghazipur/);
    expect(s).toMatch(/ODbL/);
  });
});
