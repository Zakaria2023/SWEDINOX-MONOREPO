import { getPurchaseQuoteLines } from "@/app/(dashboard)/purchase-quotes-overview/actions";
import { PurchaseQuotesOverviewTable } from "@/components/purchase-quotes-overview/purchase-quotes-overview-table-content";
import { GenerateQuoteLinesButton } from "@/components/purchase-quotes-overview/generate-quote-lines-button";
import { PageHeading } from "@/components/layout/page-heading";

const PurchaseQuotesOverviewPage = async () => {
  const lines = await getPurchaseQuoteLines();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <PageHeading title="Purchase quotes" />
        <GenerateQuoteLinesButton />
      </div>
      <PurchaseQuotesOverviewTable lines={lines} />
    </div>
  );
};

export default PurchaseQuotesOverviewPage;
