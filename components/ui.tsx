import type { ReactNode } from "react";

/* SwachhAI field-dossier component kit: hard borders, offset shadows,
   mono labels, serif numerals. No gradients, no glass. */

export function Button({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-700 disabled:cursor-not-allowed disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-leaf-950 text-paper shadow-[3px_3px_0_0_var(--color-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
      : variant === "secondary"
        ? "border-2 border-ink bg-paper text-ink shadow-[3px_3px_0_0_var(--color-ink)] hover:bg-parchment active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        : "text-leaf-900 underline-offset-4 hover:bg-leaf-100 hover:underline";
  return (
    <button className={`${base} ${styles}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_0_var(--color-line)] ${className}`}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-semibold tracking-[0.22em] text-clay-700 uppercase">
      {children}
    </p>
  );
}

const BADGE_STYLES: Record<string, string> = {
  LOW: "bg-leaf-100 text-leaf-950 border-leaf-900",
  MODERATE: "bg-[#fdf0d5] text-[#7c4a03] border-[#7c4a03]",
  HIGH: "bg-clay-100 text-clay-700 border-clay-700",
  CRITICAL: "bg-clay-700 text-paper border-ink",
  NEW: "bg-[#e3ecf7] text-[#1d3f6e] border-[#1d3f6e]",
  ASSESSED: "bg-[#e9e4f5] text-[#45297c] border-[#45297c]",
  ACTION_REQUIRED: "bg-clay-100 text-clay-700 border-clay-700",
  IN_PROGRESS: "bg-[#e3ecf7] text-[#1d3f6e] border-[#1d3f6e]",
  RESOLVED: "bg-leaf-100 text-leaf-950 border-leaf-900",
};

export function Badge({ value }: { value: string }) {
  const style = BADGE_STYLES[value] ?? "bg-parchment text-ink border-ink";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider uppercase ${style}`}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border-2 p-4 ${
        accent
          ? "border-ink bg-leaf-950 text-paper shadow-[4px_4px_0_0_var(--color-ink)]"
          : "border-ink bg-white shadow-[4px_4px_0_0_var(--color-line)]"
      }`}
    >
      <p className={`font-mono text-[11px] tracking-[0.18em] uppercase ${accent ? "text-paper/65" : "text-ink-faint"}`}>
        {label}
      </p>
      <p className="font-display mt-1 text-4xl font-black">{value}</p>
      {sub ? <p className={`mt-1 text-xs ${accent ? "text-paper/65" : "text-ink-faint"}`}>{sub}</p> : null}
    </div>
  );
}

export function LoadingState({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border-2 border-ink bg-white p-4"
    >
      <span
        className="h-4 w-4 animate-spin rounded-full border-[3px] border-line border-t-leaf-700"
        aria-hidden
      />
      <p className="text-sm font-medium text-ink">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border-2 border-clay-700 bg-clay-100 p-4">
      <p className="text-sm font-bold text-clay-700">{message}</p>
      {onRetry ? (
        <button onClick={onRetry} className="mt-2 text-sm font-bold text-clay-700 underline underline-offset-4">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="texture-dots rounded-xl border-2 border-dashed border-ink-faint bg-white p-10 text-center">
      <p className="font-display text-xl font-bold text-ink">{title}</p>
      {hint ? <p className="mt-1 text-sm text-ink-soft">{hint}</p> : null}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] font-bold tracking-[0.14em] text-ink-soft uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>;
}
