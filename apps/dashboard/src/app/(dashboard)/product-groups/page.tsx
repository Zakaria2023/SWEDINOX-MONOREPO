import { Suspense } from "react";
import Link from "next/link";
import { ProductGroupsTable } from "@/components/product-groups/product-groups-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const ProductGroupsPage = () => (
  <div className="space-y-6 p-6">
    <div className="flex items-start justify-between">
      <PageHeading
        title="Product Groups"
        description="Manage product groups and their properties"
      />
      <Link
        href="/product-groups/add"
        className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        New Product Group
      </Link>
    </div>
    <Suspense fallback={<DataTableFallback columnCount={6} />}>
      <ProductGroupsTable />
    </Suspense>
  </div>
);

export default ProductGroupsPage;
