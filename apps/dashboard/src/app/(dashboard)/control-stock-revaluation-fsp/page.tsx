import { getStockRevaluationFsp } from "@/app/(dashboard)/control-stock-revaluation-fsp/actions";
import { StockRevaluationFspTable } from "@/components/control-stock-revaluation-fsp/control-stock-revaluation-fsp-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ControlStockRevaluationFspPage = async () => {
  const rows = await getStockRevaluationFsp();

  return (
    <div className="space-y-4">
      <PageHeading title="Control: Revaluation of Stock due to FSP-changes" />
      <StockRevaluationFspTable rows={rows} />
    </div>
  );
};

export default ControlStockRevaluationFspPage;
