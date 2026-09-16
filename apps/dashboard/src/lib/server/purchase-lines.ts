import "server-only";

import { db } from "@/db";
import { PurchaseInvoiceItems } from "@/db/schema/purchase-invoice-items";
import { PurchaseInvoices } from "@/db/schema/purchase-invoices";
import {
  PurchaseLineReceivals,
  SelectPurchaseLineReceivals,
} from "@/db/schema/purchase-line-receivals";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { OrderLineStatus, ReceiptStatus } from "@/lib/enums";
import { generateUuid, receiptStatusAfterUnloading } from "@/lib/helpers";
import { and, asc, eq, inArray, lt, sql } from "drizzle-orm";

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

// A reception still waiting for goods — what an arriving delivery fills first.
const OPEN_RECEIPT_STATUSES: ReceiptStatus[] = [
  "new",
  "released",
  "workorders_created",
  "partially_received",
];

type PurchaseLineWriter = Pick<typeof db, "select" | "update" | "insert">;

type PurchaseLineReceiptInput = {
  purchaseOrderItemUuid: string;
  quantity: number;
  kg: number;
  /** yyyy-MM-dd */
  date: string;
};

type ReceivalAllocation = {
  receival: SelectPurchaseLineReceivals;
  kg: number;
  quantity: number;
};

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

/**
 * Create the receptions an order expects, and keep them in step with it.
 *
 * A reception is not only the record of goods that turned up — it is the
 * expectation of goods that have not. Without this, "Purchase receivals" can
 * only ever show arrivals, and the planned-against-actual comparison the whole
 * screen exists for has nothing planned in it.
 *
 * One reception per line, carrying the line's whole weight and the order's
 * delivery date. A line delivered in instalments splits that reception later,
 * which is why a line that already has more than one is left alone here: the
 * split is somebody's deliberate act and must not be flattened by an edit to
 * the order.
 */
export const syncPurchaseLineReceipts = async (
  tx: PurchaseLineWriter,
  purchaseOrderUuid: string,
): Promise<void> => {
  const [order] = await tx
    .select({
      id: PurchaseOrders.id,
      status: PurchaseOrders.status,
      supplierUuid: PurchaseOrders.supplierUuid,
      deliveryDate: PurchaseOrders.deliveryDate,
    })
    .from(PurchaseOrders)
    .where(eq(PurchaseOrders.uuid, purchaseOrderUuid))
    .limit(1);

  if (!order) {
    return;
  }

  // A provisional order is a draft: the goods are not expected of anybody yet.
  // Once it stands, the reception is released and the warehouse can plan for it.
  const receiptStatus: ReceiptStatus =
    order.status === "provisional" ? "new" : "released";
  const deliveryDate = order.deliveryDate
    ? new Date(order.deliveryDate).toISOString().slice(0, 10)
    : null;

  const lines = await tx
    .select({
      uuid: PurchaseOrderItems.uuid,
      productUuid: PurchaseOrderItems.productUuid,
      lineNumber: PurchaseOrderItems.lineNumber,
      unit: PurchaseOrderItems.unit,
      status: PurchaseOrderItems.status,
      quantity: PurchaseOrderItems.quantity,
      kgPurchased: PurchaseOrderItems.kgPurchased,
      lengthMm: PurchaseOrderItems.lengthMm,
      options: PurchaseOrderItems.options,
      purchaser: PurchaseOrderItems.purchaser,
    })
    .from(PurchaseOrderItems)
    .where(eq(PurchaseOrderItems.purchaseOrderUuid, purchaseOrderUuid));

  for (const line of lines) {
    if (line.status === "cancelled") {
      continue;
    }

    const existing = await tx
      .select({
        uuid: PurchaseLineReceivals.uuid,
        kgActual: PurchaseLineReceivals.kgActual,
        receiptStatus: PurchaseLineReceivals.receiptStatus,
      })
      .from(PurchaseLineReceivals)
      .where(eq(PurchaseLineReceivals.purchaseOrderItemUuid, line.uuid))
      .orderBy(asc(PurchaseLineReceivals.id));

    if (existing.length === 0) {
      await tx.insert(PurchaseLineReceivals).values({
        uuid: generateUuid(),
        purchaseOrderUuid,
        purchaseOrderItemUuid: line.uuid,
        productUuid: line.productUuid,
        companyUuid: order.supplierUuid,
        purchaseOrderCode: String(order.id),
        lineNumber: line.lineNumber,
        lineStatus: line.status,
        receiptStatus,
        unit: line.unit,
        qtyPlanned: line.quantity,
        qtyActual: "0.000",
        kgPlanned: line.kgPurchased ?? "0.00",
        kgActual: "0.00",
        lengthMm: line.lengthMm,
        options: line.options,
        purchaser: line.purchaser,
        receiptDate: deliveryDate,
        deliveryDatePlanned: deliveryDate,
      });
      continue;
    }

    // Nothing has arrived yet, so the expectation still follows the order. The
    // weight is only restated where a single reception covers the line; with
    // several, the split decides how the kilos are divided and this must not
    // overrule it.
    const untouched = existing.filter(
      (receival) => Number(receival.kgActual ?? 0) <= 0,
    );
    if (untouched.length === 0) {
      continue;
    }

    await tx
      .update(PurchaseLineReceivals)
      .set({
        deliveryDatePlanned: deliveryDate,
        receiptDate: deliveryDate,
        lineStatus: line.status,
        ...(existing.length === 1
          ? {
              qtyPlanned: line.quantity,
              kgPlanned: line.kgPurchased ?? "0.00",
            }
          : {}),
      })
      .where(
        inArray(
          PurchaseLineReceivals.uuid,
          untouched.map((receival) => receival.uuid),
        ),
      );
  }
};

/**
 * Record goods arriving against a purchase line on its receptions.
 *
 * Every way goods come in — Receive on "Purchase orders to be received", an
 * approved unloading, a purchase invoice that creates the lot — calls this, so
 * the receptions are the one complete record of what arrived, when, and how
 * heavy. Open receptions are filled in order, each up to its planned weight,
 * with anything left over on the last; a line with no open reception gets a
 * new one, already received.
 */
export const recordPurchaseLineReceipt = async (
  tx: PurchaseLineWriter,
  { purchaseOrderItemUuid, quantity, kg, date }: PurchaseLineReceiptInput,
): Promise<void> => {
  if (quantity <= 0 && kg <= 0) {
    return;
  }

  const [line] = await tx
    .select({
      purchaseOrderUuid: PurchaseOrderItems.purchaseOrderUuid,
      productUuid: PurchaseOrderItems.productUuid,
      lineNumber: PurchaseOrderItems.lineNumber,
      unit: PurchaseOrderItems.unit,
      orderId: PurchaseOrders.id,
      supplierUuid: PurchaseOrders.supplierUuid,
    })
    .from(PurchaseOrderItems)
    .innerJoin(
      PurchaseOrders,
      eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .where(eq(PurchaseOrderItems.uuid, purchaseOrderItemUuid))
    .limit(1);

  if (!line) {
    return;
  }

  const open = await tx
    .select()
    .from(PurchaseLineReceivals)
    .where(
      and(
        eq(PurchaseLineReceivals.purchaseOrderItemUuid, purchaseOrderItemUuid),
        inArray(PurchaseLineReceivals.receiptStatus, OPEN_RECEIPT_STATUSES),
      ),
    )
    .orderBy(asc(PurchaseLineReceivals.id));

  if (open.length === 0) {
    await tx.insert(PurchaseLineReceivals).values({
      uuid: generateUuid(),
      purchaseOrderUuid: line.purchaseOrderUuid,
      purchaseOrderItemUuid,
      productUuid: line.productUuid,
      companyUuid: line.supplierUuid,
      purchaseOrderCode: String(line.orderId),
      lineNumber: line.lineNumber,
      receiptStatus: "received",
      unit: line.unit,
      qtyPlanned: quantity.toFixed(3),
      qtyActual: quantity.toFixed(3),
      kgPlanned: kg.toFixed(2),
      kgActual: kg.toFixed(2),
      receiptDate: date,
      deliveryDateActual: date,
    });
    return;
  }

  // Each open reception takes what it still has room for; the last one takes
  // whatever is left, so no kilo that arrived goes unrecorded. The quantity
  // follows the weight's share. A weightless delivery lands on the first.
  const allocations: ReceivalAllocation[] =
    kg <= 0
      ? [{ receival: open[0], kg: 0, quantity }]
      : open
          .reduce<{ remaining: number; rows: ReceivalAllocation[] }>(
            (acc, receival, index) => {
              const room = Math.max(
                0,
                Number(receival.kgPlanned ?? 0) - Number(receival.kgActual ?? 0),
              );
              const share =
                index === open.length - 1
                  ? acc.remaining
                  : Math.min(acc.remaining, room);
              return {
                remaining: acc.remaining - share,
                rows: [
                  ...acc.rows,
                  { receival, kg: share, quantity: quantity * (share / kg) },
                ],
              };
            },
            { remaining: kg, rows: [] },
          )
          .rows.filter((row) => row.kg > 0);

  for (const { receival, kg: addedKg, quantity: addedQty } of allocations) {
    const kgReceived = Number(receival.kgActual ?? 0) + addedKg;
    await tx
      .update(PurchaseLineReceivals)
      .set({
        kgActual: kgReceived.toFixed(2),
        qtyActual: (Number(receival.qtyActual ?? 0) + addedQty).toFixed(3),
        // A weightless article cannot be weighed against its plan, so its
        // arrival completes the reception outright.
        receiptStatus:
          kg <= 0
            ? "received"
            : receiptStatusAfterUnloading({
                status: receival.receiptStatus ?? "new",
                kgExpected: Number(receival.kgPlanned ?? 0),
                kgReceived,
              }),
        receiptDate: date,
        deliveryDateActual: date,
      })
      .where(eq(PurchaseLineReceivals.uuid, receival.uuid));
  }
};
