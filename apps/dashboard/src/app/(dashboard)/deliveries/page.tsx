import {
  getDeliveries,
  getDeliveryCustomers,
} from "@/app/(dashboard)/deliveries/actions";
import { deliveryFilters } from "@/app/(dashboard)/deliveries/filters";
import { DeliveriesTable } from "@/components/deliveries/deliveries-table-content";
import { getClerkUserNames } from "@/lib/server/clerk";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const DeliveriesPage = async ({ searchParams }: Props) => {
  const page = await getDeliveries(parseTableQuery(await searchParams));
  // The seller column stores a Clerk id; Clerk owns the names.
  const userNames = await getClerkUserNames();
  const customers = await getDeliveryCustomers();

  return (
    <div className="space-y-4">
      <DeliveriesTable
        page={page}
        userNames={userNames}
        filters={deliveryFilters(customers)}
      />
    </div>
  );
};

export default DeliveriesPage;
