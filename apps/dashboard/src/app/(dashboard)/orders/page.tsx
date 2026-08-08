import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getOrders } from "@/app/(dashboard)/orders/actions";
import { orderFilters } from "@/app/(dashboard)/orders/filters";
import { PageHeading } from "@/components/layout/page-heading";
import { OrdersTable } from "@/components/orders/orders-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";
import Link from "next/link";

type Props = {
  searchParams: Promise<SearchParams>;
};

const OrdersPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const orders = await getOrders(query);
  const companies = await getCompaniesForSelect();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <PageHeading title="Orders" />
        <Link
          href="/orders/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Order
        </Link>
      </div>
      <OrdersTable page={orders} filters={orderFilters(companies)} />
    </div>
  );
};

export default OrdersPage;
