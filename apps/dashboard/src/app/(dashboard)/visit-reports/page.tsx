import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { VisitReportsTable } from "@/components/visit-reports/visit-reports-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const VisitReportsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading
          title="Visit Reports"
          description="Track visit and telephone contact reports."
        />
        <Link
          href="/visit-reports/add"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New Visit Report
        </Link>
      </div>
      <Suspense fallback={<DataTableFallback columnCount={7} />}>
        <VisitReportsTable />
      </Suspense>
    </div>
  );
};

export default VisitReportsPage;
