import Link from "next/link";
import { getPurchaseOrders } from "@/app/(dashboard)/purchase-orders/actions";
import { purchaseOrderFilters } from "@/app/(dashboard)/purchase-orders/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { PurchaseOrdersTable } from "@/components/purchase-orders/purchase-orders-table-content";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  searchParams: Promise<SearchParams>;
};

const PurchaseOrdersPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const purchaseOrders = await getPurchaseOrders(query);
  const suppliers = await getCompaniesForSelect();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <PageHeading title="Purchase Orders" />
        <Link
          href="/purchase-orders/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Purchase Order
        </Link>
      </div>
      <PurchaseOrdersTable
        page={purchaseOrders}
        filters={purchaseOrderFilters(suppliers)}
      />
    </div>
  );
};

export default PurchaseOrdersPage;
