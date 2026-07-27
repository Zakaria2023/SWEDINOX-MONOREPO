import { getCustomerRevenueSplit } from "@/app/(dashboard)/customer-revenue-per-revenue-group-split/actions";
import { CustomerRevenuePerRevenueGroupSplitTable } from "@/components/customer-revenue-per-revenue-group-split/customer-revenue-per-revenue-group-split-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CustomerRevenueSplitPage = async () => {
  const rows = await getCustomerRevenueSplit();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Customer revenue per revenue group with split order types"
        description="Sales turnover per customer and revenue group, split by order type"
      />
      <CustomerRevenuePerRevenueGroupSplitTable rows={rows} />
    </div>
  );
};

export default CustomerRevenueSplitPage;
