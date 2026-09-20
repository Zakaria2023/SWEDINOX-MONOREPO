import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getInvoiceLines } from "@/app/(dashboard)/invoice-lines/actions";
import { invoiceLineFilters } from "@/app/(dashboard)/invoice-lines/filters";
import { InvoiceLinesTable } from "@/components/invoice-lines/invoice-lines-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const InvoiceLinesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const lines = await getInvoiceLines(query);
  const companies = await getCompaniesForSelect();

  return (
    <div className="space-y-4">
      <InvoiceLinesTable page={lines} filters={invoiceLineFilters(companies)} />
    </div>
  );
};

export default InvoiceLinesPage;
