import { listReports } from "@/lib/reports-store";
import { summarizeReports } from "@/lib/hotspots";
import { redactForLog } from "@/lib/env";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { reports, source } = await listReports();
    const summary = summarizeReports(reports);
    return ok({ summary, reports: reports.slice(0, 50) }, { source });
  } catch (err) {
    console.error("[api/analytics] failed:", redactForLog((err as Error).message));
    return fail(500, "DB_ERROR", "Could not load analytics. Please try again.");
  }
}
