import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPurchaseInvoiceDetail } from "@/app/(dashboard)/purchase-invoices/actions";
import { PurchaseInvoiceEditForm } from "@/components/purchase-invoices/purchase-invoice-edit-form";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditPurchaseInvoicePage = async ({ params }: Props) => {
  const { uuid } = await params;

  const purchaseInvoice = await getPurchaseInvoiceDetail(uuid);

  if (!purchaseInvoice) {
    notFound();
  }

  if (purchaseInvoice.cancelled) {
    redirect(`/purchase-invoices/${uuid}`);
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/purchase-invoices/${uuid}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Purchase Invoice #{purchaseInvoice.id}
        </Link>
      </div>
      <PageHeading title={`Edit Purchase Invoice #${purchaseInvoice.id}`} />
      <PurchaseInvoiceEditForm purchaseInvoice={purchaseInvoice} />
    </div>
  );
};

export default EditPurchaseInvoicePage;
