import { notFound } from "next/navigation";
import ReportDetailClient from "@/components/report-detail";
import { getReport } from "@/lib/reports-store";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(decodeURIComponent(id)).catch(() => null);
  if (!report) notFound();
  return <ReportDetailClient report={report} />;
}
