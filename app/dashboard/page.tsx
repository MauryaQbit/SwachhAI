import Link from "next/link";
import { Badge, Card, EmptyState, Eyebrow, Shell, StatCard } from "@/components/ui";
import { PageShell } from "@/components/layout";
import { listReports } from "@/lib/reports-store";
import { summarizeReports } from "@/lib/hotspots";
import { CATEGORY_LABELS } from "@/lib/waste";

export const dynamic = "force-dynamic";

const PRI_COLORS: Record<string, string> = {
  LOW: "bg-leaf-700",
  MODERATE: "bg-saffron-500",
  HIGH: "bg-clay-700",
  CRITICAL: "bg-clay-700",
};

function Bar({ label, value, max, color = "bg-leaf-900" }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="py-1.5">
      <div className="flex justify-between text-[13px]">
        <span className="font-medium">{label}</span>
        <span className="font-display font-black">{value}</span>
      </div>
      <div className="mt-1 h-2.5 rounded-sm border border-ink/20 bg-parchment" role="img" aria-label={`${label}: ${value}`}>
        <div className={`h-full rounded-[2px] ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const { reports } = await listReports().catch(() => ({ reports: [], source: "memory" as const }));
  if (reports.length === 0) {
    return (
      <PageShell><Shell><EmptyState title="No data yet" hint="Analyze waste to populate the dashboard." /></Shell></PageShell>
    );
  }
  const s = summarizeReports(reports);
  const demoCount = reports.filter((r) => r.isDemo).length;
  const maxCat = Math.max(1, ...Object.values(s.byCategory));
  const maxPri = Math.max(1, ...Object.values(s.byPriority));

  return (
    <PageShell>
      <Shell>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>Situation room</Eyebrow>
            <h1 className="font-display mt-2 text-3xl font-black sm:text-4xl">Intelligence dashboard</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Live figures from {s.total} filed reports
              {demoCount ? ` — includes ${demoCount} labeled demo entries` : ""}.
            </p>
          </div>
          <Link
            href="/map"
            className="rounded-lg border-2 border-ink bg-white px-4 py-2.5 text-sm font-bold shadow-[3px_3px_0_0_var(--color-line)] hover:bg-parchment"
          >
            Open hotspot map →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total reports" value={String(s.total)} sub="filed to date" accent />
          <StatCard label="Critical" value={String(s.critical)} sub="priority ≥ 75" />
          <StatCard label="High priority" value={String(s.high)} sub="priority 50–74" />
          <StatCard label="Resolved" value={String(s.resolved)} sub="work verified done" />
        </div>

        <div className="mt-6 grid items-start gap-4 lg:grid-cols-3">
          <Card>
            <h2 className="font-display text-lg font-bold">What&apos;s out there</h2>
            <p className="font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase">Waste categories</p>
            <div className="mt-2">
              {Object.entries(s.byCategory).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <Bar key={k} label={CATEGORY_LABELS[k as keyof typeof CATEGORY_LABELS] ?? k} value={v} max={maxCat} />
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="font-display text-lg font-bold">How urgent</h2>
            <p className="font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase">Priority distribution</p>
            <div className="mt-2">
              {(["CRITICAL", "HIGH", "MODERATE", "LOW"] as const).map((k) => (
                <Bar key={k} label={k} value={s.byPriority[k] ?? 0} max={maxPri} color={PRI_COLORS[k]} />
              ))}
            </div>
            <h2 className="font-display mt-4 text-lg font-bold">Pipeline state</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(s.byStatus).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1.5 rounded-md bg-paper px-2 py-1">
                  <Badge value={k} /> <span className="font-display text-sm font-black">{v}</span>
                </span>
              ))}
            </div>
          </Card>
          <div className="rounded-xl border-2 border-ink bg-leaf-950 p-5 text-paper shadow-[4px_4px_0_0_var(--color-ink)]">
            <h2 className="font-display text-lg font-bold">Observed hotspots</h2>
            <p className="font-mono text-[10px] tracking-[0.16em] text-paper/60 uppercase">Ranked this week</p>
            <ol className="mt-3 space-y-2.5">
              {s.hotspots.slice(0, 5).map((h, i) => (
                <li key={h.area} className="flex items-baseline gap-3 border-b border-paper/15 pb-2.5 last:border-0 last:pb-0">
                  <span className="font-display text-2xl font-black text-saffron-500">#{i + 1}</span>
                  <div className="text-sm">
                    <p className="font-bold">{h.area}</p>
                    <p className="font-mono text-[11px] text-paper/65">
                      {h.reports} reports · {h.highPriority} urgent · avg {h.avgPriority}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[11px] text-paper/55">Observed in app data — not official municipal figures.</p>
          </div>
        </div>

        <Card className="mt-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-bold">Latest filings</h2>
            <Link href="/reports" className="text-sm font-bold text-leaf-900 underline underline-offset-4">
              All reports →
            </Link>
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <tbody>
                {reports.slice(0, 8).map((r) => (
                  <tr key={r.id} className="ledger-row border-b border-line last:border-0">
                    <td className="py-2.5 pr-2 font-semibold">{r.area}</td>
                    <td className="py-2.5 pr-2"><Badge value={r.priority} /></td>
                    <td className="py-2.5 pr-2 font-display font-black">{r.priorityScore}<span className="text-xs text-ink-faint">/100</span></td>
                    <td className="py-2.5 pr-2 font-mono text-xs text-ink-faint">{r.createdAt.slice(0, 10)}</td>
                    <td className="py-2.5"><Link href={`/reports/${r.id}`} className="font-bold text-leaf-900 underline underline-offset-4">Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Shell>
    </PageShell>
  );
}
