import { describe, it, expect } from "vitest";
import { rateLimit, LIMITS } from "../lib/rate-limit";

describe("rate limiter", () => {
  it("allows up to the limit, then blocks with retry-after", () => {
    const key = `test-${Date.now()}`;
    for (let i = 0; i < LIMITS.analyze.limit; i++) {
      expect(rateLimit(key, LIMITS.analyze.limit, 60_000).allowed).toBe(true);
    }
    const blocked = rateLimit(key, LIMITS.analyze.limit, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("resets after the window passes", () => {
    const key = `window-${Date.now()}`;
    const now = Date.now();
    for (let i = 0; i < 3; i++) {
      rateLimit(key, 3, 1_000, now);
    }
    expect(rateLimit(key, 3, 1_000, now).allowed).toBe(false);
    expect(rateLimit(key, 3, 1_000, now + 1_001).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const a = `a-${Date.now()}`;
    const b = `b-${Date.now()}`;
    rateLimit(a, 1, 60_000);
    expect(rateLimit(a, 1, 60_000).allowed).toBe(false);
    expect(rateLimit(b, 1, 60_000).allowed).toBe(true);
  });
});
