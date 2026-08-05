import { getProductPrices } from "@/app/(dashboard)/product-prices/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { ProductPricesTable } from "@/components/product-prices/product-prices-table-content";
import { RecalculatePricesButton } from "@/components/product-prices/recalculate-prices-button";

const ProductPricesPage = async () => {
  const rows = await getProductPrices();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading title="Product prices" />
        <RecalculatePricesButton />
      </div>
      <ProductPricesTable rows={rows} />
    </div>
  );
};

export default ProductPricesPage;
