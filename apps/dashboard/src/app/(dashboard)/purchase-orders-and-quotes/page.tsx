import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getPurchaseOrdersAndQuotes } from "@/app/(dashboard)/purchase-orders-and-quotes/actions";
import { purchaseOrderQuoteFilters } from "@/app/(dashboard)/purchase-orders-and-quotes/filters";
import { PurchaseOrdersAndQuotesTable } from "@/components/purchase-orders-and-quotes/purchase-orders-and-quotes-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const PurchaseOrdersAndQuotesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getPurchaseOrdersAndQuotes(query);
  const suppliers = await getCompaniesForSelect();

  return (
    <div className="space-y-4">
      <PurchaseOrdersAndQuotesTable
        page={page}
        filters={purchaseOrderQuoteFilters(suppliers)}
      />
    </div>
  );
};

export default PurchaseOrdersAndQuotesPage;
