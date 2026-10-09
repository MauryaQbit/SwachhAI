import { describe, it, expect } from "vitest";
import { redactForLog } from "../lib/redact";
import { bodyTooLarge } from "../lib/api";
import { CreateReportSchema } from "../lib/waste";

const VALID_REPORT = {
  detectedCategories: ["plastic"],
  severity: "LOW",
  severityScore: 10,
  estimatedVolume: "SMALL",
  drainRisk: "LOW",
  environmentalRisk: "LOW",
  publicHealthRisk: "LOW",
  imageReference: "data:image/jpeg;base64,/9j/AAAA",
  area: "Test Area",
  priorityScore: 10,
  priority: "LOW",
  priorityBreakdown: [],
  explanation: "This explanation is long enough to pass validation rules.",
  recommendedAction: "Do something reasonable here please.",
};

describe("log redaction", () => {
  it("scrubs MongoDB URIs and Gemini-like keys", () => {
    const dirty =
      "connect mongodb+srv://admin:s3cret@cluster.mongodb.net/db failed AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456";
    const clean = redactForLog(dirty);
    expect(clean).not.toContain("s3cret");
    expect(clean).not.toContain("AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456");
    expect(clean).toContain("<redacted>");
  });

  it("leaves benign messages untouched", () => {
    expect(redactForLog("db list failed: timeout")).toBe("db list failed: timeout");
  });
});

describe("body-size guard", () => {
  it("rejects oversized content-length, allows normal and missing", () => {
    const big = new Request("http://x/", { headers: { "content-length": "99999999" } });
    expect(bodyTooLarge(big, 1024)).toBe(true);
    const small = new Request("http://x/", { headers: { "content-length": "12" } });
    expect(bodyTooLarge(small, 1024)).toBe(false);
    const none = new Request("http://x/");
    expect(bodyTooLarge(none, 1024)).toBe(false);
  });
});

describe("report input hardening", () => {
  it("rejects javascript:/blob: image smuggling", () => {
    for (const evil of [
      "javascript:alert(1)",
      "blob:https://evil/x",
      "data:text/html;base64,PHNjcmlwdA==",
      "data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Pg==",
    ]) {
      const r = CreateReportSchema.safeParse({ ...VALID_REPORT, imageReference: evil });
      expect(r.success).toBe(false);
    }
  });

  it("accepts genuine data-URL thumbnails, rejects oversized", () => {
    expect(CreateReportSchema.safeParse(VALID_REPORT).success).toBe(true);
    const huge = CreateReportSchema.safeParse({
      ...VALID_REPORT,
      imageReference: "data:image/jpeg;base64," + "A".repeat(1_000_001),
    });
    expect(huge.success).toBe(false);
  });

  it("strips unknown keys incl. __proto__ (prototype-pollution safe)", () => {
    const payload = JSON.parse(
      `{"__proto__":{"polluted":true},"$where":"evil()","status":"HACKED",${JSON.stringify(VALID_REPORT).slice(1)}`
    );
    const r = CreateReportSchema.safeParse(payload);
    expect(r.success).toBe(true);
    if (r.success) {
      expect("polluted" in r.data).toBe(false);
      expect("$where" in r.data).toBe(false);
      expect("status" in r.data).toBe(false);
    }
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
  });

  it("rejects spoofed-but-out-of-range scores and bad enums", () => {
    expect(
      CreateReportSchema.safeParse({ ...VALID_REPORT, priorityScore: 999 }).success
    ).toBe(false);
    expect(
      CreateReportSchema.safeParse({ ...VALID_REPORT, priority: "URGENT" }).success
    ).toBe(false);
  });
});
