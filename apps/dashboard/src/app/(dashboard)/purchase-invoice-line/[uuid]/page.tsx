import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPurchaseInvoiceLineDetail } from "@/app/(dashboard)/purchase-invoice-line/actions";
import { PurchaseInvoiceLineDetailView } from "@/components/purchase-invoice-line/purchase-invoice-line-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const PurchaseInvoiceLineDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const line = await getPurchaseInvoiceLineDetail(uuid);

  if (!line) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/purchase-invoice-line"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Purchase Invoice Lines
        </Link>
      </div>
      <PageHeading
        title={
          line.invoiceId === null
            ? `Line #${line.id}`
            : `Purchase invoice #${line.invoiceId}`
        }
      />
      <PurchaseInvoiceLineDetailView line={line} />
    </div>
  );
};

export default PurchaseInvoiceLineDetailPage;
