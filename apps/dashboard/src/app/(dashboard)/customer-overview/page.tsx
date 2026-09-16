import { getCustomerOverview } from "@/app/(dashboard)/customer-overview/actions";
import { CustomerOverviewTable } from "@/components/customer-overview/customer-overview-table-content";

const CustomerOverviewPage = async () => {
  const customers = await getCustomerOverview();

  return (
    <div className="space-y-4">
      <CustomerOverviewTable customers={customers} />
    </div>
  );
};

export default CustomerOverviewPage;
