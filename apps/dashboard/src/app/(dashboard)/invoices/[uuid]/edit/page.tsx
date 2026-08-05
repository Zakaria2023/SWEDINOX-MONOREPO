import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getInvoiceDetail } from "@/app/(dashboard)/invoices/actions";
import { InvoiceEditForm } from "@/components/invoices/invoice-edit-form";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditInvoicePage = async ({ params }: Props) => {
  const { uuid } = await params;

  const invoice = await getInvoiceDetail(uuid);

  if (!invoice) {
    notFound();
  }

  if (invoice.cancelled) {
    redirect(`/invoices/${uuid}`);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href={`/invoices/${uuid}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Invoice #{invoice.id}
        </Link>
      </div>
      <PageHeading title={`Edit Invoice #${invoice.id}`} />
      <InvoiceEditForm invoice={invoice} />
    </div>
  );
};

export default EditInvoicePage;
