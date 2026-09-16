import { getStockIncreaseExternalProcessing } from "@/app/(dashboard)/control-stock-increase-external-processing/actions";
import { StockIncreaseExternalProcessingTable } from "@/components/control-stock-increase-external-processing/control-stock-increase-external-processing-table-content";

const ControlStockIncreaseExternalProcessingPage = async () => {
  const rows = await getStockIncreaseExternalProcessing();

  return (
    <div className="space-y-4">
      <StockIncreaseExternalProcessingTable rows={rows} />
    </div>
  );
};

export default ControlStockIncreaseExternalProcessingPage;
