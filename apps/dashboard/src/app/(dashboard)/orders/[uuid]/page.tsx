import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getOrderDetail } from "@/app/(dashboard)/orders/actions";
import { OrderDetailView } from "@/components/orders/order-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const OrderDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const order = await getOrderDetail(uuid);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Orders
        </Link>
      </div>
      <PageHeading title={`Order #${order.id}`} />
      <OrderDetailView order={order} />
    </div>
  );
};

export default OrderDetailPage;
