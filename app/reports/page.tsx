import Link from "next/link";
import { Badge, Card, EmptyState, Eyebrow, Shell } from "@/components/ui";
import { PageShell } from "@/components/layout";
import { listReports } from "@/lib/reports-store";
import { CATEGORY_LABELS } from "@/lib/waste";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  let reports: Awaited<ReturnType<typeof listReports>>["reports"] = [];
  let loadError = false;
  try {
    ({ reports } = await listReports());
  } catch {
    loadError = true;
  }
  const demoCount = reports.filter((r) => r.isDemo).length;

  return (
    <PageShell>
      <Shell>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>Action queue</Eyebrow>
            <h1 className="font-display mt-2 text-3xl font-black sm:text-4xl">Reports</h1>
            <p className="mt-2 text-sm text-ink-soft">
              {reports.length} on file {demoCount > 0 ? `· ${demoCount} labeled demo entries` : ""} —
              highest priority first is the sensible order of work.
            </p>
          </div>
          <Link
            href="/analyze"
            className="rounded-lg bg-leaf-950 px-5 py-3 text-sm font-bold text-paper shadow-[3px_3px_0_0_var(--color-ink)] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--color-ink)]"
          >
            + File new report
          </Link>
        </div>
        {loadError ? <p role="alert" className="mt-4 text-sm font-bold text-clay-700">Could not load reports. Please try again.</p> : null}
        {reports.length === 0 ? (
          <div className="mt-6"><EmptyState title="No reports yet" hint="Run your first AI waste analysis to create one." /></div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border-2 border-ink bg-white shadow-[4px_4px_0_0_var(--color-line)]">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="border-b-2 border-ink bg-paper font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">
                  <th className="px-4 py-3">Report</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Filed</th>
                  <th className="px-4 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="ledger-row border-b border-line last:border-0">
                    <td className="px-4 py-3 font-mono text-xs font-bold">
                      {r.id.slice(0, 8).toUpperCase()}…
                      {r.isDemo ? <span className="ml-1.5 rounded border border-ink-faint px-1.5 py-0.5 text-[10px] text-ink-faint">DEMO</span> : null}
                    </td>
                    <td className="px-4 py-3">{r.detectedCategories.map((c) => CATEGORY_LABELS[c]).join(", ")}</td>
                    <td className="px-4 py-3"><Badge value={r.priority} /> <span className="font-display ml-1 font-black">{r.priorityScore}</span></td>
                    <td className="px-4 py-3">{r.area}</td>
                    <td className="px-4 py-3"><Badge value={r.status} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-faint">{r.createdAt.slice(0, 10)}</td>
                    <td className="px-4 py-3"><Link href={`/reports/${r.id}`} className="font-bold text-leaf-900 underline underline-offset-4">Open →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Card className="mt-6 border-leaf-900 bg-leaf-50">
          <h2 className="font-display text-lg font-bold">Standing orders</h2>
          <ol className="mt-2 list-decimal pl-5 text-sm leading-relaxed text-ink-soft">
            <li>Work the queue top-down by priority score.</li>
            <li>Drain risk HIGH or above → inspect the drain mouth before anything else.</li>
            <li>Segregate recoverable material where it is safe to do so.</li>
            <li>Mark status after action — the dashboard only measures what&apos;s recorded.</li>
          </ol>
        </Card>
      </Shell>
    </PageShell>
  );
}
