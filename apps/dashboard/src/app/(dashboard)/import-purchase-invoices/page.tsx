import { getImportedPurchaseInvoices } from "@/app/(dashboard)/import-purchase-invoices/actions";
import { ImportPurchaseInvoicesTable } from "@/components/import-purchase-invoices/import-purchase-invoices-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ImportPurchaseInvoicesPage = async () => {
  const rows = await getImportedPurchaseInvoices();

  return (
    <div className="space-y-4">
      <PageHeading title="Import purchase invoices" />
      <ImportPurchaseInvoicesTable rows={rows} />
    </div>
  );
};

export default ImportPurchaseInvoicesPage;
