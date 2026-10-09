import type { WasteReport } from "./waste";
import { calculatePriority } from "./priority";
import type { AIAnalysis, ReportStatus } from "./waste";
import { segregationFor } from "./segregation";

/**
 * ~24 synthetic reports with realistic variation. All isDemo: true.
 * Coarse public-area locations (Delhi), no private addresses.
 */

interface Seed {
  cats: AIAnalysis["detectedCategories"];
  severity: AIAnalysis["severity"];
  score: number;
  vol: AIAnalysis["estimatedVolume"];
  drain: AIAnalysis["drainRisk"];
  env: AIAnalysis["environmentalRisk"];
  health: AIAnalysis["publicHealthRisk"];
  exposure: AIAnalysis["publicExposure"];
  area: string;
  lat: number;
  lng: number;
  status: ReportStatus;
  daysAgo: number;
  note: string;
}

const AREAS: Record<string, [number, number]> = {
  "Laxmi Nagar, Delhi": [28.6692, 77.2765],
  "Rohini Sector 7, Delhi": [28.7267, 77.1123],
  "Dwarka Sector 6, Delhi": [28.5921, 77.046],
  "Karol Bagh, Delhi": [28.6519, 77.1907],
  "Okhla Phase 2, Delhi": [28.5355, 77.2753],
  "Civil Lines, Delhi": [28.6762, 77.2245],
};

const SEEDS: Seed[] = [
  { cats: ["plastic", "mixed"], severity: "HIGH", score: 72, vol: "LARGE", drain: "HIGH", env: "HIGH", health: "MODERATE", exposure: "HIGH", area: "Laxmi Nagar, Delhi", lat: 28.6692, lng: 77.2765, status: "ACTION_REQUIRED", daysAgo: 0, note: "Overflowing roadside bin with plastic spillover" },
  { cats: ["mixed"], severity: "CRITICAL", score: 88, vol: "VERY_LARGE", drain: "CRITICAL", env: "CRITICAL", health: "HIGH", exposure: "HIGH", area: "Laxmi Nagar, Delhi", lat: 28.6685, lng: 77.2771, status: "IN_PROGRESS", daysAgo: 1, note: "Possible drain blockage with mixed waste pile-up" },
  { cats: ["organic"], severity: "MODERATE", score: 44, vol: "MEDIUM", drain: "LOW", env: "MODERATE", health: "MODERATE", exposure: "MODERATE", area: "Laxmi Nagar, Delhi", lat: 28.67, lng: 77.2758, status: "ASSESSED", daysAgo: 2, note: "Food waste dumped near market lane" },
  { cats: ["construction", "debris"], severity: "HIGH", score: 68, vol: "LARGE", drain: "MODERATE", env: "HIGH", health: "LOW", exposure: "MODERATE", area: "Rohini Sector 7, Delhi", lat: 28.7267, lng: 77.1123, status: "ACTION_REQUIRED", daysAgo: 1, note: "Construction debris on footpath" },
  { cats: ["plastic"], severity: "MODERATE", score: 41, vol: "MEDIUM", drain: "LOW", env: "MODERATE", health: "LOW", exposure: "MODERATE", area: "Rohini Sector 7, Delhi", lat: 28.7271, lng: 77.1118, status: "NEW", daysAgo: 0, note: "Scattered plastic bottles in park corner" },
  { cats: ["paper", "plastic"], severity: "LOW", score: 18, vol: "SMALL", drain: "LOW", env: "LOW", health: "LOW", exposure: "LOW", area: "Rohini Sector 7, Delhi", lat: 28.7262, lng: 77.113, status: "RESOLVED", daysAgo: 5, note: "Small paper litter, since cleared" },
  { cats: ["mixed", "organic"], severity: "HIGH", score: 71, vol: "LARGE", drain: "HIGH", env: "HIGH", health: "HIGH", exposure: "HIGH", area: "Dwarka Sector 6, Delhi", lat: 28.5921, lng: 77.046, status: "ACTION_REQUIRED", daysAgo: 0, note: "Overflowing community bin, wet waste seepage" },
  { cats: ["sanitary"], severity: "HIGH", score: 66, vol: "MEDIUM", drain: "MODERATE", env: "MODERATE", health: "HIGH", exposure: "HIGH", area: "Dwarka Sector 6, Delhi", lat: 28.5916, lng: 77.0468, status: "ASSESSED", daysAgo: 3, note: "Improperly discarded sanitary waste" },
  { cats: ["ewaste"], severity: "MODERATE", score: 48, vol: "SMALL", drain: "LOW", env: "HIGH", health: "MODERATE", exposure: "LOW", area: "Dwarka Sector 6, Delhi", lat: 28.5926, lng: 77.0452, status: "NEW", daysAgo: 1, note: "Dumped old monitors and cables" },
  { cats: ["organic", "mixed"], severity: "CRITICAL", score: 83, vol: "VERY_LARGE", drain: "HIGH", env: "CRITICAL", health: "CRITICAL", exposure: "CRITICAL", area: "Karol Bagh, Delhi", lat: 28.6519, lng: 77.1907, status: "ACTION_REQUIRED", daysAgo: 0, note: "Large rotting pile behind market" },
  { cats: ["textile"], severity: "LOW", score: 22, vol: "SMALL", drain: "LOW", env: "LOW", health: "LOW", exposure: "MODERATE", area: "Karol Bagh, Delhi", lat: 28.6524, lng: 77.1912, status: "RESOLVED", daysAgo: 6, note: "Discarded clothes bundle" },
  { cats: ["plastic", "metal"], severity: "MODERATE", score: 39, vol: "MEDIUM", drain: "MODERATE", env: "MODERATE", health: "LOW", exposure: "MODERATE", area: "Karol Bagh, Delhi", lat: 28.6514, lng: 77.19, status: "ASSESSED", daysAgo: 4, note: "Scrap and bottles near shop shutter" },
  { cats: ["hazardous"], severity: "CRITICAL", score: 91, vol: "MEDIUM", drain: "HIGH", env: "CRITICAL", health: "CRITICAL", exposure: "HIGH", area: "Okhla Phase 2, Delhi", lat: 28.5355, lng: 77.2753, status: "IN_PROGRESS", daysAgo: 1, note: "Suspected chemical containers near drain" },
  { cats: ["mixed", "debris"], severity: "HIGH", score: 69, vol: "LARGE", drain: "MODERATE", env: "HIGH", health: "MODERATE", exposure: "MODERATE", area: "Okhla Phase 2, Delhi", lat: 28.535, lng: 77.276, status: "ACTION_REQUIRED", daysAgo: 2, note: "Industrial lane dumping" },
  { cats: ["glass"], severity: "MODERATE", score: 45, vol: "SMALL", drain: "LOW", env: "MODERATE", health: "MODERATE", exposure: "HIGH", area: "Okhla Phase 2, Delhi", lat: 28.536, lng: 77.2746, status: "NEW", daysAgo: 0, note: "Broken glass near walkway" },
  { cats: ["organic"], severity: "LOW", score: 20, vol: "SMALL", drain: "LOW", env: "LOW", health: "LOW", exposure: "LOW", area: "Civil Lines, Delhi", lat: 28.6762, lng: 77.2245, status: "RESOLVED", daysAgo: 7, note: "Fallen fruit waste, cleared" },
  { cats: ["mixed"], severity: "MODERATE", score: 47, vol: "MEDIUM", drain: "MODERATE", env: "MODERATE", health: "MODERATE", exposure: "MODERATE", area: "Civil Lines, Delhi", lat: 28.6758, lng: 77.225, status: "ASSESSED", daysAgo: 3, note: "Littered lane corner" },
  { cats: ["plastic"], severity: "HIGH", score: 63, vol: "LARGE", drain: "HIGH", env: "HIGH", health: "MODERATE", exposure: "HIGH", area: "Civil Lines, Delhi", lat: 28.6766, lng: 77.224, status: "ACTION_REQUIRED", daysAgo: 1, note: "Plastic choke near storm drain" },
  { cats: ["construction"], severity: "MODERATE", score: 42, vol: "MEDIUM", drain: "LOW", env: "MODERATE", health: "LOW", exposure: "LOW", area: "Laxmi Nagar, Delhi", lat: 28.6698, lng: 77.276, status: "NEW", daysAgo: 4, note: "Rubble bag left on pavement" },
  { cats: ["metal", "glass"], severity: "LOW", score: 25, vol: "SMALL", drain: "LOW", env: "LOW", health: "LOW", exposure: "MODERATE", area: "Rohini Sector 7, Delhi", lat: 28.7259, lng: 77.1128, status: "RESOLVED", daysAgo: 8, note: "Old jars and tins" },
  { cats: ["mixed", "plastic"], severity: "HIGH", score: 74, vol: "LARGE", drain: "CRITICAL", env: "HIGH", health: "HIGH", exposure: "HIGH", area: "Dwarka Sector 6, Delhi", lat: 28.5912, lng: 77.0472, status: "IN_PROGRESS", daysAgo: 2, note: "Drain mouth covered with polythene" },
  { cats: ["debris"], severity: "MODERATE", score: 36, vol: "MEDIUM", drain: "LOW", env: "LOW", health: "LOW", exposure: "MODERATE", area: "Karol Bagh, Delhi", lat: 28.6509, lng: 77.1915, status: "NEW", daysAgo: 1, note: "Swept pile awaiting pickup" },
  { cats: ["organic", "paper"], severity: "LOW", score: 28, vol: "SMALL", drain: "LOW", env: "LOW", health: "MODERATE", exposure: "LOW", area: "Okhla Phase 2, Delhi", lat: 28.5348, lng: 77.2758, status: "ASSESSED", daysAgo: 5, note: "Canteen leftovers in open bag" },
  { cats: ["mixed", "hazardous"], severity: "CRITICAL", score: 86, vol: "LARGE", drain: "HIGH", env: "CRITICAL", health: "HIGH", exposure: "HIGH", area: "Laxmi Nagar, Delhi", lat: 28.668, lng: 77.2776, status: "ACTION_REQUIRED", daysAgo: 0, note: "Burnt residue with paint cans" },
];

export function buildDemoReports(): WasteReport[] {
  const now = Date.now();
  return SEEDS.map((s, i) => {
    const analysis: AIAnalysis = {
      detectedCategories: s.cats,
      severity: s.severity,
      severityScore: s.score,
      estimatedVolume: s.vol,
      drainRisk: s.drain,
      environmentalRisk: s.env,
      publicHealthRisk: s.health,
      publicExposure: s.exposure,
      explanation: `Demo observation: ${s.note.toLowerCase()}. This synthetic entry appears to show ${s.cats.join(" and ")} waste with an estimated ${s.vol.toLowerCase().replace("_", " ")} volume.`,
      recommendedAction: "Prioritize inspection and schedule cleanup per local workflow.",
      segregationGuidance: segregationFor(s.cats),
    };
    const p = calculatePriority(analysis);
    const created = new Date(now - s.daysAgo * 86400000 - i * 3600000).toISOString();
    return {
      ...analysis,
      id: `demo-${String(i + 1).padStart(2, "0")}`,
      createdAt: created,
      updatedAt: created,
      imageReference: "",
      priorityScore: p.priorityScore,
      priority: p.priority,
      priorityBreakdown: p.breakdown,
      status: s.status,
      area: s.area,
      latitude: s.lat + (i % 3) * 0.0004,
      longitude: s.lng + (i % 4) * 0.0004,
      isDemo: true,
    };
  });
}

export { AREAS };
