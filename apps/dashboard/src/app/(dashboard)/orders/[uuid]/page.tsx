import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  getOrderInvoiceLines,
  getOrderLinePanels,
  getOrderWorkOrders,
} from "@/app/(dashboard)/orders/[uuid]/actions";
import { getOrderDetail } from "@/app/(dashboard)/orders/actions";
import { OrderDetailView } from "@/components/orders/order-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ line?: string }>;
};

const OrderDetailPage = async ({ params, searchParams }: Props) => {
  const { uuid } = await params;
  const { line } = await searchParams;

  const order = await getOrderDetail(uuid);

  if (!order) {
    notFound();
  }

  // Which line the panels below follow. The reference always has one
  // highlighted, so the first line stands in until the reader picks another —
  // and an unknown or stale `?line=` falls back to it rather than 404ing.
  const selectedUuid =
    order.items.find((item) => item.uuid === line)?.uuid ??
    order.items[0]?.uuid;

  // Sequential rather than parallel: the shared MySQL instance caps
  // connections, and three panels on one screen do not justify three at once.
  const workOrders = await getOrderWorkOrders(uuid);
  const invoiceLines = await getOrderInvoiceLines(uuid);
  const linePanels = selectedUuid
    ? await getOrderLinePanels(selectedUuid)
    : null;

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
      <OrderDetailView
        order={order}
        workOrders={workOrders}
        invoiceLines={invoiceLines}
        linePanels={linePanels}
      />
    </div>
  );
};

export default OrderDetailPage;
