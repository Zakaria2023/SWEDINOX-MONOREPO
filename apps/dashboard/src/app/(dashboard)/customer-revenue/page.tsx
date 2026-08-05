import { getCustomerRevenue } from "@/app/(dashboard)/customer-revenue/actions";
import { CustomerRevenueTable } from "@/components/customer-revenue/customer-revenue-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CustomerRevenuePage = async () => {
  const rows = await getCustomerRevenue();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Customer revenue" />
      <CustomerRevenueTable rows={rows} />
    </div>
  );
};

export default CustomerRevenuePage;
