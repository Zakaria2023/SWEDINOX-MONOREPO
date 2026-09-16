import { getCustomerRevenue } from "@/app/(dashboard)/customer-revenue/actions";
import { CustomerRevenueTable } from "@/components/customer-revenue/customer-revenue-table-content";

const CustomerRevenuePage = async () => {
  const rows = await getCustomerRevenue();

  return (
    <div className="space-y-4">
      <CustomerRevenueTable rows={rows} />
    </div>
  );
};

export default CustomerRevenuePage;
