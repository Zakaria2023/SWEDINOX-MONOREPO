import { getSuppliersForSelect } from "@/app/(dashboard)/companies/actions";
import { getPurchaseOrdersToBeReceived } from "@/app/(dashboard)/purchase-orders-to-be-received/actions";
import { purchaseOrderToReceiveFilters } from "@/app/(dashboard)/purchase-orders-to-be-received/filters";
import { PurchaseOrdersToBeReceivedTable } from "@/components/purchase-orders-to-be-received/purchase-orders-to-be-received-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const PurchaseOrdersToBeReceivedPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getPurchaseOrdersToBeReceived(query);
  const suppliers = await getSuppliersForSelect();

  return (
    <PurchaseOrdersToBeReceivedTable
      page={page}
      filters={purchaseOrderToReceiveFilters(suppliers)}
    />
  );
};

export default PurchaseOrdersToBeReceivedPage;
