import { getStock } from "@/app/(dashboard)/stock/actions";
import { StockTable } from "@/components/stock/stock-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const StockPage = async () => {
  const stock = await getStock();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Stock" />
      <StockTable stock={stock} />
    </div>
  );
};

export default StockPage;
