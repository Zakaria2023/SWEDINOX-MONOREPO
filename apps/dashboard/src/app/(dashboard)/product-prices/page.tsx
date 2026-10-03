import {
  getProductMainGroups,
  getProductPrices,
} from "@/app/(dashboard)/product-prices/actions";
import { productPriceFilters } from "@/app/(dashboard)/product-prices/filters";
import { ProductPricesTable } from "@/components/product-prices/product-prices-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ProductPricesPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const page = await getProductPrices(parseTableQuery(params));
  const mainGroups = await getProductMainGroups();

  return (
    <ProductPricesTable page={page} filters={productPriceFilters(mainGroups)} />
  );
};

export default ProductPricesPage;
