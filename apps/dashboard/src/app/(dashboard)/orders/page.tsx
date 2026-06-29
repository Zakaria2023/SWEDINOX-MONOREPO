import Link from "next/link";
import { getOrders } from "@/app/(dashboard)/orders/actions";
import { OrdersTable } from "@/components/orders/orders-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const OrdersPage = async () => {
  const orders = await getOrders();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading title="Orders" description="Manage customer orders" />
        <Link
          href="/orders/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Order
        </Link>
      </div>
      <OrdersTable orders={orders} />
    </div>
  );
};

export default OrdersPage;
