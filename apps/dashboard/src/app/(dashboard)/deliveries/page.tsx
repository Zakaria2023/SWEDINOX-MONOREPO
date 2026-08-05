import { getDeliveries } from "@/app/(dashboard)/deliveries/actions";
import { DeliveriesTable } from "@/components/deliveries/deliveries-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const DeliveriesPage = async () => {
  const lines = await getDeliveries();

  return (
    <div className="space-y-4">
      <PageHeading title="Deliveries" />
      <DeliveriesTable lines={lines} />
    </div>
  );
};

export default DeliveriesPage;
