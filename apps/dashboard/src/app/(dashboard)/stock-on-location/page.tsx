import { getStockOnLocation } from "@/app/(dashboard)/stock-on-location/actions";
import { StockOnLocationTable } from "@/components/stock-on-location/stock-on-location-table-content";

const StockOnLocationPage = async () => {
  const stock = await getStockOnLocation();

  return (
    <div className="space-y-4">
      <StockOnLocationTable stock={stock} />
    </div>
  );
};

export default StockOnLocationPage;
