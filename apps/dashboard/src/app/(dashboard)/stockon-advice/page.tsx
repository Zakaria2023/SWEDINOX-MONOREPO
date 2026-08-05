import { getStockOnAdvice } from "@/app/(dashboard)/stockon-advice/actions";
import { StockOnAdviceTable } from "@/components/stockon-advice/stockon-advice-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const StockOnAdvicePage = async () => {
  const rows = await getStockOnAdvice();

  return (
    <div className="space-y-4">
      <PageHeading title="StockOn advice" />
      <StockOnAdviceTable rows={rows} />
    </div>
  );
};

export default StockOnAdvicePage;
