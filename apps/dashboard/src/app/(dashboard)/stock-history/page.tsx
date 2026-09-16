import { getStockHistory } from "@/app/(dashboard)/stock-history/actions";
import { StockHistoryTable } from "@/components/stock-history/stock-history-table-content";

const StockHistoryPage = async () => {
  const rows = await getStockHistory();

  return (
    <div className="space-y-4">
      <StockHistoryTable rows={rows} />
    </div>
  );
};

export default StockHistoryPage;
