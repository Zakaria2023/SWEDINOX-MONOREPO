import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPurchaseReturnOrderDetail } from "@/app/(dashboard)/purchase-return-orders/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { PurchaseReturnOrderDetailView } from "@/components/purchase-return-orders/purchase-return-order-detail";

type Props = {
  params: Promise<{ uuid: string }>;
};

const PurchaseReturnOrderDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const returnOrder = await getPurchaseReturnOrderDetail(uuid);

  if (!returnOrder) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/purchase-return-orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Purchase return orders
        </Link>
      </div>
      <PageHeading
        title={`Purchase return order #${returnOrder.id}`}
        description={returnOrder.supplierName ?? undefined}
      />
      <PurchaseReturnOrderDetailView returnOrder={returnOrder} />
    </div>
  );
};

export default PurchaseReturnOrderDetailPage;
