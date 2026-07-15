import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPurchaseOrderDetail } from "@/app/(dashboard)/purchase-orders/actions";
import { PurchaseOrderDetailView } from "@/components/purchase-orders/purchase-order-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const PurchaseOrderDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const purchaseOrder = await getPurchaseOrderDetail(uuid);

  if (!purchaseOrder) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/purchase-orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Purchase Orders
        </Link>
      </div>
      <PageHeading
        title={`Purchase Order #${purchaseOrder.id}`}
        description={purchaseOrder.supplierName ?? undefined}
      />
      <PurchaseOrderDetailView purchaseOrder={purchaseOrder} />
    </div>
  );
};

export default PurchaseOrderDetailPage;
