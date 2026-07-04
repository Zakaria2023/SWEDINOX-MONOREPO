import Link from "next/link";
import { getReturnOrders } from "@/app/(dashboard)/return-orders/actions";
import { ReturnOrdersTable } from "@/components/return-orders/return-orders-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ReturnOrdersPage = async () => {
  const returnOrders = await getReturnOrders();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading
          title="Return Orders"
          description="Manage customer return orders"
        />
        <Link
          href="/return-orders/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Return Order
        </Link>
      </div>
      <ReturnOrdersTable returnOrders={returnOrders} />
    </div>
  );
};

export default ReturnOrdersPage;
