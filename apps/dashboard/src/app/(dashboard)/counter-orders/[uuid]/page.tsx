import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCounterOrderDetail } from "@/app/(dashboard)/counter-orders/actions";
import { CounterOrderDetailView } from "@/components/counter-orders/counter-order-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CounterOrderDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const order = await getCounterOrderDetail(uuid);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/counter-orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Counter Orders
        </Link>
      </div>
      <PageHeading
        title={`Counter order #${order.id}`}
        description={order.companyName ?? undefined}
      />
      <CounterOrderDetailView order={order} />
    </div>
  );
};

export default CounterOrderDetailPage;
