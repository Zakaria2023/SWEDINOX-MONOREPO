import { getProductPrices } from "@/app/(dashboard)/product-prices/actions";
import { ProductPricesTable } from "@/components/product-prices/product-prices-table-content";
import { RecalculatePricesButton } from "@/components/product-prices/recalculate-prices-button";

const ProductPricesPage = async () => {
  const rows = await getProductPrices();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-end gap-4">
        <RecalculatePricesButton />
      </div>
      <ProductPricesTable rows={rows} />
    </div>
  );
};

export default ProductPricesPage;
