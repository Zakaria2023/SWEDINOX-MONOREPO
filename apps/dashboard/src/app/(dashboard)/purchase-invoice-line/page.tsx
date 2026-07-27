import { getPurchaseInvoiceLines } from "@/app/(dashboard)/purchase-invoice-line/actions";
import { PurchaseInvoiceLineTable } from "@/components/purchase-invoice-line/purchase-invoice-line-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const PurchaseInvoiceLinePage = async () => {
  const rows = await getPurchaseInvoiceLines();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Purchase invoice line"
        description="Purchase invoice lines with supplier country, VAT and purchased value"
      />
      <PurchaseInvoiceLineTable rows={rows} />
    </div>
  );
};

export default PurchaseInvoiceLinePage;
