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
import { Products } from "@/db/schema/products";
import { OrderLineStatus, ReceiptStatus } from "@/lib/enums";
import {
  amountForWeight,
  billingWeightKg,
  generateUuid,
  isWithinTolerance,
  moneyString,
  receiptStatusAfterUnloading,
  tolerancePercent,
} from "@/lib/helpers";
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
  /**
   * The product's unloading tolerance for this line's unit, in percent, or
   * `null` when the product leaves the cell blank.
   */
  unloadingTolerance: number | null;
  /** Closed by hand at whatever arrived — the remainder is not coming. */
  closed: boolean;
};

type PurchaseLineCompletion = Pick<
  PurchaseLinePosition,
  "quantity" | "received" | "unloadingTolerance" | "closed"
>;

/**
 * Whether everything that is coming has come.
 *
 * 🔴 Not `received >= quantity`. That rule left every short delivery open
 * forever: a line of 81 plates that arrives 80 sat at `Partially received`
 * waiting for one that nobody had ordered again. The reference closes it —
 * 22 of the 23 short lines since 2024 are `Received` or `Invoiced`, sixteen of
 * them inside the product's 5 % unloading tolerance (J4, 7-10-2026).
 *
 * So a line is complete when what arrived is within the unloading tolerance of
 * what was ordered, or when a buyer has closed it. Only a shortfall counts —
 * an over-delivery is complete too. A blank tolerance is no slack at all here:
 * blank means "no rule" for the report, but completing a line is a decision,
 * and without a rule it is the buyer's to make by hand.
 */
const purchaseLineIsComplete = ({
  quantity,
  received,
  unloadingTolerance,
  closed,
}: PurchaseLineCompletion): boolean => {
  if (closed) {
    return true;
  }
  if (quantity <= 0 || received <= 0) {
    return false;
  }
  if (received >= quantity) {
    return true;
  }
  return isWithinTolerance(quantity, received, unloadingTolerance ?? 0);
};

/**
 * Where a purchase line stands, read off what has arrived and what has been
 * invoiced. The reference walks a line Released → Partially received →
 * Received → Invoiced, and invoicing outranks receiving.
 *
 * 🔑 **Invoiced is measured against what arrived, not what was ordered.** A
 * purchase is billed on its weighed goods (`402532`), so a line that arrived
 * short and was billed for all of it is invoiced, full stop. There is no
 * `Partially invoiced` on a purchase line: none of the reference's 16 084
 * lines carries it, and its purchase header ladder has no such rung. A line
 * billed for part of what arrived simply keeps its receipt status.
 */
const purchaseLineStatusFor = ({
  quantity,
  received,
  invoiced,
  current,
  allowStepBack,
  unloadingTolerance,
  closed,
}: PurchaseLinePosition): OrderLineStatus | null => {
  if (current !== null && FROZEN_STATUSES.includes(current)) {
    return current;
  }
  const complete = purchaseLineIsComplete({
    quantity,
    received,
    unloadingTolerance,
    closed,
  });
  if (quantity > 0 && invoiced >= quantity) {
    return "invoiced";
  }
  if (complete && received > 0 && invoiced >= received) {
    return "invoiced";
  }
  if (
    !allowStepBack &&
    current !== null &&
    BEYOND_RECEIPT_STATUSES.includes(current)
  ) {
    return current;
  }
  if (complete) {
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
      unit: PurchaseOrderItems.unit,
      closedAt: PurchaseOrderItems.closedAt,
      toleranceQty: Products.toleranceUnloadingQty,
      toleranceKg: Products.toleranceUnloadingKg,
    })
    .from(PurchaseOrderItems)
    .leftJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
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
    // A kilo line is held to the kilo tolerance, every other line to the
    // piece tolerance — the two columns of the reference's `Unloading wo` row.
    unloadingTolerance: tolerancePercent(
      line.unit === "kg" ? line.toleranceKg : line.toleranceQty,
    ),
    closed: line.closedAt !== null,
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
): Promise<string | null> => {
  if (quantity <= 0 && kg <= 0) {
    return null;
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
    return null;
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
    const receivalUuid = generateUuid();
    await tx.insert(PurchaseLineReceivals).values({
      uuid: receivalUuid,
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
    return receivalUuid;
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

  await rebillPurchaseLineOnWeighedKilos(tx, purchaseOrderItemUuid);

  // The reception the goods landed on — the first one they filled.
  return allocations[0]?.receival.uuid ?? null;
};

/**
 * Roll the weighbridge up to the line, and re-bill the line on it.
 *
 * 🔴 A purchase line is paid on what was weighed, not on what was calculated —
 * proved to the cent on purchase order `402532`, and written out in full on
 * `PurchaseOrderItems.kgActual`. The receivals already hold the weighed figure
 * per arrival; nothing was carrying it up to the line, so every line in the
 * system was billed on its theoretical weight.
 *
 * Called after each receipt, because a line is billed on what has arrived so
 * far: three of four bundles in means three bundles' worth of weight, and the
 * amount moves again when the fourth lands.
 *
 * A line with no weighed kilos yet is left exactly as it was — `billingWeightKg`
 * falls back to the theoretical, which is what the order showed when it was
 * placed and what it should keep showing until a lorry arrives.
 */
export const rebillPurchaseLineOnWeighedKilos = async (
  tx: PurchaseLineWriter,
  purchaseOrderItemUuid: string,
): Promise<void> => {
  const [line] = await tx
    .select({
      purchaseOrderUuid: PurchaseOrderItems.purchaseOrderUuid,
      kgPurchased: PurchaseOrderItems.kgPurchased,
      netPrice: PurchaseOrderItems.netPrice,
      priceUnit: PurchaseOrderItems.priceUnit,
      quantity: PurchaseOrderItems.quantity,
    })
    .from(PurchaseOrderItems)
    .where(eq(PurchaseOrderItems.uuid, purchaseOrderItemUuid))
    .limit(1);

  if (!line) {
    return;
  }

  const [weighed] = await tx
    .select({ kg: sql<string | null>`SUM(${PurchaseLineReceivals.kgActual})` })
    .from(PurchaseLineReceivals)
    .where(
      eq(PurchaseLineReceivals.purchaseOrderItemUuid, purchaseOrderItemUuid),
    );

  const kgActual = Number(weighed?.kg ?? 0);
  if (!Number.isFinite(kgActual) || kgActual <= 0) {
    return;
  }

  const billingKg = billingWeightKg(line.kgPurchased, kgActual);

  await tx
    .update(PurchaseOrderItems)
    .set({
      kgActual: kgActual.toFixed(2),
      amount: moneyString(
        amountForWeight(Number(line.netPrice ?? 0), line.priceUnit, billingKg, {
          quantity: Number(line.quantity ?? 0),
        }),
      ),
    })
    .where(eq(PurchaseOrderItems.uuid, purchaseOrderItemUuid));

  // The line just changed what it weighs and what it costs, so the header is
  // now wrong. It is refreshed from the lines rather than nudged by the delta:
  // a sum that is recomputed cannot drift, and a purchase order is a handful of
  // lines, not a ledger.
  await refreshPurchaseOrderTotals(tx, line.purchaseOrderUuid);
};

/**
 * Restate a purchase order's header from its lines.
 *
 * 🔴 Both figures were stored and neither was ever written. The header
 * carried the € 0,00 and the 0,000 kg it was created with while its lines said
 * otherwise, which is the kind of defect no screen shows you — the detail page
 * reads the lines, so it looked right.
 *
 * Purchase order `402532` settles what each one is, on 29-9-2026:
 *
 *     Materials    95 513,48   = 44 630,35 + 50 883,13, the sum of line amounts
 *     Weight       48 484      = 22 655 + 25 829, the sum of Kg(a)
 *                                 — NOT 48 042, which is the sum of Kg(p)
 *
 * So the header weight is the **billing** weight: the weighbridge figure where
 * there is one, the theoretical where there is not. Same rule as the amount
 * beside it, which is the point — a header that summed a different weight from
 * the one its lines were billed on would disagree with its own total.
 */
export const refreshPurchaseOrderTotals = async (
  tx: PurchaseLineWriter,
  purchaseOrderUuid: string,
): Promise<void> => {
  const [totals] = await tx
    .select({
      amount: sql<string | null>`SUM(${PurchaseOrderItems.amount})`,
      weightKg: sql<string | null>`SUM(
        COALESCE(${PurchaseOrderItems.kgActual}, ${PurchaseOrderItems.kgPurchased}, 0)
      )`,
    })
    .from(PurchaseOrderItems)
    .where(eq(PurchaseOrderItems.purchaseOrderUuid, purchaseOrderUuid));

  await tx
    .update(PurchaseOrders)
    .set({
      amount: moneyString(Number(totals?.amount ?? 0)),
      weightKg: Number(totals?.weightKg ?? 0).toFixed(3),
    })
    .where(eq(PurchaseOrders.uuid, purchaseOrderUuid));
};
