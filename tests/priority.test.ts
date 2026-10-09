import { describe, it, expect } from "vitest";
import { calculatePriority, bandForScore } from "../lib/priority";
import type { AIAnalysis } from "../lib/waste";

const base: AIAnalysis = {
  detectedCategories: ["mixed"],
  severity: "HIGH",
  severityScore: 70,
  estimatedVolume: "LARGE",
  drainRisk: "HIGH",
  environmentalRisk: "HIGH",
  publicHealthRisk: "MODERATE",
  publicExposure: "HIGH",
  explanation: "The image appears to show a large mixed waste pile with potential drain impact.",
  recommendedAction: "Prioritize cleanup and inspect nearby drainage infrastructure.",
  segregationGuidance: "",
};

describe("priority engine", () => {
  it("bands thresholds correctly", () => {
    expect(bandForScore(0)).toBe("LOW");
    expect(bandForScore(24)).toBe("LOW");
    expect(bandForScore(25)).toBe("MODERATE");
    expect(bandForScore(50)).toBe("HIGH");
    expect(bandForScore(75)).toBe("CRITICAL");
    expect(bandForScore(100)).toBe("CRITICAL");
  });

  it("scores a high-risk case as HIGH or CRITICAL with 6 factors summing <= 100", () => {
    const r = calculatePriority(base);
    expect(r.breakdown).toHaveLength(6);
    expect(r.priorityScore).toBeGreaterThanOrEqual(50);
    expect(r.priorityScore).toBeLessThanOrEqual(100);
    expect(["HIGH", "CRITICAL"]).toContain(r.priority);
  });

  it("scores a low-risk case as LOW", () => {
    const r = calculatePriority({
      ...base,
      severity: "LOW",
      severityScore: 10,
      estimatedVolume: "SMALL",
      drainRisk: "LOW",
      environmentalRisk: "LOW",
      publicHealthRisk: "LOW",
      publicExposure: "LOW",
    });
    expect(r.priority).toBe("LOW");
    expect(r.priorityScore).toBeLessThan(25);
  });

  it("is deterministic", () => {
    expect(calculatePriority(base).priorityScore).toBe(calculatePriority(base).priorityScore);
  });
});
