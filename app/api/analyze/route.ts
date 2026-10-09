import { analyzeWasteImage, AiError } from "@/lib/gemini";
import { calculatePriority } from "@/lib/priority";
import { serverEnv, redactForLog } from "@/lib/env";
import { rateLimit, clientIp, LIMITS } from "@/lib/rate-limit";
import { ok, fail, aiErrorToResponse, rateLimited, bodyTooLarge } from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const MAX_BODY_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  const rl = rateLimit(`analyze:${clientIp(req)}`, LIMITS.analyze.limit, LIMITS.analyze.windowMs);
  if (!rl.allowed) return rateLimited(rl.retryAfterSec);
  if (bodyTooLarge(req, MAX_BODY_BYTES)) {
    return fail(413, "TOO_LARGE", "Request is too large. Please upload an image under 6MB.");
  }
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let base64 = "";
    let mimeType = "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("image");
      if (!(file instanceof File)) return fail(400, "BAD_IMAGE", "Please upload a supported image.");
      mimeType = file.type;
      if (!ALLOWED.has(mimeType)) return fail(400, "BAD_IMAGE", "Please upload a supported image (JPEG, PNG, WebP).");
      if (file.size > MAX_UPLOAD_BYTES) return fail(400, "BAD_IMAGE", "Image is too large. Please upload an image under 6MB.");
      const buf = Buffer.from(await file.arrayBuffer());
      base64 = buf.toString("base64");
    } else {
      const body = (await req.json().catch(() => null)) as {
        imageBase64?: unknown;
        mimeType?: unknown;
      } | null;
      if (typeof body?.imageBase64 !== "string" || typeof body?.mimeType !== "string") {
        return fail(400, "BAD_REQUEST", "imageBase64 and mimeType are required.");
      }
      mimeType = body.mimeType;
      base64 = body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
      if (!ALLOWED.has(mimeType)) return fail(400, "BAD_IMAGE", "Please upload a supported image (JPEG, PNG, WebP).");
      if (!/^[A-Za-z0-9+/=\s]+$/.test(base64)) {
        return fail(400, "BAD_IMAGE", "Please upload a supported image.");
      }
      if (Math.floor((base64.length * 3) / 4) > MAX_UPLOAD_BYTES)
        return fail(400, "BAD_IMAGE", "Image is too large. Please upload an image under 6MB.");
    }

    const analysis = await analyzeWasteImage({ imageBase64: base64, mimeType });
    const priority = calculatePriority(analysis);
    return ok({
      analysis,
      priorityScore: priority.priorityScore,
      priority: priority.priority,
      breakdown: priority.breakdown,
      mock: !serverEnv.hasGemini,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError" || (err as AiError)?.code) {
      return aiErrorToResponse(err);
    }
    console.error("[api/analyze] unexpected:", redactForLog((err as Error).message));
    return fail(500, "INTERNAL", "Something went wrong. Please try again.");
  }
}
