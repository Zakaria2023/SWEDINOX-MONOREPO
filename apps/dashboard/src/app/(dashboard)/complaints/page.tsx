import { Suspense } from "react";
import Link from "next/link";
import { ComplaintsTable } from "@/components/complaints/complaints-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const ComplaintsPage = () => (
  <div className="space-y-6 p-6">
    <div className="flex items-start justify-between">
      <PageHeading
        title="Complaints"
        description="Manage customer complaints"
      />
      <Link
        href="/complaints/new"
        className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        New Complaint
      </Link>
    </div>
    <Suspense fallback={<DataTableFallback columnCount={6} />}>
      <ComplaintsTable />
    </Suspense>
  </div>
);

export default ComplaintsPage;
