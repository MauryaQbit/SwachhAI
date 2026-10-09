"use client";

import nextDynamic from "next/dynamic";
import type { WasteReport } from "@/lib/waste";
import type { Facility } from "@/lib/infrastructure";

const WasteMap = nextDynamic(() => import("@/components/waste-map"), {
  ssr: false,
  loading: () => <p className="rounded-xl border-2 border-ink bg-white p-6 text-sm text-ink-soft">Unfolding the survey map…</p>,
});

export default function MapClient({ reports, facilities }: { reports: WasteReport[]; facilities: Facility[] }) {
  return <WasteMap reports={reports} facilities={facilities} />;
}
