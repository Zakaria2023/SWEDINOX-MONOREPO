import Link from "next/link";
import { getProducts } from "@/app/(dashboard)/products/actions";
import { productFilters } from "@/app/(dashboard)/products/filters";
import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { ProductsTable } from "@/components/products/products-table-content";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ProductsPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const products = await getProducts(query);
  const productGroups = await getProductGroupsForSelect();
  const companies = await getCompaniesForSelect();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <PageHeading title="Products" />
        <Link
          href="/products/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Product
        </Link>
      </div>
      <ProductsTable
        page={products}
        filters={productFilters(productGroups, companies)}
      />
    </div>
  );
};

export default ProductsPage;
