import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getInvoiceDetail } from "@/app/(dashboard)/invoices/actions";
import { InvoiceDetailView } from "@/components/invoices/invoice-detail";
import { PageHeading } from "@/components/layout/page-heading";

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
    <div className="space-y-6 p-6">
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
        title={`Invoice #${invoice.id}`}
        description={invoice.companyName ?? undefined}
      />
      <InvoiceDetailView invoice={invoice} />
    </div>
  );
};

export default InvoiceDetailPage;
