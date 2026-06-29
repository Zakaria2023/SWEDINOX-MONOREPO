import Link from "next/link";
import { Plus } from "lucide-react";
import { getInvoices } from "@/app/(dashboard)/invoices/actions";
import { InvoicesTable } from "@/components/invoices/invoices-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const InvoicesPage = async () => {
  const invoices = await getInvoices();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading title="Invoices" />
        <Link
          href="/invoices/add"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New Invoice
        </Link>
      </div>
      <InvoicesTable invoices={invoices} />
    </div>
  );
};

export default InvoicesPage;
