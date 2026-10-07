import { getLocationsForSelect } from "@/app/(dashboard)/locations/actions";
import { getStockOnLocation } from "@/app/(dashboard)/stock-on-location/actions";
import { stockLotFilters } from "@/app/(dashboard)/stock-on-location/filters";
import { StockOnLocationTable } from "@/components/stock-on-location/stock-on-location-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const StockOnLocationPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getStockOnLocation(query);
  const locations = await getLocationsForSelect();

  return (
    <div className="space-y-4">
      <StockOnLocationTable page={page} filters={stockLotFilters(locations)} />
    </div>
  );
};

export default StockOnLocationPage;
