"use client";

import { useMemo, useState } from "react";
import { Badge, Card, ErrorState, Eyebrow, Shell } from "@/components/ui";
import { PageShell } from "@/components/layout";
import type { WasteReport } from "@/lib/waste";
import { CATEGORY_LABELS, ReportStatusValues } from "@/lib/waste";
import { segregationFor } from "@/lib/segregation";
import { nearestFacility } from "@/lib/infrastructure";

export default function ReportDetailClient({ report: initial }: { report: WasteReport }) {
  const [report, setReport] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nearby = useMemo(() => {
    if (report.latitude == null || report.longitude == null) return null;
    return nearestFacility(report.latitude, report.longitude);
  }, [report.latitude, report.longitude]);

  async function setStatus(status: WasteReport["status"]) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message ?? "Could not update status.");
      setReport(data.report);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell>
      <Shell>
        <Eyebrow>
          Dossier · {report.id.slice(0, 8).toUpperCase()} · {report.isDemo ? "Demo entry (synthetic)" : "Field observation"}
        </Eyebrow>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-3xl font-black sm:text-4xl">{report.area}</h1>
          <Badge value={report.priority} />
          <Badge value={report.status} />
        </div>
        <p className="mt-2 font-mono text-xs tracking-wide text-ink-faint uppercase">
          Priority {report.priorityScore}/100 · {report.severity} · filed {new Date(report.createdAt).toLocaleString()}
        </p>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
          <Card>
            {report.imageReference ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={report.imageReference} alt={`Waste observed at ${report.area}`} className="max-h-80 w-full rounded-lg border-2 border-ink object-cover" />
            ) : (
              <div className="texture-dots rounded-lg border-2 border-dashed border-ink-faint p-8 text-center text-sm text-ink-soft">
                No photo stored with this entry (demo record).
              </div>
            )}
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {[
                ["Categories", report.detectedCategories.map((c) => CATEGORY_LABELS[c]).join(", ")],
                ["Volume", report.estimatedVolume.replace("_", " ")],
                ["Drain risk", report.drainRisk],
                ["Environmental", report.environmentalRisk],
                ["Public health", report.publicHealthRisk],
                ["Exposure", report.publicExposure],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <div className="space-y-4">
            <Card>
              <h2 className="font-mono text-[11px] font-bold tracking-[0.18em] uppercase">Why this priority?</h2>
              <ul className="mt-1.5 text-sm">
                {report.priorityBreakdown.map((b) => (
                  <li key={b.factor} className="flex justify-between gap-2 border-b border-line py-1.5 last:border-0">
                    <span>{b.factor} <span className="text-ink-faint">— {b.detail}</span></span>
                    <span className="font-display font-black">+{b.points}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-ink-faint">SwachhAI prototype priority model — decision support only.</p>
            </Card>
            <div className="rounded-xl border-2 border-ink bg-leaf-50 p-5 shadow-[4px_4px_0_0_var(--color-line)]">
              <h2 className="font-mono text-[11px] font-bold tracking-[0.18em] text-leaf-950 uppercase">→ Recommended action</h2>
              <p className="mt-1 text-sm font-semibold">{report.recommendedAction}</p>
              <p className="mt-1 text-sm text-ink-soft">{report.explanation}</p>
              {nearby ? (
                <p className="mt-2 border-t border-leaf-900/20 pt-2 font-mono text-xs text-leaf-950">
                  Nearest major disposal site (real OSM data): {nearby.facility.name}, ~{nearby.km} km — bulk loads go here, not the roadside.
                </p>
              ) : null}
              <h3 className="mt-3 font-mono text-[11px] font-bold tracking-[0.18em] text-leaf-950 uppercase">Segregation</h3>
              <pre className="mt-1.5 whitespace-pre-wrap font-mono text-xs leading-relaxed">{report.segregationGuidance || segregationFor(report.detectedCategories)}</pre>
              <p className="mt-1 text-[11px] text-ink-faint">Local segregation rules may vary by municipality.</p>
            </div>
            <Card>
              <h2 className="font-mono text-[11px] font-bold tracking-[0.18em] uppercase">Move this report</h2>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {ReportStatusValues.map((s) => (
                  <button
                    key={s}
                    disabled={saving || s === report.status}
                    onClick={() => setStatus(s)}
                    className={`rounded-md border-2 px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider uppercase ${s === report.status ? "border-ink bg-leaf-950 text-paper" : "border-ink bg-paper text-ink hover:bg-parchment"} disabled:opacity-50`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
              {error ? <div className="mt-3"><ErrorState message={error} /></div> : null}
              <div className="mt-3 flex gap-4 text-sm">
                <a href="/dashboard" className="font-bold text-leaf-900 underline underline-offset-4">Dashboard →</a>
                <a href="/map" className="font-bold text-leaf-900 underline underline-offset-4">Map →</a>
              </div>
            </Card>
          </div>
        </div>
      </Shell>
    </PageShell>
  );
}
