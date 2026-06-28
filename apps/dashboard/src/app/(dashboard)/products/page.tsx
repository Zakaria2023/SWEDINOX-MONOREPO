import { Suspense } from "react";
import Link from "next/link";
import { ProductsTable } from "@/components/products/products-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const ProductsPage = () => (
  <div className="space-y-6 p-6">
    <div className="flex items-start justify-between">
      <PageHeading
        title="Products"
        description="Manage products and their properties"
      />
      <Link
        href="/products/new"
        className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        New Product
      </Link>
    </div>
    <Suspense fallback={<DataTableFallback columnCount={7} />}>
      <ProductsTable />
    </Suspense>
  </div>
);

export default ProductsPage;
