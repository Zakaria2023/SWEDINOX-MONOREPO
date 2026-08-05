import { getCustomerRevenueSalesVisits } from "@/app/(dashboard)/customer-revenue-sales-and-visits/actions";
import { CustomerRevenueSalesVisitsTable } from "@/components/customer-revenue-sales-and-visits/customer-revenue-sales-and-visits-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CustomerRevenueSalesVisitsPage = async () => {
  const rows = await getCustomerRevenueSalesVisits();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Customer revenue, sales and visits" />
      <CustomerRevenueSalesVisitsTable rows={rows} />
    </div>
  );
};

export default CustomerRevenueSalesVisitsPage;
