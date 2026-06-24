import { Suspense } from "react";
import Link from "next/link";
import { WarehousesTable } from "@/components/warehouses/warehouses-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const WarehousesPage = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading
          title="Warehouses"
          description="Manage warehouse locations"
        />
        <Link
          href="/warehouses/add"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Warehouse
        </Link>
      </div>
      <Suspense fallback={<DataTableFallback columnCount={4} />}>
        <WarehousesTable />
      </Suspense>
    </div>
  );
};

export default WarehousesPage;
