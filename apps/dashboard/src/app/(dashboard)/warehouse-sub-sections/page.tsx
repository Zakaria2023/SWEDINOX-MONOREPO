import { Suspense } from "react";
import Link from "next/link";
import { WarehouseSubSectionsTable } from "@/components/warehouse-sub-sections/warehouse-sub-sections-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const WarehouseSubSectionsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading
          title="Warehouse Sub Sections"
          description="Manage warehouse sub section locations"
        />
        <Link
          href="/warehouse-sub-sections/add"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Sub Section
        </Link>
      </div>
      <Suspense fallback={<DataTableFallback columnCount={5} />}>
        <WarehouseSubSectionsTable />
      </Suspense>
    </div>
  );
};

export default WarehouseSubSectionsPage;
