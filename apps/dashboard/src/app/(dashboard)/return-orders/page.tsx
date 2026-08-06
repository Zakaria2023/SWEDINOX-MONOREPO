import Link from "next/link";
import { getReturnOrders } from "@/app/(dashboard)/return-orders/actions";
import { ReturnOrdersTable } from "@/components/return-orders/return-orders-table-content";
import { returnOrderFilters } from "@/app/(dashboard)/return-orders/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ReturnOrdersPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const returnOrders = await getReturnOrders(query);
  const companies = await getCompaniesForSelect();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <PageHeading title="Return Orders" />
        <Link
          href="/return-orders/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Return Order
        </Link>
      </div>
      <ReturnOrdersTable
        page={returnOrders}
        filters={returnOrderFilters(companies)}
      />
    </div>
  );
};

export default ReturnOrdersPage;
