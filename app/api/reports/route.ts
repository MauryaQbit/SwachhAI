import { CreateReportSchema } from "@/lib/waste";
import { calculatePriority } from "@/lib/priority";
import { createReport, listReports } from "@/lib/reports-store";
import { redactForLog } from "@/lib/env";
import { rateLimit, clientIp, LIMITS } from "@/lib/rate-limit";
import { created, fail, ok, rateLimited, bodyTooLarge } from "@/lib/api";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { reports, source } = await listReports();
    return ok({ reports, count: reports.length }, { source });
  } catch (err) {
    console.error("[api/reports] list failed:", redactForLog((err as Error).message));
    return fail(500, "DB_ERROR", "Could not load reports. Please try again.");
  }
}

export async function POST(req: Request) {
  const rl = rateLimit(`report-write:${clientIp(req)}`, LIMITS.reportWrite.limit, LIMITS.reportWrite.windowMs);
  if (!rl.allowed) return rateLimited(rl.retryAfterSec);
  if (bodyTooLarge(req, 2 * 1024 * 1024)) {
    return fail(413, "TOO_LARGE", "Report payload is too large.");
  }
  try {
    const body = await req.json().catch(() => null);
    const parsed = CreateReportSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, "VALIDATION", "Invalid report data: " + parsed.error.issues[0]?.message);
    }
    const input = parsed.data;
    // Server owns the priority: recompute deterministically, ignore spoofed scores
    const recalc = calculatePriority(input);
    const now = new Date().toISOString();
    const report = {
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      priorityScore: recalc.priorityScore,
      priority: recalc.priority,
      priorityBreakdown: recalc.breakdown,
      status: "ASSESSED" as const,
      isDemo: false as const,
    };
    const { report: saved } = await createReport(report);
    return created({ report: saved });
  } catch (err) {
    console.error("[api/reports] create failed:", redactForLog((err as Error).message));
    return fail(500, "DB_ERROR", "We couldn't save this report. Your analysis is still available.");
  }
}
