import Link from "next/link";
import { getProductGroups } from "@/app/(dashboard)/product-groups/actions";
import { ProductGroupsTable } from "@/components/product-groups/product-groups-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ProductGroupsPage = async () => {
  const productGroups = await getProductGroups();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <PageHeading title="Product Groups" />
        <Link
          href="/product-groups/add"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Product Group
        </Link>
      </div>
      <ProductGroupsTable productGroups={productGroups} />
    </div>
  );
};

export default ProductGroupsPage;
