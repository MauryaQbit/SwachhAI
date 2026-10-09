import { Card, Eyebrow, Shell } from "@/components/ui";
import { PageShell } from "@/components/layout";

const SECTIONS: [string, string, React.ReactNode][] = [
  ["01", "The problem", "Garbage is photographed constantly and understood rarely. Photos pile up in chats and portals with no ranking of risk, drainage impact, or urgency — so cleanups stay reactive and unmeasured."],
  ["02", "The answer", "SwachhAI: See waste. Understand it. Prioritize it. Act on it. Every observation becomes comparable data — category, severity, volume, risks — scored one consistent way and worked top-down."],
  ["03", "Why AI earns its place", "Gemini vision converts an unstructured photo into validated signals in seconds. Without it this product is a photo album; with it, a volunteer's snapshot carries the same structured weight as an inspector's survey."],
  ["04", "The priority model", "A deterministic 100-point engine — Severity 25, Environment 20, Drain 20, Health 15, Accumulation 12, Exposure 8. Bands 0–24 / 25–49 / 50–74 / 75–100. AI proposes; arithmetic disposes. This is a prototype decision-support model, not municipal doctrine."],
  ["05", "The pilot, honestly", "Citizens and NGOs file observations → SwachhAI triages → a ward-level action queue → cleanup and inspection → status recorded. No claim of municipal integration today; the workflow is designed so a pilot partner could adopt it as-is."],
  ["06", "Privacy, non-negotiable", "No face recognition, no person identification, no precise private addresses. The model is instructed to read waste and drains only. The map shows coarse public areas."],
  ["07", "AI development disclosure", "Built with AI coding assistance plus the Gemini API. Model output is schema-validated and never stored as truth; final priority is deterministic code. Architecture, weights, copy, and review calls are the developer's. Models: Gemini 2.0 Flash for vision and assistant."],
  ["08", "What it can't do", "Estimates, not certainties. Image quality bounds accuracy. Demo records are synthetic and labeled. Local segregation rules differ by municipality. Nothing here replaces a human inspector's eyes."],
];

export default function AboutPage() {
  return (
    <PageShell>
      <Shell>
        <Eyebrow>Field manual</Eyebrow>
        <h1 className="font-display mt-2 max-w-2xl text-3xl font-black sm:text-4xl">
          Problem, method, and plain-stated limits
        </h1>
        <ol className="mt-6 overflow-hidden rounded-xl border-2 border-ink bg-white shadow-[4px_4px_0_0_var(--color-line)]">
          {SECTIONS.map(([n, title, body], i) => (
            <li key={n} className={`ledger-row grid gap-1 px-5 py-4 sm:grid-cols-[56px_220px_1fr] sm:gap-4 ${i > 0 ? "border-t border-line" : ""}`}>
              <span className="font-display text-2xl font-black text-clay-700">{n}</span>
              <span className="font-display text-lg font-bold">{title}</span>
              <span className="text-sm leading-relaxed text-ink-soft">{body}</span>
            </li>
          ))}
        </ol>
        <Card className="mt-4 border-leaf-900 bg-leaf-50">
          <p className="text-sm leading-relaxed">
            <strong>Roadmap.</strong> Phase 2: NGO queues, multilingual support, local rule packs.
            Phase 3: municipal APIs, route planning. Phase 4: sensor feeds. The MVP stays
            deliberately narrow — observe, understand, prioritize, act, measure.
          </p>
        </Card>
      </Shell>
    </PageShell>
  );
}
