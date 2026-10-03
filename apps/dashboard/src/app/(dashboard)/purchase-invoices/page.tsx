import { getPurchaseInvoices } from "@/app/(dashboard)/purchase-invoices/actions";
import { purchaseInvoiceFilters } from "@/app/(dashboard)/purchase-invoices/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { PurchaseInvoicesTable } from "@/components/purchase-invoices/purchase-invoices-table-content";

type Props = {
  searchParams: Promise<SearchParams>;
};

const PurchaseInvoicesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const invoices = await getPurchaseInvoices(query);
  const suppliers = await getCompaniesForSelect();

  return (
    <PurchaseInvoicesTable
      page={invoices}
      filters={purchaseInvoiceFilters(suppliers)}
    />
  );
};

export default PurchaseInvoicesPage;
