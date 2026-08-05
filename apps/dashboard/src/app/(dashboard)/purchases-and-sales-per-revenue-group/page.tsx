import { getPurchasesAndSalesPerRevenueGroup } from "@/app/(dashboard)/purchases-and-sales-per-revenue-group/actions";
import { PurchasesAndSalesPerRevenueGroupTable } from "@/components/purchases-and-sales-per-revenue-group/purchases-and-sales-per-revenue-group-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const PurchasesAndSalesPerRevenueGroupPage = async () => {
  const rows = await getPurchasesAndSalesPerRevenueGroup();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Purchases and sales per revenue group" />
      <PurchasesAndSalesPerRevenueGroupTable rows={rows} />
    </div>
  );
};

export default PurchasesAndSalesPerRevenueGroupPage;
