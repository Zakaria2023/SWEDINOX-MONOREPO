import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getPurchaseQuoteLines } from "@/app/(dashboard)/purchase-quotes/actions";
import { purchaseQuoteFilters } from "@/app/(dashboard)/purchase-quotes/filters";
import { PurchaseQuotesTable } from "@/components/purchase-quotes/purchase-quotes-table-content";
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
    <PurchaseQuotesTable
      page={lines}
      filters={purchaseQuoteFilters(companies)}
    />
  );
};

export default PurchaseQuotesPage;
