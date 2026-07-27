import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPurchaseOrderDetail } from "@/app/(dashboard)/purchase-orders/actions";
import { PurchaseOrderEditForm } from "@/components/purchase-orders/purchase-order-edit-form";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditPurchaseOrderPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const purchaseOrder = await getPurchaseOrderDetail(uuid);

  if (!purchaseOrder) {
    notFound();
  }

  if (purchaseOrder.status === "cancelled") {
    redirect(`/purchase-orders/${uuid}`);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href={`/purchase-orders/${uuid}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Purchase Order #{purchaseOrder.id}
        </Link>
      </div>
      <PageHeading
        title={`Edit Purchase Order #${purchaseOrder.id}`}
        description="Header details only — supplier, agent and products can't be changed after creation."
      />
      <PurchaseOrderEditForm purchaseOrder={purchaseOrder} />
    </div>
  );
};

export default EditPurchaseOrderPage;
