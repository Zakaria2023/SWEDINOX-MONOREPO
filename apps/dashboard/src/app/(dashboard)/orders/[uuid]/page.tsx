import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import {
  getOrderCallOffAddresses,
  getOrderCallOffs,
  getOrderCommunications,
  getOrderCompetitors,
  getOrderFormExtras,
  getOrderHeader,
  getOrderInvoiceLines,
  getOrderLinePanels,
  getOrderTexts,
  getOrderWorkOrders,
} from "@/app/(dashboard)/orders/[uuid]/actions";
import { getOrderDetail } from "@/app/(dashboard)/orders/actions";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { OrderForm } from "@/components/orders/order-form";
import { WorkPanelLockNotice } from "@/components/open-work-panels/work-panel-lock-notice";
import { requireAuth } from "@/lib/auth";
import { getClerkUserNames, getClerkUsersForSelect } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ line?: string }>;
};

/**
 * One screen, as the reference has it: a saved order is the form it was
 * typed on — the toolbar, the header, then the lines and every panel.
 */
const OrderDetailPage = async ({ params, searchParams }: Props) => {
  const { uuid } = await params;
  const { line } = await searchParams;
  const currentUserId = await requireAuth();

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
  const extras = await getOrderFormExtras(uuid);
  const workOrders = await getOrderWorkOrders(uuid);
  const invoiceLines = await getOrderInvoiceLines(uuid);
  const linePanels = selectedUuid
    ? await getOrderLinePanels(selectedUuid)
    : null;
  const texts = await getOrderTexts(uuid);
  const communications = await getOrderCommunications(uuid);
  const competitors = await getOrderCompetitors(uuid);
  const companies = await getCompaniesForSelect();
  const clerkUsers = await getClerkUsersForSelect();
  const textCategories = await getTextCategoriesForSelect();
  const callOffs =
    order.orderType === "call_off"
      ? {
          rows: await getOrderCallOffs(uuid),
          addresses: await getOrderCallOffAddresses(uuid),
          userNames: await getClerkUserNames(),
        }
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
      {order.status !== "cancelled" && (
        <WorkPanelLockNotice
          panelType="order"
          recordUuid={uuid}
          description={`Order ${order.id}, ${order.companyName ?? "no customer"}`}
        />
      )}
      <OrderForm
        companies={companies}
        clerkUsers={clerkUsers}
        textCategories={textCategories}
        currentUserId={currentUserId}
        saved={{
          order,
          header,
          extras,
          workOrders,
          invoiceLines,
          linePanels,
          texts,
          communications,
          competitors,
          callOffs,
        }}
      />
    </div>
  );
};

export default OrderDetailPage;
