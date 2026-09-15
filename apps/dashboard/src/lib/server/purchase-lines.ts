import "server-only";

import { db } from "@/db";
import { PurchaseInvoiceItems } from "@/db/schema/purchase-invoice-items";
import { PurchaseInvoices } from "@/db/schema/purchase-invoices";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { OrderLineStatus } from "@/lib/enums";
import { and, eq, lt, sql } from "drizzle-orm";

// A line that was never made final, or was called off, is not moved by what
// arrives or is invoiced against it.
const FROZEN_STATUSES: readonly OrderLineStatus[] = ["provisional", "cancelled"];

// States past receiving. Imported history carries them with no invoice rows
// behind them, so a receipt must never pull a line back out of one — only
// cancelling an invoice may.
const BEYOND_RECEIPT_STATUSES: readonly OrderLineStatus[] = [
  "partially_delivered",
  "completed",
  "partially_invoiced",
  "invoiced",
];

// The states only a receipt or an invoice puts a line in. When those are taken
// back — an invoice cancelled — the line falls back to released.
const RECEIPT_STATUSES: readonly OrderLineStatus[] = [
  "partially_received",
  "received",
  "partially_invoiced",
  "invoiced",
];

type PurchaseLineWriter = Pick<typeof db, "select" | "update">;

type PurchaseLinePosition = {
  quantity: number;
  received: number;
  invoiced: number;
  current: OrderLineStatus | null;
  /** True only when an invoice was cancelled, the one event that moves a line back. */
  allowStepBack: boolean;
};

/**
 * Where a purchase line stands, read off what has arrived and what has been
 * invoiced. The reference walks a line Released → Partially received →
 * Received → Invoiced, and invoicing outranks receiving.
 */
const purchaseLineStatusFor = ({
  quantity,
  received,
  invoiced,
  current,
  allowStepBack,
}: PurchaseLinePosition): OrderLineStatus | null => {
  if (current !== null && FROZEN_STATUSES.includes(current)) {
    return current;
  }
  if (quantity > 0 && invoiced >= quantity) {
    return "invoiced";
  }
  if (invoiced > 0) {
    return "partially_invoiced";
  }
  if (
    !allowStepBack &&
    current !== null &&
    BEYOND_RECEIPT_STATUSES.includes(current)
  ) {
    return current;
  }
  if (quantity > 0 && received >= quantity) {
    return "received";
  }
  if (received > 0) {
    return "partially_received";
  }
  if (current !== null && RECEIPT_STATUSES.includes(current)) {
    return "released";
  }
  return current;
};

/**
 * Re-derive one purchase line's status. Call it inside the transaction that
 * changed the line's received quantity or its invoices, after both are written.
 * Pass `allowStepBack` only from cancelling an invoice.
 */
export const refreshPurchaseLineStatus = async (
  tx: PurchaseLineWriter,
  purchaseOrderItemUuid: string,
  allowStepBack = false,
): Promise<void> => {
  const [line] = await tx
    .select({
      quantity: PurchaseOrderItems.quantity,
      received: PurchaseOrderItems.qtyReceived,
      status: PurchaseOrderItems.status,
    })
    .from(PurchaseOrderItems)
    .where(eq(PurchaseOrderItems.uuid, purchaseOrderItemUuid))
    .limit(1);

  if (!line) {
    return;
  }

  const [invoiced] = await tx
    .select({
      quantity: sql<string>`COALESCE(SUM(${PurchaseInvoiceItems.quantity}), 0)`,
    })
    .from(PurchaseInvoiceItems)
    .innerJoin(
      PurchaseInvoices,
      eq(PurchaseInvoiceItems.purchaseInvoiceUuid, PurchaseInvoices.uuid),
    )
    .where(
      and(
        eq(PurchaseInvoiceItems.purchaseOrderItemUuid, purchaseOrderItemUuid),
        eq(PurchaseInvoices.cancelled, false),
      ),
    );

  const next = purchaseLineStatusFor({
    quantity: Number(line.quantity),
    received: Number(line.received ?? 0),
    invoiced: Number(invoiced?.quantity ?? 0),
    current: line.status,
    allowStepBack,
  });

  if (next === line.status) {
    return;
  }

  await tx
    .update(PurchaseOrderItems)
    .set({ status: next })
    .where(eq(PurchaseOrderItems.uuid, purchaseOrderItemUuid));
};

/**
 * Give every still-outstanding line of an order the order's delivery date as
 * its planned receipt date. A line that has fully arrived keeps the date it had.
 */
export const syncPurchaseLineReceiptDates = async (
  tx: PurchaseLineWriter,
  purchaseOrderUuid: string,
): Promise<void> => {
  await tx
    .update(PurchaseOrderItems)
    .set({
      receiptDate: sql`(SELECT ${PurchaseOrders.deliveryDate} FROM ${PurchaseOrders} WHERE ${PurchaseOrders.uuid} = ${purchaseOrderUuid})`,
    })
    .where(
      and(
        eq(PurchaseOrderItems.purchaseOrderUuid, purchaseOrderUuid),
        lt(PurchaseOrderItems.qtyReceived, PurchaseOrderItems.quantity),
      ),
    );
};
