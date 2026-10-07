import { getCustomerStock } from "@/app/(dashboard)/customer-stock/actions";
import { getLocationsForSelect } from "@/app/(dashboard)/locations/actions";
import { stockLotFilters } from "@/app/(dashboard)/stock-on-location/filters";
import { CustomerStockTable } from "@/components/customer-stock/customer-stock-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const CustomerStockPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getCustomerStock(query);
  const locations = await getLocationsForSelect();

  return (
    <div className="space-y-4">
      <CustomerStockTable page={page} filters={stockLotFilters(locations)} />
    </div>
  );
};

export default CustomerStockPage;
