import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { InvoiceForm } from "@/components/invoices/invoice-form";

const AddInvoicePage = async () => {
  const availableCompanies = await getCompaniesForSelect();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Invoices
        </Link>
      </div>
      <InvoiceForm availableCompanies={availableCompanies} />
    </div>
  );
};

export default AddInvoicePage;
