import { getStockMovements } from "@/app/(dashboard)/stock-movements/actions";
import { StockMovementsTable } from "@/components/stock-movements/stock-movements-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const StockMovementsPage = async () => {
  const stockMovements = await getStockMovements();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Stock Movements"
        description="Every entry into and out of stock, with its source and time"
      />
      <StockMovementsTable stockMovements={stockMovements} />
    </div>
  );
};

export default StockMovementsPage;
