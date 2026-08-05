import { getStockIncreaseExternalProcessing } from "@/app/(dashboard)/control-stock-increase-external-processing/actions";
import { StockIncreaseExternalProcessingTable } from "@/components/control-stock-increase-external-processing/control-stock-increase-external-processing-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ControlStockIncreaseExternalProcessingPage = async () => {
  const rows = await getStockIncreaseExternalProcessing();

  return (
    <div className="space-y-4">
      <PageHeading title="Control: Stock Increase due to External Processing" />
      <StockIncreaseExternalProcessingTable rows={rows} />
    </div>
  );
};

export default ControlStockIncreaseExternalProcessingPage;
