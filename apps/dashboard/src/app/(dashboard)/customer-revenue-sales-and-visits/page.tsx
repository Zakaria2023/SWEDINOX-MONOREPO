import { getCustomerRevenueSalesVisits } from "@/app/(dashboard)/customer-revenue-sales-and-visits/actions";
import { CustomerRevenueSalesVisitsTable } from "@/components/customer-revenue-sales-and-visits/customer-revenue-sales-and-visits-table-content";

const CustomerRevenueSalesVisitsPage = async () => {
  const rows = await getCustomerRevenueSalesVisits();

  return (
    <div className="space-y-4">
      <CustomerRevenueSalesVisitsTable rows={rows} />
    </div>
  );
};

export default CustomerRevenueSalesVisitsPage;
