import type { WasteReport } from "./waste";
import { infrastructureSummary } from "./infrastructure";

export interface Hotspot {
  area: string;
  reports: number;
  highPriority: number;
  avgPriority: number;
  topCategory: string;
}

/** Observed-hotspot ranking: volume + high-priority share + avg priority. */
export function computeHotspots(reports: WasteReport[]): Hotspot[] {
  const byArea = new Map<string, WasteReport[]>();
  for (const r of reports) {
    const key = r.area || "Unspecified area";
    const list = byArea.get(key) ?? [];
    list.push(r);
    byArea.set(key, list);
  }
  const out: Hotspot[] = [];
  for (const [area, list] of byArea) {
    const highPriority = list.filter(
      (r) => r.priority === "HIGH" || r.priority === "CRITICAL"
    ).length;
    const avgPriority = Math.round(
      list.reduce((s, r) => s + r.priorityScore, 0) / Math.max(1, list.length)
    );
    const catCount = new Map<string, number>();
    for (const r of list)
      for (const c of r.detectedCategories)
        catCount.set(c, (catCount.get(c) ?? 0) + 1);
    const topCategory =
      [...catCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "mixed";
    out.push({ area, reports: list.length, highPriority, avgPriority, topCategory });
  }
  return out.sort((a, b) => {
    const scoreA = a.reports * 2 + a.highPriority * 3 + a.avgPriority / 20;
    const scoreB = b.reports * 2 + b.highPriority * 3 + b.avgPriority / 20;
    return scoreB - scoreA;
  });
}

export interface AnalyticsSummary {
  total: number;
  critical: number;
  high: number;
  resolved: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  byDay: { date: string; count: number }[];
  hotspots: Hotspot[];
  topCategory: string;
  topHotspot: string;
}

export function summarizeReports(reports: WasteReport[]): AnalyticsSummary {
  const byCategory: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byDayMap = new Map<string, number>();
  for (const r of reports) {
    for (const c of r.detectedCategories) byCategory[c] = (byCategory[c] ?? 0) + 1;
    byPriority[r.priority] = (byPriority[r.priority] ?? 0) + 1;
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    const day = (r.createdAt ?? "").slice(0, 10) || "unknown";
    byDayMap.set(day, (byDayMap.get(day) ?? 0) + 1);
  }
  const hotspots = computeHotspots(reports);
  const topCategory =
    Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  return {
    total: reports.length,
    critical: reports.filter((r) => r.priority === "CRITICAL").length,
    high: reports.filter((r) => r.priority === "HIGH").length,
    resolved: reports.filter((r) => r.status === "RESOLVED").length,
    byCategory,
    byPriority,
    byStatus,
    byDay: [...byDayMap.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14),
    hotspots,
    topCategory,
    topHotspot: hotspots[0]?.area ?? "—",
  };
}

export function assistantContext(summary: AnalyticsSummary): string {
  const topCats = Object.entries(summary.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, v]) => `${k} (${v})`)
    .join(", ");
  const topAreas = summary.hotspots
    .slice(0, 3)
    .map(
      (h) => `${h.area}: ${h.reports} reports, ${h.highPriority} high-priority, avg ${h.avgPriority}/100`
    )
    .join(" | ");
  const week = summary.byDay.slice(-7).reduce((s, d) => s + d.count, 0);
  return [
    `Total reports: ${summary.total}; Critical: ${summary.critical}; High: ${summary.high}; Resolved: ${summary.resolved}; filed in the last 7 days: ${week}.`,
    `Top category: ${summary.topCategory} (${summary.byCategory[summary.topCategory] ?? 0} mentions). Top 3 categories: ${topCats}.`,
    summary.hotspots[0]
      ? `Top hotspot: ${summary.hotspots[0].area} with ${summary.hotspots[0].reports} reports (${summary.hotspots[0].highPriority} high-priority, avg ${summary.hotspots[0].avgPriority}/100). Next areas — ${topAreas}.`
      : `Top hotspot: none yet.`,
    `By status: ${JSON.stringify(summary.byStatus)}.`,
    `Scope notes: figures cover filed app reports only (demo entries are synthetic and labeled); areas are coarse public localities; nothing here is an official municipal statistic.`,
    infrastructureSummary(),
  ].join(" ");
}
