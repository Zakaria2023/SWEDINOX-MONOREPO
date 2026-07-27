import { getSupplierRevenuePerRevenueGroup } from "@/app/(dashboard)/supplier-revenue-per-revenue-group/actions";
import { SupplierRevenuePerGroupTable } from "@/components/supplier-revenue-per-revenue-group/supplier-revenue-per-revenue-group-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const SupplierRevenuePerRevenueGroupPage = async () => {
  const rows = await getSupplierRevenuePerRevenueGroup();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Supplier revenue per revenue group"
        description="Purchase turnover, weight and average price per revenue group and invoice period"
      />
      <SupplierRevenuePerGroupTable rows={rows} />
    </div>
  );
};

export default SupplierRevenuePerRevenueGroupPage;
