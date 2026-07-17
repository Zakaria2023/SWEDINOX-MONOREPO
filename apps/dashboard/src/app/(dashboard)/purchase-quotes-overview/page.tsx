import { getPurchaseQuoteLines } from "@/app/(dashboard)/purchase-quotes-overview/actions";
import { PurchaseQuotesOverviewTable } from "@/components/purchase-quotes-overview/purchase-quotes-overview-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const PurchaseQuotesOverviewPage = async () => {
  const lines = await getPurchaseQuoteLines();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Purchase quotes"
        description="Quote lines per supplier, with pricing and validity"
      />
      <PurchaseQuotesOverviewTable lines={lines} />
    </div>
  );
};

export default PurchaseQuotesOverviewPage;
