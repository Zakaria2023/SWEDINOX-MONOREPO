import { Suspense } from "react";
import Link from "next/link";
import { OrdersTable } from "@/components/orders/orders-table";
import { PageHeading } from "@/components/layout/page-heading";
import { DataTableFallback } from "@/components/ui/data-table-fallback";

const OrdersPage = () => {
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
      <Suspense fallback={<DataTableFallback columnCount={6} />}>
        <OrdersTable />
      </Suspense>
    </div>
  );
};

export default OrdersPage;
