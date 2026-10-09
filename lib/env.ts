import "server-only";

/**
 * Central server-side environment vault.
 *
 * Guarantees:
 *  - Secrets are read in exactly one place, never scattered across routes.
 *  - `server-only` makes any accidental client-side import a BUILD error,
 *    so API keys can never be bundled into browser JavaScript.
 *  - Nothing here is ever logged, serialized, or returned to the client.
 */

function read(name: "GEMINI_API_KEY" | "MONGODB_URI" | "GEMINI_MODEL"): string {
  return (process.env[name] ?? "").trim();
}

export const serverEnv = {
  get geminiApiKey(): string {
    return read("GEMINI_API_KEY");
  },
  get mongodbUri(): string {
    return read("MONGODB_URI");
  },
  get geminiModel(): string {
    return read("GEMINI_MODEL") || "gemini-2.0-flash";
  },
  get hasGemini(): boolean {
    return serverEnv.geminiApiKey.length > 0;
  },
  get hasDatabase(): boolean {
    return serverEnv.mongodbUri.length > 0;
  },
};

/**
 * Re-exported here for server-code convenience; tests import ./redact
 * directly (importing this vault outside route handlers trips server-only).
 */
export { redactForLog } from "./redact";
