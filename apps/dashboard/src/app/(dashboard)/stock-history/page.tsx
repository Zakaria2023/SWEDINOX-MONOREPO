import { getStockHistory } from "@/app/(dashboard)/stock-history/actions";
import { StockHistoryTable } from "@/components/stock-history/stock-history-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const StockHistoryPage = async () => {
  const rows = await getStockHistory();

  return (
    <div className="space-y-4">
      <PageHeading title="Stock history" />
      <StockHistoryTable rows={rows} />
    </div>
  );
};

export default StockHistoryPage;
