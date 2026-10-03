import { getPurchaseOrders } from "@/app/(dashboard)/purchase-orders/actions";
import { purchaseOrderFilters } from "@/app/(dashboard)/purchase-orders/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { PurchaseOrdersTable } from "@/components/purchase-orders/purchase-orders-table-content";

type Props = {
  searchParams: Promise<SearchParams>;
};

const PurchaseOrdersPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const purchaseOrders = await getPurchaseOrders(query);
  const suppliers = await getCompaniesForSelect();

  return (
    <PurchaseOrdersTable
      page={purchaseOrders}
      filters={purchaseOrderFilters(suppliers)}
    />
  );
};

export default PurchaseOrdersPage;
