import { getSupplierRevenuePerRevenueGroup } from "@/app/(dashboard)/supplier-revenue-per-revenue-group/actions";
import { SupplierRevenuePerGroupTable } from "@/components/supplier-revenue-per-revenue-group/supplier-revenue-per-revenue-group-table-content";

const SupplierRevenuePerRevenueGroupPage = async () => {
  const rows = await getSupplierRevenuePerRevenueGroup();

  return (
    <div className="space-y-4">
      <SupplierRevenuePerGroupTable rows={rows} />
    </div>
  );
};

export default SupplierRevenuePerRevenueGroupPage;
