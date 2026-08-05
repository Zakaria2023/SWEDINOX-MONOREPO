import Link from "next/link";
import { getProducts } from "@/app/(dashboard)/products/actions";
import { ProductsTable } from "@/components/products/products-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ProductsPage = async () => {
  const products = await getProducts();

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
      <ProductsTable products={products} />
    </div>
  );
};

export default ProductsPage;
