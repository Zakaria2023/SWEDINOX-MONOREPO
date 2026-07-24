import { getStockOnAdvice } from "@/app/(dashboard)/stockon-advice/actions";
import { StockOnAdviceTable } from "@/components/stockon-advice/stockon-advice-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const StockOnAdvicePage = async () => {
  const rows = await getStockOnAdvice();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="StockOn advice"
        description="Periodic-review reorder for StockOp-enabled products: order-up-to level from lead time and review period, with a daily order decision"
      />
      <StockOnAdviceTable rows={rows} />
    </div>
  );
};

export default StockOnAdvicePage;
