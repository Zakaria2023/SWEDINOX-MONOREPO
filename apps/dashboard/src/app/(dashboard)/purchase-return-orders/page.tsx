import Link from "next/link";
import { getPurchaseReturnOrders } from "@/app/(dashboard)/purchase-return-orders/actions";
import { PurchaseReturnOrdersTable } from "@/components/purchase-return-orders/purchase-return-orders-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const PurchaseReturnOrdersPage = async () => {
  const purchaseReturnOrders = await getPurchaseReturnOrders();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading
          title="Purchase Return Orders"
          description="Manage supplier purchase return orders"
        />
        <Link
          href="/purchase-return-orders/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Purchase Return Order
        </Link>
      </div>
      <PurchaseReturnOrdersTable purchaseReturnOrders={purchaseReturnOrders} />
    </div>
  );
};

export default PurchaseReturnOrdersPage;
