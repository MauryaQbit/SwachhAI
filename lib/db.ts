import "server-only";
import mongoose from "mongoose";
import type { ReportStatus, PriorityBand } from "./waste";
import { serverEnv, redactForLog } from "./env";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as unknown as {
  __swachhaiMongoose?: MongooseCache;
};

const cached: MongooseCache = globalForMongoose.__swachhaiMongoose ?? {
  conn: null,
  promise: null,
};
globalForMongoose.__swachhaiMongoose = cached;

export async function dbConnect(): Promise<typeof mongoose | null> {
  if (cached.conn) return cached.conn;
  const uri = serverEnv.mongodbUri;
  if (!uri) return null;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
    });
  }
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    // Redacted: driver errors can echo connection details.
    console.error("[db] MongoDB connection failed:", redactForLog((err as Error).message));
    return null;
  }
}

export function isDbConfigured(): boolean {
  return serverEnv.hasDatabase;
}

const PriorityBreakdownSchema = new mongoose.Schema(
  { factor: String, points: Number, detail: String },
  { _id: false }
);

const ReportSchema = new mongoose.Schema(
  {
    detectedCategories: { type: [String], required: true },
    severity: { type: String, required: true },
    severityScore: { type: Number, required: true },
    estimatedVolume: { type: String, required: true },
    drainRisk: { type: String, required: true },
    environmentalRisk: { type: String, required: true },
    publicHealthRisk: { type: String, required: true },
    publicExposure: { type: String, default: "MODERATE" },
    explanation: { type: String, required: true },
    recommendedAction: { type: String, required: true },
    segregationGuidance: { type: String, default: "" },
    // Storage-level: lenient (demo seeds carry ""). API-level Zod enforces
    // non-empty data:-URL thumbnails for user reports.
    imageReference: { type: String, required: false, default: "" },
    priorityScore: { type: Number, required: true },
    priority: { type: String, required: true },
    priorityBreakdown: { type: [PriorityBreakdownSchema], default: [] },
    status: { type: String, default: "ASSESSED" },
    area: { type: String, default: "Unspecified area" },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ priority: 1 });
ReportSchema.index({ area: 1 });

export const ReportModel =
  mongoose.models.SwachhReport ??
  mongoose.model("SwachhReport", ReportSchema);

export type { ReportStatus, PriorityBand };
