import { getStock } from "@/app/(dashboard)/stock/actions";
import { stockFilters } from "@/app/(dashboard)/stock/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getLocationsForSelect } from "@/app/(dashboard)/locations/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { StockTable } from "@/components/stock/stock-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const StockPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const stock = await getStock(query);
  const products = await getProductsForSelect();
  const locations = await getLocationsForSelect();
  const suppliers = await getCompaniesForSelect();

  return (
    <div className="space-y-4">
      <StockTable
        page={stock}
        filters={stockFilters(products, locations, suppliers)}
      />
    </div>
  );
};

export default StockPage;
