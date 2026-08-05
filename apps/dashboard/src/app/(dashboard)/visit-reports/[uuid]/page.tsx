import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getVisitReportDetail } from "@/app/(dashboard)/visit-reports/actions";
import { VisitReportDetailView } from "@/components/visit-reports/visit-report-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const VisitReportDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const report = await getVisitReportDetail(uuid);

  if (!report) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/visit-reports"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Visit Reports
        </Link>
      </div>
      <PageHeading title={report.companyName} />
      <VisitReportDetailView report={report} />
    </div>
  );
};

export default VisitReportDetailPage;
