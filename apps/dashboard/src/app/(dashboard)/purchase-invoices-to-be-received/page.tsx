import { getSuppliersForSelect } from "@/app/(dashboard)/companies/actions";
import { getPurchaseInvoicesToBeReceived } from "@/app/(dashboard)/purchase-invoices-to-be-received/actions";
import { purchaseInvoiceToReceiveFilters } from "@/app/(dashboard)/purchase-invoices-to-be-received/filters";
import { PurchaseInvoicesToBeReceivedTable } from "@/components/purchase-invoices-to-be-received/purchase-invoices-to-be-received-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const PurchaseInvoicesToBeReceivedPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const page = await getPurchaseInvoicesToBeReceived(query);
  const suppliers = await getSuppliersForSelect();

  return (
    <div className="space-y-4">
      <PurchaseInvoicesToBeReceivedTable
        page={page}
        filters={purchaseInvoiceToReceiveFilters(suppliers)}
      />
    </div>
  );
};

export default PurchaseInvoicesToBeReceivedPage;
