import Link from "next/link";
import { Plus } from "lucide-react";
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

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end">
        <Link
          href="/invoices/add"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New Invoice
        </Link>
      </div>
      <InvoicesTable page={invoices} filters={invoiceFilters(companies)} />
    </div>
  );
};

export default InvoicesPage;
