import { getCustomerRevenuePerRevenueGroup } from "@/app/(dashboard)/customer-revenue-per-revenue-group/actions";
import { CustomerRevenuePerRevenueGroupTable } from "@/components/customer-revenue-per-revenue-group/customer-revenue-per-revenue-group-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CustomerRevenuePerRevenueGroupPage = async () => {
  const rows = await getCustomerRevenuePerRevenueGroup();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Customer revenue per revenue group" />
      <CustomerRevenuePerRevenueGroupTable rows={rows} />
    </div>
  );
};

export default CustomerRevenuePerRevenueGroupPage;
