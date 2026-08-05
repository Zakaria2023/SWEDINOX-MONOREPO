import { getSupplierRevenue } from "@/app/(dashboard)/supplier-revenue/actions";
import { SupplierRevenueTable } from "@/components/supplier-revenue/supplier-revenue-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const SupplierRevenuePage = async () => {
  const rows = await getSupplierRevenue();

  return (
    <div className="space-y-4">
      <PageHeading title="Supplier revenue" />
      <SupplierRevenueTable rows={rows} />
    </div>
  );
};

export default SupplierRevenuePage;
