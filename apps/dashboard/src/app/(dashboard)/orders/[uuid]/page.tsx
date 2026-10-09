import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  getOrderCallOffAddresses,
  getOrderCallOffs,
  getOrderHeader,
  getOrderInvoiceLines,
  getOrderLinePanels,
  getOrderCommunications,
  getOrderCompetitors,
  getOrderTexts,
  getOrderWorkOrders,
} from "@/app/(dashboard)/orders/[uuid]/actions";
import { getOrderDetail } from "@/app/(dashboard)/orders/actions";
import { OrderDetailView } from "@/components/orders/order-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { getClerkUserNames } from "@/lib/server/clerk";
import { ORDER_STATUS_LABELS } from "@/lib/labels";

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
  // connections, and the panels on one screen do not justify one each.
  const header = await getOrderHeader(uuid);
  const workOrders = await getOrderWorkOrders(uuid);
  const invoiceLines = await getOrderInvoiceLines(uuid);
  const linePanels = selectedUuid
    ? await getOrderLinePanels(selectedUuid)
    : null;
  const texts = await getOrderTexts(uuid);
  const communications = await getOrderCommunications(uuid);
  const competitors = await getOrderCompetitors(uuid);
  const userNames = await getClerkUserNames();
  const callOffs =
    order.orderType === "call_off"
      ? {
          rows: await getOrderCallOffs(uuid),
          addresses: await getOrderCallOffAddresses(uuid),
          userNames,
        }
      : null;

  // The reference's banner: `Order 100785, Allva Edelstahl GmbH, Tel: …,
  // Fax: … - Partially invoiced, Printed, Mailed`.
  const title = `Order ${order.id}, ${order.companyName ?? "—"}, Tel: ${
    header?.telephone ?? ""
  }, Fax: ${header?.fax ?? ""} - ${[
    ORDER_STATUS_LABELS[order.status],
    order.isPrinted ? "Printed" : null,
    order.isMailed ? "Mailed" : null,
    order.isFaxed ? "Faxed" : null,
  ]
    .filter(Boolean)
    .join(", ")}`;

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
      <PageHeading title={title} titleClassName="text-xl" />
      <OrderDetailView
        order={order}
        header={header}
        userNames={userNames}
        workOrders={workOrders}
        invoiceLines={invoiceLines}
        texts={texts}
        linePanels={linePanels}
        communications={communications}
        competitors={competitors}
        callOffs={callOffs}
      />
    </div>
  );
};

export default OrderDetailPage;
