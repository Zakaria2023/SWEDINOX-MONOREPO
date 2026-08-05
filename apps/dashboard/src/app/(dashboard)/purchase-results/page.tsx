import { getPurchaseResults } from "@/app/(dashboard)/purchase-results/actions";
import { PurchaseResultsTable } from "@/components/purchase-results/purchase-results-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const PurchaseResultsPage = async () => {
  const rows = await getPurchaseResults();

  return (
    <div className="space-y-4">
      <PageHeading title="Purchase results" />
      <PurchaseResultsTable rows={rows} />
    </div>
  );
};

export default PurchaseResultsPage;
