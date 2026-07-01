import { Suspense } from "react";
import Link from "next/link";
import { PurchaseRequestsTable } from "@/components/purchase-requests/purchase-requests-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const PurchaseRequestsPage = () => (
  <div className="space-y-6 p-6">
    <div className="flex items-start justify-between">
      <PageHeading
        title="Purchase Requests"
        description="Manage supplier purchase requests"
      />
      <Link
        href="/purchase-requests/new"
        className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        New Purchase Request
      </Link>
    </div>
    <Suspense fallback={<DataTableFallback columnCount={7} />}>
      <PurchaseRequestsTable />
    </Suspense>
  </div>
);

export default PurchaseRequestsPage;
