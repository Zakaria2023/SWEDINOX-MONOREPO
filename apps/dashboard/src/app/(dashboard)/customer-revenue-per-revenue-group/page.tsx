import { getCustomerRevenuePerRevenueGroup } from "@/app/(dashboard)/customer-revenue-per-revenue-group/actions";
import { CustomerRevenuePerRevenueGroupTable } from "@/components/customer-revenue-per-revenue-group/customer-revenue-per-revenue-group-table-content";

const CustomerRevenuePerRevenueGroupPage = async () => {
  const rows = await getCustomerRevenuePerRevenueGroup();

  return (
    <div className="space-y-4">
      <CustomerRevenuePerRevenueGroupTable rows={rows} />
    </div>
  );
};

export default CustomerRevenuePerRevenueGroupPage;
