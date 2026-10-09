import { z } from "zod";

// ---------- Enumerations ----------
export const WasteCategoryValues = [
  "plastic",
  "organic",
  "paper",
  "metal",
  "glass",
  "ewaste",
  "construction",
  "mixed",
  "hazardous",
  "textile",
  "sanitary",
  "debris",
] as const;
export type WasteCategory = (typeof WasteCategoryValues)[number];

export const SeverityValues = ["LOW", "MODERATE", "HIGH", "CRITICAL"] as const;
export type Severity = (typeof SeverityValues)[number];

export const RiskValues = ["LOW", "MODERATE", "HIGH", "CRITICAL"] as const;
export type RiskLevel = (typeof RiskValues)[number];

export const VolumeValues = ["SMALL", "MEDIUM", "LARGE", "VERY_LARGE"] as const;
export type EstimatedVolume = (typeof VolumeValues)[number];

export const PriorityBandValues = ["LOW", "MODERATE", "HIGH", "CRITICAL"] as const;
export type PriorityBand = (typeof PriorityBandValues)[number];

export const ReportStatusValues = [
  "NEW",
  "ASSESSED",
  "ACTION_REQUIRED",
  "IN_PROGRESS",
  "RESOLVED",
] as const;
export type ReportStatus = (typeof ReportStatusValues)[number];

// ---------- AI output contract (what Gemini must return) ----------
export const AIAnalysisSchema = z.object({
  detectedCategories: z
    .array(z.enum(WasteCategoryValues))
    .min(1)
    .max(6),
  severity: z.enum(SeverityValues),
  severityScore: z.number().min(0).max(100),
  estimatedVolume: z.enum(VolumeValues),
  drainRisk: z.enum(RiskValues),
  environmentalRisk: z.enum(RiskValues),
  publicHealthRisk: z.enum(RiskValues),
  publicExposure: z.enum(RiskValues).default("MODERATE"),
  explanation: z.string().min(10).max(800),
  recommendedAction: z.string().min(10).max(400),
  segregationGuidance: z.string().max(500).optional().default(""),
});

export type AIAnalysis = z.infer<typeof AIAnalysisSchema>;

// ---------- Persisted waste report ----------
export const WasteReportSchema = AIAnalysisSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  imageReference: z.string(),
  priorityScore: z.number().min(0).max(100),
  priority: z.enum(PriorityBandValues),
  priorityBreakdown: z.array(
    z.object({ factor: z.string(), points: z.number(), detail: z.string() })
  ),
  status: z.enum(ReportStatusValues),
  area: z.string(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  isDemo: z.boolean().default(false),
});

export type WasteReport = z.infer<typeof WasteReportSchema>;

export const CreateReportSchema = AIAnalysisSchema.extend({
  // Stored thumbnails only: downscaled client-side (lib/image.ts).
  // The data:-URL scheme check blocks javascript:/blob: smuggling into <img>.
  imageReference: z
    .string()
    .min(1)
    .max(1_000_000)
    .refine((v) => /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=\s]+$/.test(v), {
      message: "imageReference must be a JPEG/PNG/WebP data URL",
    }),
  area: z.string().min(1).max(120).default("Unspecified area"),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  priorityScore: z.number().min(0).max(100),
  priority: z.enum(PriorityBandValues),
  priorityBreakdown: z
    .array(z.object({ factor: z.string(), points: z.number(), detail: z.string() }))
    .default([]),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;

export const CATEGORY_LABELS: Record<WasteCategory, string> = {
  plastic: "Plastic",
  organic: "Organic / Food",
  paper: "Paper",
  metal: "Metal",
  glass: "Glass",
  ewaste: "E-Waste",
  construction: "Construction debris",
  mixed: "Mixed waste",
  hazardous: "Hazardous",
  textile: "Textile",
  sanitary: "Sanitary",
  debris: "General debris",
};
