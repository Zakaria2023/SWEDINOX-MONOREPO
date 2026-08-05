import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPurchaseInvoiceDetail } from "@/app/(dashboard)/purchase-invoices/actions";
import { PurchaseInvoiceDetailView } from "@/components/purchase-invoices/purchase-invoice-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const PurchaseInvoiceDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const purchaseInvoice = await getPurchaseInvoiceDetail(uuid);

  if (!purchaseInvoice) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/purchase-invoices"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Purchase Invoices
        </Link>
      </div>
      <PageHeading title={`Purchase Invoice #${purchaseInvoice.id}`} />
      <PurchaseInvoiceDetailView purchaseInvoice={purchaseInvoice} />
    </div>
  );
};

export default PurchaseInvoiceDetailPage;
