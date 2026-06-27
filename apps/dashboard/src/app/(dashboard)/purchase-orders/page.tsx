import { Suspense } from "react";
import Link from "next/link";
import { PurchaseOrdersTable } from "@/components/purchase-orders/purchase-orders-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const PurchaseOrdersPage = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading
          title="Purchase Orders"
          description="Manage supplier purchase orders"
        />
        <Link
          href="/purchase-orders/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Purchase Order
        </Link>
      </div>
      <Suspense fallback={<DataTableFallback columnCount={5} />}>
        <PurchaseOrdersTable />
      </Suspense>
    </div>
  );
};

export default PurchaseOrdersPage;
