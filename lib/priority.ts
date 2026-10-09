import type { AIAnalysis, PriorityBand } from "./waste";

/**
 * Deterministic Waste Priority Engine.
 *
 * The LLM provides structured *signals*; this engine owns the final score.
 * Transparent, explainable, consistent. Max 100 points.
 *
 * Weights (documented, sum to 100):
 *  - Severity            : 0–25
 *  - Environmental risk  : 0–20
 *  - Drain risk          : 0–20
 *  - Public-health risk  : 0–15
 *  - Accumulation/volume : 0–12
 *  - Public exposure     : 0–8
 */

const LEVEL_POINTS: Record<string, number> = {
  LOW: 0.15,
  MODERATE: 0.45,
  HIGH: 0.75,
  CRITICAL: 1.0,
};

function levelShare(level: string, max: number): number {
  const ratio = LEVEL_POINTS[level] ?? 0.45;
  return Math.round(ratio * max);
}

const VOLUME_POINTS: Record<string, number> = {
  SMALL: 2,
  MEDIUM: 6,
  LARGE: 9,
  VERY_LARGE: 12,
};

export interface PriorityFactor {
  factor: string;
  points: number;
  detail: string;
}

export interface PriorityResult {
  priorityScore: number;
  priority: PriorityBand;
  breakdown: PriorityFactor[];
}

export function bandForScore(score: number): PriorityBand {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MODERATE";
  return "LOW";
}

export function calculatePriority(analysis: AIAnalysis): PriorityResult {
  const breakdown: PriorityFactor[] = [];

  const severityPts = levelShare(analysis.severity, 25);
  breakdown.push({
    factor: "Severity",
    points: severityPts,
    detail: `${analysis.severity} (model severity score ${analysis.severityScore}/100)`,
  });

  const envPts = levelShare(analysis.environmentalRisk, 20);
  breakdown.push({
    factor: "Environmental risk",
    points: envPts,
    detail: `${analysis.environmentalRisk} environmental risk`,
  });

  const drainPts = levelShare(analysis.drainRisk, 20);
  breakdown.push({
    factor: "Drain / infrastructure risk",
    points: drainPts,
    detail: `${analysis.drainRisk} drain obstruction risk`,
  });

  const healthPts = levelShare(analysis.publicHealthRisk, 15);
  breakdown.push({
    factor: "Public-health risk",
    points: healthPts,
    detail: `${analysis.publicHealthRisk} public-health risk`,
  });

  const accumPts = VOLUME_POINTS[analysis.estimatedVolume] ?? 6;
  breakdown.push({
    factor: "Visible accumulation",
    points: accumPts,
    detail: `Estimated volume: ${analysis.estimatedVolume}`,
  });

  const exposurePts = levelShare(analysis.publicExposure ?? "MODERATE", 8);
  breakdown.push({
    factor: "Public exposure",
    points: exposurePts,
    detail: `${analysis.publicExposure ?? "MODERATE"} public exposure`,
  });

  const total = Math.min(
    100,
    Math.max(0, breakdown.reduce((s, b) => s + b.points, 0))
  );

  return { priorityScore: total, priority: bandForScore(total), breakdown };
}

export function explainPriority(result: PriorityResult): string {
  const top = [...result.breakdown].sort((a, b) => b.points - a.points).slice(0, 2);
  return `Priority ${result.priority} (${result.priorityScore}/100), driven mainly by ${top
    .map((t) => `${t.factor.toLowerCase()} (${t.detail})`)
    .join(" and ")}.`;
}
