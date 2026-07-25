import { getImportPurchaseInvoices } from "@/app/(dashboard)/import-purchase-invoices/actions";
import { ImportPurchaseInvoicesTable } from "@/components/import-purchase-invoices/import-purchase-invoices-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ImportPurchaseInvoicesPage = async () => {
  const rows = await getImportPurchaseInvoices();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Import Purchase Invoices"
        description="Queue of incoming electronic purchase-invoice messages awaiting import"
      />
      <ImportPurchaseInvoicesTable rows={rows} />
    </div>
  );
};

export default ImportPurchaseInvoicesPage;
