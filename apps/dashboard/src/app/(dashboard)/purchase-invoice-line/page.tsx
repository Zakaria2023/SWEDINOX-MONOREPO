import { getPurchaseInvoiceLines } from "@/app/(dashboard)/purchase-invoice-line/actions";
import { PurchaseInvoiceLineTable } from "@/components/purchase-invoice-line/purchase-invoice-line-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const PurchaseInvoiceLinePage = async () => {
  const rows = await getPurchaseInvoiceLines();

  return (
    <div className="space-y-4">
      <PageHeading title="Purchase invoice line" />
      <PurchaseInvoiceLineTable rows={rows} />
    </div>
  );
};

export default PurchaseInvoiceLinePage;
