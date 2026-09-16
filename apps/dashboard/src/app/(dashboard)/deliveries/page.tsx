import { getDeliveries } from "@/app/(dashboard)/deliveries/actions";
import { DeliveriesTable } from "@/components/deliveries/deliveries-table-content";
import { getClerkUserNames } from "@/lib/server/clerk";

const DeliveriesPage = async () => {
  const lines = await getDeliveries();
  // The seller column stores a Clerk id; Clerk owns the names.
  const userNames = await getClerkUserNames();

  return (
    <div className="space-y-4">
      <DeliveriesTable lines={lines} userNames={userNames} />
    </div>
  );
};

export default DeliveriesPage;
