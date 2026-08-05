import { getInvoiceLines } from "@/app/(dashboard)/invoice-lines/actions";
import { InvoiceLinesTable } from "@/components/invoice-lines/invoice-lines-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const InvoiceLinesPage = async () => {
  const lines = await getInvoiceLines();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Invoice lines" />
      <InvoiceLinesTable lines={lines} />
    </div>
  );
};

export default InvoiceLinesPage;
