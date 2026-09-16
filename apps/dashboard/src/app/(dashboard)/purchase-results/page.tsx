import { getPurchaseResults } from "@/app/(dashboard)/purchase-results/actions";
import { PURCHASE_RESULT_FILTERS } from "@/app/(dashboard)/purchase-results/filters";
import { PurchaseResultsTable } from "@/components/purchase-results/purchase-results-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const PurchaseResultsPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const page = await getPurchaseResults(query);

  return (
    <div className="space-y-4">
      <PurchaseResultsTable page={page} filters={PURCHASE_RESULT_FILTERS} />
    </div>
  );
};

export default PurchaseResultsPage;
