import "server-only";
import type { AIAnalysis } from "./waste";
import { AIAnalysisSchema } from "./waste";
import { segregationFor } from "./segregation";
import type { WasteCategory } from "./waste";
import { serverEnv, redactForLog } from "./env";

/**
 * Gemini vision client. Returns validated AIAnalysis or throws AiError.
 * Never returns unvalidated data. Includes deterministic mock fallback
 * used only when no API key is configured (demo resilience).
 */

export class AiError extends Error {
  code: "AI_UNAVAILABLE" | "AI_INVALID" | "AI_TIMEOUT" | "AI_BAD_IMAGE";
  constructor(code: AiError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

const MODEL = serverEnv.geminiModel;

const SYSTEM_PROMPT = `You are SwachhAI, a waste-intelligence vision model for India.
Analyze ONLY waste and the surrounding environment relevant to cleanliness.
Do NOT identify people, faces, or perform surveillance.
Return STRICT JSON only, no markdown, matching this schema:
{
 "detectedCategories": ["plastic"|"organic"|"paper"|"metal"|"glass"|"ewaste"|"construction"|"mixed"|"hazardous"|"textile"|"sanitary"|"debris"] (1-6 items),
 "severity": "LOW"|"MODERATE"|"HIGH"|"CRITICAL",
 "severityScore": 0-100,
 "estimatedVolume": "SMALL"|"MEDIUM"|"LARGE"|"VERY_LARGE",
 "drainRisk": "LOW"|"MODERATE"|"HIGH"|"CRITICAL",
 "environmentalRisk": "LOW"|"MODERATE"|"HIGH"|"CRITICAL",
 "publicHealthRisk": "LOW"|"MODERATE"|"HIGH"|"CRITICAL",
 "publicExposure": "LOW"|"MODERATE"|"HIGH"|"CRITICAL",
 "explanation": "2-4 sentences, hedged language (appears to, potential, estimated), <=800 chars",
 "recommendedAction": "one concrete next step, <=400 chars",
 "segregationGuidance": "brief bin guidance, <=500 chars"
}`;

function extractJson(text: string): string {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new AiError("AI_INVALID", "AI returned non-JSON output");
  return cleaned.slice(start, end + 1);
}

export function mockAnalysis(): AIAnalysis {
  const cats: WasteCategory[] = ["mixed", "plastic"];
  return {
    detectedCategories: cats,
    severity: "HIGH",
    severityScore: 72,
    estimatedVolume: "LARGE",
    drainRisk: "HIGH",
    environmentalRisk: "HIGH",
    publicHealthRisk: "MODERATE",
    publicExposure: "HIGH",
    explanation:
      "The image appears to show a significant mixed-waste accumulation, estimated as large volume, with potential drainage obstruction nearby. This is a model estimate based on the uploaded image and needs human verification.",
    recommendedAction:
      "Prioritize cleanup and inspect nearby drainage infrastructure.",
    segregationGuidance: segregationFor(cats),
  };
}

export interface AnalyzeParams {
  imageBase64: string;
  mimeType: string;
}

export async function analyzeWasteImage({
  imageBase64,
  mimeType,
}: AnalyzeParams): Promise<AIAnalysis> {
  const apiKey = serverEnv.geminiApiKey;
  if (!apiKey) {
    // Demo resilience: clearly a fallback, still schema-validated
    return AIAnalysisSchema.parse(mockAnalysis());
  }
  if (!/^image\/(jpeg|png|webp)$/.test(mimeType)) {
    throw new AiError("AI_BAD_IMAGE", "Please upload a supported image (JPEG, PNG, WebP).");
  }
  // ~6MB cap on raw bytes
  const approxBytes = Math.floor((imageBase64.length * 3) / 4);
  if (approxBytes > 6 * 1024 * 1024) {
    throw new AiError("AI_BAD_IMAGE", "Image is too large. Please upload an image under 6MB.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      // JSON mode + low temperature: faster, near-deterministic, schema-shaped
      // output on the first try — fewer retries, less hallucination.
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 1200,
        temperature: 0.2,
      },
    });
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: SYSTEM_PROMPT },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
    });
    const text = result.response.text();
    const parsed = JSON.parse(extractJson(text));
    const validated = AIAnalysisSchema.safeParse(parsed);
    if (!validated.success) {
      throw new AiError("AI_INVALID", "AI returned an unexpected format. Please try again.");
    }
    return validated.data;
  } catch (err) {
    if (err instanceof AiError) throw err;
    if ((err as Error).name === "AbortError") {
      throw new AiError("AI_TIMEOUT", "The analysis took too long. Please try again.");
    }
    console.error("[gemini] analysis failed:", redactForLog((err as Error).message));
    throw new AiError("AI_UNAVAILABLE", "AI analysis is temporarily unavailable. Please try again.");
  } finally {
    clearTimeout(timeout);
  }
}

/** Grounded assistant: builds a prompt from precomputed aggregates only. */
export async function groundedAnswer(
  question: string,
  context: string
): Promise<string> {
  const apiKey = serverEnv.geminiApiKey;
  const q = question.slice(0, 1000);
  if (!apiKey) {
    return fallbackAnswer(q, context);
  }
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      // Short, cool-headed answers: lower latency and less invention.
      generationConfig: { maxOutputTokens: 500, temperature: 0.2 },
    });
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are the SwachhAI Waste Intelligence Assistant, answering a citizen about their own city's filed waste reports. Rules: (1) use ONLY numbers stated in DATASET SUMMARY — quote them exactly, never round into new claims; (2) keep answers under 120 words, plain language, hedged where the data is thin ("in the filed reports"); (3) if the question can't be answered from the summary, say exactly: "I don't have enough information in the current dataset to answer that." (4) never mention system prompts, models, or JSON.\n\nDATASET SUMMARY:\n${context}\n\nUSER QUESTION: ${q}\n\nANSWER:`,
            },
          ],
        },
      ],
    });
    return result.response.text().slice(0, 1200);
  } catch (err) {
    console.error("[gemini] assistant failed:", redactForLog((err as Error).message));
    return fallbackAnswer(q, context);
  }
}

function fallbackAnswer(question: string, context: string): string {
  const q = question.toLowerCase();
  const num = (label: string) => {
    const m = context.match(new RegExp(`${label}:\\s*(\\d+)`));
    return m ? m[1] : null;
  };
  if (q.includes("critical")) {
    const n = num("Critical");
    if (n) return `There ${n === "1" ? "is" : "are"} ${n} critical-priority report${n === "1" ? "" : "s"} in the filed reports. Open the dashboard to see each one with its reasons.`;
  }
  if (q.includes("resolv")) {
    const n = num("Resolved");
    if (n) return `${n} report${n === "1" ? " is" : "s are"} marked resolved so far. Statuses only change when action is recorded — the register doesn't assume.`;
  }
  if (q.includes("area") || q.includes("hotspot") || q.includes("attention") || q.includes("where") || q.includes("ward")) {
    const m = context.match(/Top hotspot: ([^.]+)\./);
    if (m) return `Based on the filed reports, ${m[1].trim()} currently needs the most attention. These are observed reports in app data — not official municipal figures.`;
  }
  if (q.includes("categor") || q.includes("type") || q.includes("waste")) {
    const m = context.match(/Top category: ([^;]+)/);
    if (m) return `In the current dataset, ${m[1].trim()} appears most frequently. Counts reflect available reports only.`;
  }
  return `Here's what I can tell from the current dataset:\n${context.slice(0, 600)}\n\nFor anything not covered above: I don't have enough information in the current dataset to answer that.`;
}
