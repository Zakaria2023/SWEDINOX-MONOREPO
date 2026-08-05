import Link from "next/link";
import { Plus } from "lucide-react";
import { getCounterOrders } from "@/app/(dashboard)/counter-orders/actions";
import { CounterOrdersTable } from "@/components/counter-orders/counter-orders-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CounterOrdersPage = async () => {
  const counterOrders = await getCounterOrders();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <PageHeading title="Counter Orders" />
        <Link
          href="/counter-orders/add"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New Counter Order
        </Link>
      </div>
      <CounterOrdersTable counterOrders={counterOrders} />
    </div>
  );
};

export default CounterOrdersPage;
