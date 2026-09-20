import {
  getUnblockedOrderRegions,
  getUnblockedOrders,
  getUnblockingUsers,
} from "@/app/(dashboard)/unblocked-orders/actions";
import { unblockedOrderFilters } from "@/app/(dashboard)/unblocked-orders/filters";
import { UnblockedOrdersTable } from "@/components/unblocked-orders/unblocked-orders-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const UnblockedOrdersPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getUnblockedOrders(query);
  const unblockers = await getUnblockingUsers();
  const regions = await getUnblockedOrderRegions();

  return (
    <div className="space-y-4">
      <UnblockedOrdersTable
        page={page}
        filters={unblockedOrderFilters(unblockers, regions)}
      />
    </div>
  );
};

export default UnblockedOrdersPage;
