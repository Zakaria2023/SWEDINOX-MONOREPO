import Link from "next/link";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getPurchaseQuoteLines } from "@/app/(dashboard)/purchase-quotes/actions";
import { purchaseQuoteFilters } from "@/app/(dashboard)/purchase-quotes/filters";
import { PurchaseQuotesTable } from "@/components/purchase-quotes/purchase-quotes-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const PurchaseQuotesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const lines = await getPurchaseQuoteLines(query);
  const companies = await getCompaniesForSelect();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <PageHeading title="Purchase Quotes" />
        <Link
          href="/purchase-quotes/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Purchase Quote
        </Link>
      </div>
      <PurchaseQuotesTable
        page={lines}
        filters={purchaseQuoteFilters(companies)}
      />
    </div>
  );
};

export default PurchaseQuotesPage;
