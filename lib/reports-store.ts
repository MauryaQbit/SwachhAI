import "server-only";
import type { WasteReport } from "./waste";
import { WasteReportSchema } from "./waste";
import { dbConnect, ReportModel } from "./db";
import { buildDemoReports } from "./demo-data";
import { redactForLog } from "./env";

/**
 * Unified report store: MongoDB Atlas when configured, otherwise
 * an in-memory store pre-seeded with labeled demo data (demo resilience).
 */

// NOTE: stored on globalThis, not module state. Next.js bundles server code
// per route — module-level `let` would give every route its own isolated copy
// (created reports 404ing on their own detail pages). The process global is
// shared by all bundles in one server instance.
const globalForStore = globalThis as unknown as {
  __swachhaiMemory?: WasteReport[] | null;
};

function seedMemory(): WasteReport[] {
  if (!globalForStore.__swachhaiMemory) {
    globalForStore.__swachhaiMemory = buildDemoReports();
  }
  return globalForStore.__swachhaiMemory;
}

/** Shape of a Mongoose lean() document — unknown fields, explicitly coerced. */
interface LeanReportDoc {
  _id?: unknown;
  id?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  imageReference?: unknown;
  [field: string]: unknown;
}

function toIso(value: unknown, fallback: string): string {
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
}

/**
 * Coerce a DB document into a validated WasteReport.
 * Returns null (and logs) when a stored document no longer fits the
 * schema — never a half-shaped object.
 */
function toReport(doc: LeanReportDoc): WasteReport | null {
  const now = new Date().toISOString();
  const parsed = WasteReportSchema.safeParse({
    ...doc,
    _id: undefined,
    id: String(doc._id ?? doc.id ?? ""),
    createdAt: toIso(doc.createdAt, now),
    updatedAt: toIso(doc.updatedAt, now),
    imageReference: typeof doc.imageReference === "string" ? doc.imageReference : "",
  });
  if (!parsed.success) {
    console.error("[store] dropping malformed document:", redactForLog(parsed.error.issues[0]?.message ?? "schema mismatch"));
    return null;
  }
  return parsed.data;
}

/** Mongo owns _id — strip the app-level id before writes. */
function stripId(report: WasteReport): Omit<WasteReport, "id"> {
  const rest = { ...report };
  delete (rest as { id?: string }).id;
  return rest;
}

function collect(docs: LeanReportDoc[]): WasteReport[] {
  const out: WasteReport[] = [];
  for (const d of docs) {
    const r = toReport(d);
    if (r) out.push(r);
  }
  return out;
}

export async function listReports(): Promise<{ reports: WasteReport[]; source: "db" | "memory" }> {
  const conn = await dbConnect().catch(() => null);
  if (conn) {
    try {
      const docs = (await ReportModel.find({}).sort({ createdAt: -1 }).limit(200).lean()) as LeanReportDoc[];
      const reports = collect(docs);
      if (reports.length === 0) {
        // First-run seed of demo data into Atlas for a lively demo
        const demos = buildDemoReports();
        await ReportModel.insertMany(demos.map(stripId)).catch(() => null);
        const seeded = (await ReportModel.find({}).sort({ createdAt: -1 }).limit(200).lean()) as LeanReportDoc[];
        return { reports: collect(seeded), source: "db" };
      }
      return { reports, source: "db" };
    } catch (err) {
      console.error("[store] db list failed, using memory:", redactForLog((err as Error).message));
    }
  }
  return { reports: seedMemory(), source: "memory" };
}

export async function getReport(id: string): Promise<WasteReport | null> {
  const { reports } = await listReports();
  return reports.find((r) => r.id === id) ?? null;
}

export async function createReport(
  report: WasteReport
): Promise<{ report: WasteReport; source: "db" | "memory" }> {
  const conn = await dbConnect().catch(() => null);
  if (conn) {
    try {
      const doc = await ReportModel.create(stripId(report));
      const saved = toReport({ ...doc.toObject(), _id: doc._id } as LeanReportDoc);
      if (saved) return { report: saved, source: "db" };
    } catch (err) {
      console.error("[store] db create failed, using memory:", redactForLog((err as Error).message));
    }
  }
  const mem = seedMemory();
  mem.unshift(report);
  return { report, source: "memory" };
}

export async function updateReportStatus(
  id: string,
  status: WasteReport["status"]
): Promise<WasteReport | null> {
  const conn = await dbConnect().catch(() => null);
  if (conn) {
    try {
      const doc = (await ReportModel.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).lean()) as LeanReportDoc | null;
      if (doc) return toReport(doc);
    } catch {
      // fall through to memory (id may be demo-XX, not an ObjectId)
    }
  }
  const mem = seedMemory();
  const idx = mem.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  mem[idx] = { ...mem[idx], status, updatedAt: new Date().toISOString() };
  return mem[idx];
}
