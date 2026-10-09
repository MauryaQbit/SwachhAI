import Link from "next/link";
import { Eyebrow, Shell } from "@/components/ui";
import { PageShell } from "@/components/layout";
import { listReports } from "@/lib/reports-store";
import { summarizeReports } from "@/lib/hotspots";

const STEPS = [
  {
    n: "01",
    title: "See",
    body: "A citizen, volunteer, or shopkeeper photographs an overflowing bin, a choked drain, roadside debris. Coarse area only — never a private address.",
  },
  {
    n: "02",
    title: "Analyze",
    body: "Gemini vision reads the photo and returns structured signals — category, severity, volume, drain and health risk — schema-validated, never raw text.",
  },
  {
    n: "03",
    title: "Prioritize",
    body: "A deterministic 100-point engine scores every report the same way, and shows its working. No black box, no invented urgency.",
  },
  {
    n: "04",
    title: "Act",
    body: "Reports land in an action queue with drain checks and segregation guidance. Status moves to Resolved only when work is done.",
  },
];

export default async function Home() {
  const { reports } = await listReports().catch(() => ({
    reports: [],
    source: "memory" as const,
  }));
  const s = summarizeReports(reports);

  return (
    <PageShell>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="texture-grid border-b-2 border-ink">
        <Shell>
          <div className="grid items-start gap-10 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-10">
            <div>
              <Eyebrow>Swachh Bharat · AI-first civic prototype</Eyebrow>
              <h1 className="font-display mt-4 text-[2.3rem] leading-[1.02] font-black text-ink sm:text-6xl">
                Waste reports,
                <br />
                engineered
                <br />
                into <span className="text-leaf-900 italic">action.</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft sm:text-base">
                SwachhAI reads a photo of garbage the way an experienced sanitary
                inspector would — what it is, how bad it is, whether the drain is
                threatened — then ranks it so cleanups happen where they matter most.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/analyze"
                  className="rounded-lg bg-leaf-950 px-6 py-3.5 text-sm font-bold text-paper shadow-[3px_3px_0_0_var(--color-ink)] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--color-ink)]"
                >
                  Analyze waste →
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-lg border-2 border-ink bg-paper px-6 py-3.5 text-sm font-bold text-ink shadow-[3px_3px_0_0_var(--color-ink)] transition hover:bg-parchment"
                >
                  Explore live data
                </Link>
              </div>
              <dl className="mt-9 grid max-w-xl grid-cols-3 divide-x-2 divide-ink border-y-2 border-ink bg-white/60">
                {[
                  [String(s.total), "reports filed"],
                  [`${s.critical + s.high}`, "need action"],
                  [s.topHotspot.split(",")[0], "top hotspot"],
                ].map(([v, l]) => (
                  <div key={l} className="px-4 py-3">
                    <dt className="order-2 mt-1 block font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase">
                      {l}
                    </dt>
                    <dd className="font-display truncate text-2xl font-black text-ink sm:text-3xl">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Field dossier card */}
            <aside
              aria-label="Sample intelligence dossier"
              className="relative rounded-xl border-2 border-ink bg-white p-6 shadow-[6px_6px_0_0_var(--color-ink)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] tracking-[0.22em] text-ink-faint uppercase">
                    Field dossier · № 0247
                  </p>
                  <p className="font-display mt-1 text-2xl font-bold">Laxmi Nagar, Delhi</p>
                </div>
                <span className="stamp text-clay-700" aria-label="Priority critical, 82 of 100">
                  82
                </span>
              </div>
              <dl className="mt-5 space-y-0 border-t-2 border-ink text-sm">
                {[
                  ["Waste", "Mixed, plastic spillover"],
                  ["Severity", "HIGH — large volume"],
                  ["Drain", "Mouth partially covered"],
                  ["Health", "Moderate · market lane"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-line py-2">
                    <dt className="font-mono text-[11px] tracking-[0.14em] text-ink-faint uppercase">{k}</dt>
                    <dd className="text-right font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 bg-leaf-50 p-3 font-mono text-xs leading-relaxed text-leaf-950">
                → ACTION: Deploy cleanup crew + inspect storm-drain mouth before monsoon runoff.
              </p>
              <div className="tricolor-rule mt-5 h-1 rounded-full" aria-hidden />
              <p className="mt-2 font-mono text-[10px] tracking-wider text-ink-faint uppercase">
                Sample rendering · estimates only
              </p>
            </aside>
          </div>
        </Shell>
      </section>

      {/* ── Pipeline ledger ──────────────────────────────── */}
      <section aria-label="How SwachhAI works">
        <Shell>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <Eyebrow>The pipeline</Eyebrow>
              <h2 className="font-display mt-2 text-3xl font-black sm:text-4xl">
                From eyesore to work order
              </h2>
            </div>
            <p className="max-w-sm text-sm text-ink-soft">
              Four stages. Sixty to ninety seconds. Understandable without narration.
            </p>
          </div>
          <ol className="mt-6 overflow-hidden rounded-xl border-2 border-ink bg-white shadow-[4px_4px_0_0_var(--color-line)]">
            {STEPS.map((st, i) => (
              <li
                key={st.n}
                className={`ledger-row grid gap-1 px-5 py-4 sm:grid-cols-[64px_140px_1fr] sm:items-baseline sm:gap-4 ${i > 0 ? "border-t border-line" : ""}`}
              >
                <span className="font-display text-2xl font-black text-clay-700">{st.n}</span>
                <span className="font-display text-xl font-bold">{st.title}</span>
                <span className="text-sm leading-relaxed text-ink-soft">{st.body}</span>
              </li>
            ))}
          </ol>
        </Shell>
      </section>

      {/* ── Entry points ─────────────────────────────────── */}
      <section className="border-t-2 border-ink bg-parchment/60">
        <Shell>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                href: "/map",
                kicker: "Where it piles up",
                title: "Hotspot map",
                body: `${s.hotspots.length} observed areas ranked by volume and urgency. Coarse public locations only.`,
              },
              {
                href: "/assistant",
                kicker: "Ask the data",
                title: "Waste assistant",
                body: "Which area needs attention? What waste dominates? Answered from reports — never invented.",
              },
              {
                href: "/about",
                kicker: "Trust, stated plainly",
                title: "Method & limits",
                body: "Prototype model, privacy rules, AI disclosure, and what this system honestly cannot do.",
              },
            ].map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group rounded-xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_0_var(--color-line)] transition hover:-translate-y-0.5 hover:shadow-[5px_6px_0_0_var(--color-line)]"
              >
                <p className="font-mono text-[11px] tracking-[0.2em] text-clay-700 uppercase">{c.kicker}</p>
                <p className="font-display mt-1 text-2xl font-bold group-hover:underline">
                  {c.title} <span aria-hidden>→</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.body}</p>
              </Link>
            ))}
          </div>
        </Shell>
      </section>
    </PageShell>
  );
}
