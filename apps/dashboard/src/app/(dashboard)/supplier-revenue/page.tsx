import { getSupplierRevenue } from "@/app/(dashboard)/supplier-revenue/actions";
import { SupplierRevenueTable } from "@/components/supplier-revenue/supplier-revenue-table-content";

const SupplierRevenuePage = async () => {
  const rows = await getSupplierRevenue();

  return (
    <div className="space-y-4">
      <SupplierRevenueTable rows={rows} />
    </div>
  );
};

export default SupplierRevenuePage;
