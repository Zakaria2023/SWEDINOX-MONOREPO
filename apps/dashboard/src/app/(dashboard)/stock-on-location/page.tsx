import { getStockOnLocation } from "@/app/(dashboard)/stock-on-location/actions";
import { StockOnLocationTable } from "@/components/stock-on-location/stock-on-location-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const StockOnLocationPage = async () => {
  const stock = await getStockOnLocation();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Stock on location"
        description="Every stock lot with its physical location, attributes and value"
      />
      <StockOnLocationTable stock={stock} />
    </div>
  );
};

export default StockOnLocationPage;
