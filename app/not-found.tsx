import Link from "next/link";
import { PageShell } from "@/components/layout";
import { Shell, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <PageShell>
      <Shell>
        <EmptyState title="Off the survey map" hint="This page doesn't exist in the register." />
        <div className="mt-4 flex gap-3">
          <Link href="/" className="rounded-lg bg-leaf-950 px-5 py-3 text-sm font-bold text-paper shadow-[3px_3px_0_0_var(--color-ink)]">Home</Link>
          <Link href="/analyze" className="rounded-lg border-2 border-ink bg-white px-5 py-3 text-sm font-bold">Analyze waste</Link>
        </div>
      </Shell>
    </PageShell>
  );
}
