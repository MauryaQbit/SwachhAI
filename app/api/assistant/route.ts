import { z } from "zod";
import { listReports } from "@/lib/reports-store";
import { summarizeReports, assistantContext } from "@/lib/hotspots";
import { groundedAnswer } from "@/lib/gemini";
import { redactForLog } from "@/lib/env";
import { rateLimit, clientIp, LIMITS } from "@/lib/rate-limit";
import { fail, ok, rateLimited, bodyTooLarge } from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 30;

const BodySchema = z.object({ question: z.string().min(2).max(1000) });

export async function POST(req: Request) {
  const rl = rateLimit(`assistant:${clientIp(req)}`, LIMITS.assistant.limit, LIMITS.assistant.windowMs);
  if (!rl.allowed) return rateLimited(rl.retryAfterSec);
  if (bodyTooLarge(req, 16 * 1024)) {
    return fail(413, "TOO_LARGE", "Question is too long.");
  }
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return fail(400, "VALIDATION", "Please ask a question (2–1000 characters).");
  try {
    const { reports } = await listReports();
    const summary = summarizeReports(reports);
    const context = assistantContext(summary);
    const answer = await groundedAnswer(parsed.data.question, context);
    return ok({ answer, context });
  } catch (err) {
    console.error("[api/assistant] failed:", redactForLog((err as Error).message));
    return fail(500, "INTERNAL", "Assistant is temporarily unavailable. Please try again.");
  }
}
