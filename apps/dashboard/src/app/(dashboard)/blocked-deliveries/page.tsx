import { getBlockedDeliveries } from "@/app/(dashboard)/deliveries/actions";
import { BlockedDeliveriesTable } from "@/components/deliveries/blocked-deliveries-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const BlockedDeliveriesPage = async () => {
  const lines = await getBlockedDeliveries();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Blocked deliveries" />
      <BlockedDeliveriesTable lines={lines} />
    </div>
  );
};

export default BlockedDeliveriesPage;
