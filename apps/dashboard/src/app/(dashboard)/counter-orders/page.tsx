import Link from "next/link";
import { Plus } from "lucide-react";
import { getCounterOrders } from "@/app/(dashboard)/counter-orders/actions";
import { CounterOrdersTable } from "@/components/counter-orders/counter-orders-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { counterOrderFilters } from "@/app/(dashboard)/counter-orders/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const CounterOrdersPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const counterOrders = await getCounterOrders(query);
  const companies = await getCompaniesForSelect();

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
      <CounterOrdersTable
        page={counterOrders}
        filters={counterOrderFilters(companies)}
      />
    </div>
  );
};

export default CounterOrdersPage;
