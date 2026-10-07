import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const AddInvoicePage = async ({ searchParams }: Props) => {
  // `?company=` is set by an order's `Invoice` button.
  const { company } = await searchParams;
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
      <InvoiceForm
        availableCompanies={availableCompanies}
        defaultCompanyUuid={typeof company === "string" ? company : undefined}
      />
    </div>
  );
};

export default AddInvoicePage;
