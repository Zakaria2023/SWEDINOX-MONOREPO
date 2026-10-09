import {
  getBlockedDeliveries,
  getBlockedDeliveryCustomers,
} from "@/app/(dashboard)/deliveries/actions";
import { blockedDeliveryFilters } from "@/app/(dashboard)/blocked-deliveries/filters";
import { BlockedDeliveriesTable } from "@/components/deliveries/blocked-deliveries-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const BlockedDeliveriesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getBlockedDeliveries(query);
  const customers = await getBlockedDeliveryCustomers();

  return (
    <div className="space-y-4">
      <BlockedDeliveriesTable
        page={page}
        filters={blockedDeliveryFilters(customers)}
      />
    </div>
  );
};

export default BlockedDeliveriesPage;
