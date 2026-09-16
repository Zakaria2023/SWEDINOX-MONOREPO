import { getBlockedDeliveries } from "@/app/(dashboard)/deliveries/actions";
import { BlockedDeliveriesTable } from "@/components/deliveries/blocked-deliveries-table-content";

const BlockedDeliveriesPage = async () => {
  const lines = await getBlockedDeliveries();

  return (
    <div className="space-y-4">
      <BlockedDeliveriesTable lines={lines} />
    </div>
  );
};

export default BlockedDeliveriesPage;
