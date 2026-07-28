import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getReturnOrderDetail } from "@/app/(dashboard)/return-orders/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { ReturnOrderDetailView } from "@/components/return-orders/return-order-detail";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ReturnOrderDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const returnOrder = await getReturnOrderDetail(uuid);

  if (!returnOrder) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/return-orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Return orders
        </Link>
      </div>
      <PageHeading
        title={`Return order #${returnOrder.id}`}
        description={returnOrder.companyName ?? undefined}
      />
      <ReturnOrderDetailView returnOrder={returnOrder} />
    </div>
  );
};

export default ReturnOrderDetailPage;
