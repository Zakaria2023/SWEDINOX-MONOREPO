import { getPurchaseInvoicesToBeReceived } from "@/app/(dashboard)/purchase-invoices-to-be-received/actions";
import { PurchaseInvoicesToBeReceivedTable } from "@/components/purchase-invoices-to-be-received/purchase-invoices-to-be-received-table-content";

const PurchaseInvoicesToBeReceivedPage = async () => {
  const rows = await getPurchaseInvoicesToBeReceived();

  return (
    <div className="space-y-4">
      <PurchaseInvoicesToBeReceivedTable rows={rows} />
    </div>
  );
};

export default PurchaseInvoicesToBeReceivedPage;
