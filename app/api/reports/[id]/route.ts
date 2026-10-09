import { ReportStatusValues } from "@/lib/waste";
import { getReport, updateReportStatus } from "@/lib/reports-store";
import { rateLimit, clientIp, LIMITS } from "@/lib/rate-limit";
import { fail, ok, rateLimited, bodyTooLarge } from "@/lib/api";
import { z } from "zod";

export const runtime = "nodejs";

const IdSchema = z.string().min(1).max(120);

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!IdSchema.safeParse(decodeURIComponent(id)).success) {
    return fail(400, "VALIDATION", "Invalid report id.");
  }
  const report = await getReport(decodeURIComponent(id));
  if (!report) return fail(404, "NOT_FOUND", "Report not found.");
  return ok({ report });
}

const PatchSchema = z.object({ status: z.enum(ReportStatusValues) });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const rl = rateLimit(`report-patch:${clientIp(req)}`, LIMITS.reportPatch.limit, LIMITS.reportPatch.windowMs);
  if (!rl.allowed) return rateLimited(rl.retryAfterSec);
  if (bodyTooLarge(req, 16 * 1024)) {
    return fail(413, "TOO_LARGE", "Request is too large.");
  }
  const { id } = await ctx.params;
  if (!IdSchema.safeParse(decodeURIComponent(id)).success) {
    return fail(400, "VALIDATION", "Invalid report id.");
  }
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return fail(400, "VALIDATION", "Invalid status value.");
  const updated = await updateReportStatus(decodeURIComponent(id), parsed.data.status);
  if (!updated) return fail(404, "NOT_FOUND", "Report not found.");
  return ok({ report: updated });
}
