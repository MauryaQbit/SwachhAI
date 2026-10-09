import Link from "next/link";
import MapClient from "@/components/map-client";
import { Card, Eyebrow, Shell } from "@/components/ui";
import { PageShell } from "@/components/layout";
import { listReports } from "@/lib/reports-store";
import { summarizeReports } from "@/lib/hotspots";
import { getFacilities, INFRA_ATTRIBUTION, INFRA_FETCHED } from "@/lib/infrastructure";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const { reports } = await listReports().catch(() => ({ reports: [], source: "memory" as const }));
  const s = summarizeReports(reports);
  const facilities = getFacilities();
  return (
    <PageShell>
      <Shell>
        <Eyebrow>Survey map</Eyebrow>
        <h1 className="font-display mt-2 text-3xl font-black sm:text-4xl">Where it piles up</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          {reports.length} reports plotted by coarse public area. Marker color is the
          priority band — deep red means go there first. Black <strong>L</strong> squares
          are {facilities.length} real major disposal sites (OpenStreetMap, verified {INFRA_FETCHED}).
          No precise private addresses, ever.
        </p>
        <div className="mt-5 overflow-hidden rounded-xl border-2 border-ink shadow-[4px_4px_0_0_var(--color-line)]">
          <MapClient reports={reports} facilities={facilities} />
        </div>
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-display text-lg font-bold">Observed hotspots, ranked</h2>
            <ol className="mt-2">
              {s.hotspots.slice(0, 6).map((h, i) => (
                <li key={h.area} className="ledger-row flex items-baseline gap-3 border-b border-line py-2 last:border-0">
                  <span className="font-display text-xl font-black text-clay-700">#{i + 1}</span>
                  <div className="text-sm">
                    <p className="font-bold">{h.area}</p>
                    <p className="font-mono text-[11px] text-ink-faint">
                      {h.reports} reports · {h.highPriority} urgent · avg {h.avgPriority}/100
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
          <Card>
            <h2 className="font-display text-lg font-bold">Reading the map</h2>
            <ul className="mt-2 space-y-1.5 font-mono text-[13px]">
              <li><span className="font-black text-leaf-700">●</span> LOW — routine round</li>
              <li><span className="font-black text-saffron-500">●</span> MODERATE — schedule it</li>
              <li><span className="font-black text-clay-700">●</span> HIGH — this week</li>
              <li><span className="font-black text-clay-700">●</span> CRITICAL — go now</li>
              <li><span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] bg-ink align-middle font-mono text-[9px] font-black text-paper">L</span> Major disposal site</li>
            </ul>
            <p className="mt-3 text-xs text-ink-faint">Report markers use synthetic/coarse locations. Disposal sites: {INFRA_ATTRIBUTION} (ODbL). Base map © OpenStreetMap contributors.</p>
            <Link href="/dashboard" className="mt-2 inline-block text-sm font-bold text-leaf-900 underline underline-offset-4">Back to dashboard →</Link>
          </Card>
        </div>
      </Shell>
    </PageShell>
  );
}
