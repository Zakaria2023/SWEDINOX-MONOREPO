import {
  getProductMainGroups,
  getProductPrices,
} from "@/app/(dashboard)/product-prices/actions";
import { productPriceFilters } from "@/app/(dashboard)/product-prices/filters";
import { ProductPricesTable } from "@/components/product-prices/product-prices-table-content";
import { RecalculatePricesButton } from "@/components/product-prices/recalculate-prices-button";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ProductPricesPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const page = await getProductPrices(parseTableQuery(params));
  const mainGroups = await getProductMainGroups();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-end gap-4">
        <RecalculatePricesButton />
      </div>
      <ProductPricesTable
        page={page}
        filters={productPriceFilters(mainGroups)}
      />
    </div>
  );
};

export default ProductPricesPage;
