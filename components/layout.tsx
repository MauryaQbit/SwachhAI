import Link from "next/link";
import type { ReactNode } from "react";

const LINKS = [
  { href: "/analyze", label: "Analyze" },
  { href: "/reports", label: "Reports" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/map", label: "Map" },
  { href: "/assistant", label: "Assistant" },
  { href: "/about", label: "About" },
];

function Wordmark() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="SwachhAI home">
      <span className="flex flex-col items-stretch">
        <span
          aria-hidden
          className="font-display flex h-9 w-9 items-center justify-center rounded-lg bg-leaf-950 text-lg font-black text-paper"
        >
          S
        </span>
        <span aria-hidden className="tricolor-rule mt-1 h-[3px] w-9 rounded-full" />
      </span>
      <span className="leading-none">
        <span className="font-display block text-[19px] font-bold text-ink">
          SwachhAI
        </span>
        <span className="mt-0.5 block font-mono text-[10px] tracking-[0.18em] text-ink-faint uppercase">
          Waste Intelligence
        </span>
      </span>
    </Link>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-6"
      >
        <Wordmark />
        <div className="flex flex-wrap items-center justify-end gap-0.5 sm:gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-2 py-1.5 text-[13px] font-semibold text-ink-soft underline-offset-4 hover:bg-parchment hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-leaf-700 sm:px-2.5 sm:text-sm"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/analyze"
            className="ml-1 hidden rounded-lg bg-leaf-950 px-4 py-2 text-[13px] font-bold text-paper shadow-[2px_2px_0_0_var(--color-ink)] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none sm:inline-block"
          >
            Scan waste
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t-2 border-ink bg-leaf-950 text-paper">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
        <div>
          <p className="font-display text-lg font-bold">SwachhAI</p>
          <p className="mt-1 font-mono text-[11px] tracking-[0.18em] text-paper/60 uppercase">
            स्वच्छ · Observe → Act
          </p>
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-paper/75">
            AI-first waste intelligence prototype. Estimates only — every priority
            needs human verification before action.
          </p>
        </div>
        <nav aria-label="Product">
          <p className="font-mono text-[11px] tracking-[0.18em] text-paper/60 uppercase">Product</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li><Link className="hover:underline" href="/analyze">AI Waste Scanner</Link></li>
            <li><Link className="hover:underline" href="/dashboard">Dashboard</Link></li>
            <li><Link className="hover:underline" href="/map">Hotspot Map</Link></li>
            <li><Link className="hover:underline" href="/assistant">Assistant</Link></li>
          </ul>
        </nav>
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-paper/60 uppercase">Standing</p>
          <ul className="mt-2 space-y-1.5 text-sm text-paper/85">
            <li>Prototype priority model</li>
            <li>Demo data labeled synthetic</li>
            <li>Not a municipal system</li>
          </ul>
        </div>
      </div>
      <div className="tricolor-rule h-1" aria-hidden />
    </footer>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-paper text-ink">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
