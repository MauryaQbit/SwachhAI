"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, ErrorState, Eyebrow, Field, Shell } from "@/components/ui";
import { PageShell } from "@/components/layout";
import type { AIAnalysis } from "@/lib/waste";
import { CATEGORY_LABELS } from "@/lib/waste";
import { segregationFor } from "@/lib/segregation";
import { downscaleImage } from "@/lib/image";

interface AnalyzeResponse {
  ok: boolean;
  analysis?: AIAnalysis;
  priorityScore?: number;
  priority?: string;
  breakdown?: { factor: string; points: number; detail: string }[];
  mock?: boolean;
  code?: string;
  message?: string;
}

const STAGES = [
  "Detecting visible waste",
  "Classifying waste categories",
  "Assessing environmental risk",
  "Evaluating drainage risk",
  "Calculating priority",
];

const inputCls =
  "block w-full rounded-lg border-2 border-ink bg-paper p-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-leaf-700";

export default function AnalyzePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [stage, setStage] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [area, setArea] = useState("Laxmi Nagar, Delhi");
  const [saving, setSaving] = useState(false);

  function onFile(f: File | undefined) {
    setError(null);
    setResult(null);
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
      setError("Please upload a supported image (JPEG, PNG, WebP).");
      return;
    }
    if (f.size > 6 * 1024 * 1024) {
      setError("Image is too large. Please upload an image under 6MB.");
      return;
    }
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      // Persist a small thumbnail; the full photo is only sent to Gemini.
      void downscaleImage(dataUrl).then(setThumbnail);
    };
    reader.readAsDataURL(f);
  }

  async function runAnalysis() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a waste photo first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setStage(0);
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 900);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = (await res.json()) as AnalyzeResponse;
      if (!res.ok || !data.ok) {
        throw new Error(data.message ?? "AI analysis is temporarily unavailable. Please try again.");
      }
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      clearInterval(timer);
      setLoading(false);
      setStage(-1);
    }
  }

  async function createReport() {
    if (!result?.analysis || result.priorityScore === undefined || !result.priority) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...result.analysis,
          imageReference: thumbnail ?? preview ?? "",
          area,
          priorityScore: result.priorityScore,
          priority: result.priority,
          priorityBreakdown: result.breakdown ?? [],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message ?? "We couldn't save this report. Your analysis is still available.");
      router.push(`/reports/${data.report.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const a = result?.analysis;

  return (
    <PageShell>
      <Shell>
        <Eyebrow>Step 01 · Observation</Eyebrow>
        <h1 className="font-display mt-2 text-3xl font-black sm:text-4xl">AI Waste Scanner</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Photograph the waste, note the area, and SwachhAI does the rest — analysis,
          explained priority, and a filed report in one flow.
        </p>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="font-display text-xl font-bold">
              <span className="text-clay-700">1.</span> Upload observation
            </h2>
            <div className="mt-4">
              <Field label="Waste photo · JPEG / PNG / WebP · max 6 MB">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => onFile(e.target.files?.[0])}
                  className={inputCls}
                  aria-label="Upload waste photo"
                />
              </Field>
              {fileName ? <p className="mt-1.5 font-mono text-xs text-ink-faint">{fileName}</p> : null}
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview of uploaded waste" className="mt-3 max-h-72 w-full rounded-lg border-2 border-ink object-cover" />
              ) : (
                <div className="texture-dots mt-3 rounded-lg border-2 border-dashed border-ink-faint p-8 text-center text-sm text-ink-soft">
                  No photo yet. A roadside bin, a choked drain, a dumped pile — anything visible.
                </div>
              )}
              <div className="mt-4">
                <Field label="Observed area · coarse, no precise address">
                  <input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    maxLength={120}
                    className={inputCls}
                    placeholder="e.g. Laxmi Nagar, Delhi"
                  />
                </Field>
              </div>
              <div className="mt-4">
                <Button onClick={runAnalysis} disabled={loading || !preview}>
                  {loading ? "Analyzing…" : "Analyze waste →"}
                </Button>
              </div>
              {loading ? (
                <div className="mt-4 rounded-lg bg-parchment/70 p-4" role="status" aria-live="polite">
                  <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-ink uppercase">
                    Analyzing image…
                  </p>
                  <ol className="mt-2 space-y-1.5 font-mono text-[13px]">
                    {STAGES.map((s, i) => (
                      <li key={s} className={i <= stage ? "font-bold text-leaf-900" : "text-ink-faint"}>
                        {i < stage ? "✓ " : i === stage ? "→ " : "· "}{s}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-[11px] text-ink-faint">Stages are progress indicators while the model responds.</p>
                </div>
              ) : null}
              {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-xl font-bold">
              <span className="text-clay-700">2.</span> Intelligence dossier
            </h2>
            {!a ? (
              <p className="texture-dots mt-4 rounded-lg border-2 border-dashed border-ink-faint p-8 text-center text-sm text-ink-soft">
                Run an analysis and the dossier appears here — category, severity,
                risks, priority with reasons, and the recommended action.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {result?.mock ? (
                  <p className="rounded-lg border border-[#7c4a03] bg-[#fdf0d5] p-2.5 font-mono text-xs text-[#7c4a03]">
                    DEMO MODE — Gemini key not configured; validated fallback analysis shown.
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2 border-b-2 border-ink pb-4">
                  <Badge value={result?.priority ?? ""} />
                  <Badge value={a.severity} />
                  <span className="font-display ml-auto text-4xl font-black">
                    {result?.priorityScore}
                    <span className="text-lg text-ink-faint">/100</span>
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {[
                    ["Waste detected", a.detectedCategories.map((c) => CATEGORY_LABELS[c]).join(", ")],
                    ["Severity", `${a.severity} (${a.severityScore}/100)`],
                    ["Volume", a.estimatedVolume.replace("_", " ")],
                    ["Drain risk", a.drainRisk],
                    ["Environmental", a.environmentalRisk],
                    ["Public health", a.publicHealthRisk],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase">{k}</dt>
                      <dd className="font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div>
                  <h3 className="font-mono text-[11px] font-bold tracking-[0.18em] text-ink uppercase">
                    Why this priority?
                  </h3>
                  <ul className="mt-1.5 text-sm">
                    {result?.breakdown?.map((b) => (
                      <li key={b.factor} className="flex justify-between gap-2 border-b border-line py-1.5">
                        <span>{b.factor} <span className="text-ink-faint">— {b.detail}</span></span>
                        <span className="font-display font-black">+{b.points}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-ink-faint">SwachhAI prototype priority model — decision support only, not an official municipal algorithm.</p>
                </div>
                <div className="rounded-lg bg-leaf-50 p-3">
                  <h3 className="font-mono text-[11px] font-bold tracking-[0.18em] text-leaf-950 uppercase">
                    → Recommended action
                  </h3>
                  <p className="mt-1 text-sm font-semibold">{a.recommendedAction}</p>
                  <p className="mt-1 text-sm text-ink-soft">{a.explanation}</p>
                </div>
                <div>
                  <h3 className="font-mono text-[11px] font-bold tracking-[0.18em] text-ink uppercase">
                    Segregation guidance
                  </h3>
                  <pre className="mt-1.5 whitespace-pre-wrap rounded-lg border border-line bg-parchment/60 p-2.5 font-mono text-xs leading-relaxed">{a.segregationGuidance || segregationFor(a.detectedCategories)}</pre>
                  <p className="mt-1 text-[11px] text-ink-faint">Local segregation rules may vary by municipality.</p>
                </div>
                <Button onClick={createReport} disabled={saving}>
                  {saving ? "Filing…" : "File report → Dashboard"}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </Shell>
    </PageShell>
  );
}
