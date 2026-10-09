import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: { source?: string }) {
  return NextResponse.json({ ok: true, ...data }, { status: 200, headers: init?.source ? { "X-SwachhAI-Source": init.source } : undefined });
}

export function created<T>(data: T) {
  return NextResponse.json({ ok: true, ...data }, { status: 201 });
}

export function fail(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

export function rateLimited(retryAfterSec: number) {
  return NextResponse.json(
    { ok: false, code: "RATE_LIMITED", message: "Too many requests. Please slow down and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}

/** Cheap pre-parse guard: refuse absurdly large bodies before JSON parsing. */
export function bodyTooLarge(req: Request, maxBytes: number): boolean {
  const len = req.headers.get("content-length");
  if (len == null) return false;
  const n = Number(len);
  return Number.isFinite(n) && n > maxBytes;
}

export function aiErrorToResponse(err: unknown) {
  const e = err as { code?: string; message?: string };
  switch (e?.code) {
    case "AI_BAD_IMAGE":
      return fail(400, "BAD_IMAGE", e.message ?? "Please upload a supported image.");
    case "AI_TIMEOUT":
      return fail(504, "AI_TIMEOUT", e.message ?? "The analysis took too long. Please try again.");
    case "AI_INVALID":
      return fail(502, "AI_INVALID", e.message ?? "AI returned an unexpected format.");
    default:
      return fail(503, "AI_UNAVAILABLE", "AI analysis is temporarily unavailable. Please try again.");
  }
}
