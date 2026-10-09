"use client";

import { PageShell } from "@/components/layout";
import { Shell, ErrorState } from "@/components/ui";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageShell>
      <Shell>
        <h1 className="font-display text-2xl font-black">Something went wrong</h1>
        <div className="mt-4">
          <ErrorState message="Something went wrong on our side. Please try again." onRetry={reset} />
        </div>
        {/* Deliberately no error details: framework messages can leak paths. */}
      </Shell>
    </PageShell>
  );
}
