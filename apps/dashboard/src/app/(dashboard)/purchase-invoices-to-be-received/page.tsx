import { getPurchaseInvoicesToBeReceived } from "@/app/(dashboard)/purchase-invoices-to-be-received/actions";
import { PurchaseInvoicesToBeReceivedTable } from "@/components/purchase-invoices-to-be-received/purchase-invoices-to-be-received-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const PurchaseInvoicesToBeReceivedPage = async () => {
  const rows = await getPurchaseInvoicesToBeReceived();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Purchase invoices to be received" />
      <PurchaseInvoicesToBeReceivedTable rows={rows} />
    </div>
  );
};

export default PurchaseInvoicesToBeReceivedPage;
