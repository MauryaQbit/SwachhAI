import { describe, it, expect } from "vitest";
import { AIAnalysisSchema, CreateReportSchema } from "../lib/waste";
import { computeHotspots } from "../lib/hotspots";
import { buildDemoReports } from "../lib/demo-data";

describe("AI output validation", () => {
  it("accepts a well-formed analysis", () => {
    const r = AIAnalysisSchema.safeParse({
      detectedCategories: ["plastic"],
      severity: "HIGH",
      severityScore: 72,
      estimatedVolume: "LARGE",
      drainRisk: "HIGH",
      environmentalRisk: "HIGH",
      publicHealthRisk: "MODERATE",
      publicExposure: "HIGH",
      explanation: "The image appears to show plastic accumulation near a drain.",
      recommendedAction: "Prioritize cleanup and inspect the drain.",
    });
    expect(r.success).toBe(true);
  });

  it("rejects malformed AI output (bad enum, missing fields)", () => {
    const r = AIAnalysisSchema.safeParse({
      detectedCategories: ["alien-trash"],
      severity: "EXTREME",
      severityScore: 999,
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid report creation payloads", () => {
    const r = CreateReportSchema.safeParse({ area: "", imageReference: "" });
    expect(r.success).toBe(false);
  });
});

describe("demo data + hotspots", () => {
  it("builds 20+ labeled demo reports", () => {
    const demos = buildDemoReports();
    expect(demos.length).toBeGreaterThanOrEqual(20);
    expect(demos.every((d) => d.isDemo)).toBe(true);
  });

  it("ranks hotspots with volume + high-priority share", () => {
    const demos = buildDemoReports();
    const hot = computeHotspots(demos);
    expect(hot.length).toBeGreaterThan(0);
    expect(hot[0].reports).toBeGreaterThanOrEqual(hot[hot.length - 1].reports);
  });
});
