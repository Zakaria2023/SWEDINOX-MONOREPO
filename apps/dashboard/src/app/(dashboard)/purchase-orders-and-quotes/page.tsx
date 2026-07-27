import { getPurchaseOrdersAndQuotes } from "@/app/(dashboard)/purchase-orders-and-quotes/actions";
import { PurchaseOrdersAndQuotesTable } from "@/components/purchase-orders-and-quotes/purchase-orders-and-quotes-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const PurchaseOrdersAndQuotesPage = async () => {
  const rows = await getPurchaseOrdersAndQuotes();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Purchase orders and quotes"
        description="Purchase orders and quotes combined, by creation date"
      />
      <PurchaseOrdersAndQuotesTable rows={rows} />
    </div>
  );
};

export default PurchaseOrdersAndQuotesPage;
