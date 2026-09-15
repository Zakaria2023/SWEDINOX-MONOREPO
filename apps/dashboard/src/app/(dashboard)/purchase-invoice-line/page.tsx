import { getPurchaseInvoiceLines } from "@/app/(dashboard)/purchase-invoice-line/actions";
import { PURCHASE_INVOICE_LINE_FILTERS } from "@/app/(dashboard)/purchase-invoice-line/filters";
import { PurchaseInvoiceLineTable } from "@/components/purchase-invoice-line/purchase-invoice-line-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const PurchaseInvoiceLinePage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const page = await getPurchaseInvoiceLines(query);

  return (
    <div className="space-y-4">
      <PageHeading title="Purchase invoice line" />
      <PurchaseInvoiceLineTable
        page={page}
        filters={PURCHASE_INVOICE_LINE_FILTERS}
      />
    </div>
  );
};

export default PurchaseInvoiceLinePage;
