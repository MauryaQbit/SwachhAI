/**
 * Pure secret-scrubbing helper — intentionally dependency-free so it can be
 * used in server code, tests, and logging paths without the server-only vault.
 */
export function redactForLog(message: string): string {
  return message
    .replace(/mongodb(\+srv)?:\/\/[^\s"'@]*@[^\s"']*/gi, "mongodb://<redacted>@<redacted>")
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, "GEMINI_API_KEY=<redacted>");
}
