import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getInvoiceLineDetail } from "@/app/(dashboard)/invoice-lines/actions";
import { InvoiceLineDetailView } from "@/components/invoice-lines/invoice-line-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { invoiceReference } from "@/lib/helpers";

type Props = {
  params: Promise<{ uuid: string }>;
};

const InvoiceLineDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const line = await getInvoiceLineDetail(uuid);

  if (!line) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/invoice-lines"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Invoice Lines
        </Link>
      </div>
      <PageHeading
        title={`${invoiceReference(
          line.invoiceDocumentType,
          line.invoiceId,
        )} — ${line.productCode ?? `line #${line.id}`}`}
        description={line.customerName ?? undefined}
      />
      <InvoiceLineDetailView line={line} />
    </div>
  );
};

export default InvoiceLineDetailPage;
