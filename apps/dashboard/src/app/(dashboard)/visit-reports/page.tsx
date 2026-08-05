import Link from "next/link";
import { Plus } from "lucide-react";
import { getVisitReports } from "@/app/(dashboard)/visit-reports/actions";
import { VisitReportsTable } from "@/components/visit-reports/visit-reports-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const VisitReportsPage = async () => {
  const visitReports = await getVisitReports();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading title="Visit Reports" />
        <Link
          href="/visit-reports/add"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New Visit Report
        </Link>
      </div>
      <VisitReportsTable visitReports={visitReports} />
    </div>
  );
};

export default VisitReportsPage;
