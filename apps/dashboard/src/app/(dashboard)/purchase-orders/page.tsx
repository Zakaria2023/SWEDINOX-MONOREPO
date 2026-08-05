import Link from "next/link";
import { getPurchaseOrders } from "@/app/(dashboard)/purchase-orders/actions";
import { PurchaseOrdersTable } from "@/components/purchase-orders/purchase-orders-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const PurchaseOrdersPage = async () => {
  const purchaseOrders = await getPurchaseOrders();

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
      <PurchaseOrdersTable purchaseOrders={purchaseOrders} />
    </div>
  );
};

export default PurchaseOrdersPage;
