import { getDeliveries } from "@/app/(dashboard)/deliveries/actions";
import { DeliveriesTable } from "@/components/deliveries/deliveries-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const DeliveriesPage = async () => {
  const lines = await getDeliveries();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Deliveries"
        description="Order lines to deliver, with their delivery and line status"
      />
      <DeliveriesTable lines={lines} />
    </div>
  );
};

export default DeliveriesPage;
