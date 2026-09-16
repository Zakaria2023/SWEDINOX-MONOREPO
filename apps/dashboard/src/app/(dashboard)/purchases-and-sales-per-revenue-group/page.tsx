import { getPurchasesAndSalesPerRevenueGroup } from "@/app/(dashboard)/purchases-and-sales-per-revenue-group/actions";
import { PurchasesAndSalesPerRevenueGroupTable } from "@/components/purchases-and-sales-per-revenue-group/purchases-and-sales-per-revenue-group-table-content";

const PurchasesAndSalesPerRevenueGroupPage = async () => {
  const rows = await getPurchasesAndSalesPerRevenueGroup();

  return (
    <div className="space-y-4">
      <PurchasesAndSalesPerRevenueGroupTable rows={rows} />
    </div>
  );
};

export default PurchasesAndSalesPerRevenueGroupPage;
