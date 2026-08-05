import Link from "next/link";
import { Plus } from "lucide-react";
import { getPurchaseInvoices } from "@/app/(dashboard)/purchase-invoices/actions";
import { PurchaseInvoicesTable } from "@/components/purchase-invoices/purchase-invoices-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const PurchaseInvoicesPage = async () => {
  const invoices = await getPurchaseInvoices();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <PageHeading title="Purchase Invoices" />
        <Link
          href="/purchase-invoices/add"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New Purchase Invoice
        </Link>
      </div>
      <PurchaseInvoicesTable invoices={invoices} />
    </div>
  );
};

export default PurchaseInvoicesPage;
