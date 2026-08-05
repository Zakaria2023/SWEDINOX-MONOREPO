import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getInvoiceDetail } from "@/app/(dashboard)/invoices/actions";
import { InvoiceDetailView } from "@/components/invoices/invoice-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { invoiceReference } from "@/lib/helpers";
import { INVOICE_DOCUMENT_TYPE_LABELS } from "@/lib/labels";

type Props = {
  params: Promise<{ uuid: string }>;
};

const InvoiceDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const invoice = await getInvoiceDetail(uuid);

  if (!invoice) {
    notFound();
  }

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
      <PageHeading
        title={`${INVOICE_DOCUMENT_TYPE_LABELS[invoice.documentType]} ${invoiceReference(invoice.documentType, invoice.id)}`}
      />
      <InvoiceDetailView invoice={invoice} />
    </div>
  );
};

export default InvoiceDetailPage;
