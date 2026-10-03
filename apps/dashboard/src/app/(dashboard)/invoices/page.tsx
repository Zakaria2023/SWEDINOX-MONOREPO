import { getInvoices } from "@/app/(dashboard)/invoices/actions";
import { invoiceFilters } from "@/app/(dashboard)/invoices/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { InvoicesTable } from "@/components/invoices/invoices-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const InvoicesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const invoices = await getInvoices(query);
  const companies = await getCompaniesForSelect();

  return <InvoicesTable page={invoices} filters={invoiceFilters(companies)} />;
};

export default InvoicesPage;
