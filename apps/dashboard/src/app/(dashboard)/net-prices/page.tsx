import Link from "next/link";
import { Plus } from "lucide-react";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getContractsForSelect } from "@/app/(dashboard)/contracts/actions";
import { getNetPrices } from "@/app/(dashboard)/net-prices/actions";
import { netPriceFilters } from "@/app/(dashboard)/net-prices/filters";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { NetPricesTable } from "@/components/net-prices/net-prices-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const NetPricesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getNetPrices(query);
  const contracts = await getContractsForSelect();
  const companies = await getCompaniesForSelect();
  const products = await getProductsForSelect();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading title="Net prices" />
        <Link
          href="/net-prices/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New net price
        </Link>
      </div>
      <NetPricesTable
        page={page}
        filters={netPriceFilters(contracts, companies, products)}
      />
    </div>
  );
};

export default NetPricesPage;
