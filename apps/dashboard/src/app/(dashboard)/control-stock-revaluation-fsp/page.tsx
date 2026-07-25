import { getStockRevaluationFsp } from "@/app/(dashboard)/control-stock-revaluation-fsp/actions";
import { StockRevaluationFspTable } from "@/components/control-stock-revaluation-fsp/control-stock-revaluation-fsp-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ControlStockRevaluationFspPage = async () => {
  const rows = await getStockRevaluationFsp();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Control: Revaluation of Stock due to FSP-changes"
        description="Products carrying a fixed sales price (FSP), with their on-hand technical stock valued at that FSP"
      />
      <StockRevaluationFspTable rows={rows} />
    </div>
  );
};

export default ControlStockRevaluationFspPage;
