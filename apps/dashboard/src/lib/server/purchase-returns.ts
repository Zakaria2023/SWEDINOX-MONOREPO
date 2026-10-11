import { db } from "@/db";
import { JournalEntries } from "@/db/schema/journal-entries";
import {
  PurchaseReturnOrderItems,
  SelectPurchaseReturnOrderItems,
} from "@/db/schema/purchase-return-order-items";
import {
  PurchaseReturnOrders,
  SelectPurchaseReturnOrders,
} from "@/db/schema/purchase-return-orders";
import { SelectStock, Stock } from "@/db/schema/stock";
import { StockMovements } from "@/db/schema/stock-movements";
import { WarehouseWorkOrderLines } from "@/db/schema/warehouse-work-orders";
import {
  generateUuid,
  isPurchaseReturnOrderEditable,
  moneyString,
  restateLotValue,
  todayDateString,
  STOCK_QUANTITY_SCALE,
} from "@/lib/helpers";
import { recordFreightMovement } from "@/lib/server/freight";
import {
  buildInventoryMovementEntry,
  LEDGER_ACCOUNTS,
} from "@/lib/server/ledger";
import { and, count, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type PurchaseReturnIssueParams = {
  /** The lot the goods leave from, as read inside this transaction. */
  source: SelectStock;
  /** How much of it goes back. */
  quantity: number;
  returnOrder: Pick<SelectPurchaseReturnOrders, "id" | "supplierUuid">;
  returnLine: Pick<
    SelectPurchaseReturnOrderItems,
    "uuid" | "originalPurchaseOrderUuid"
  >;
  userId: string;
  /**
   * The picking line that carried the goods out, when a warehouse work order
   * did; null when the return was sent back straight from its own screen.
   */
  warehouseWorkOrderLineUuid: string | null;
};

// A picking line names the return line it serves; the return and the line are
// read from that.
type PurchaseReturnPickParams = Omit<
  PurchaseReturnIssueParams,
  "returnOrder" | "returnLine"
> & {
  purchaseReturnOrderItemUuid: string;
};

/**
 * Goods leaving for the supplier on a purchase return: the lot is drawn down,
 * its value with it, and what the supplier owes us for them is held until their
 * credit note arrives.
 *
 * The one implementation behind both ways a return goes: `Send goods back` on
 * the return itself, and reporting the picking `Make final` raised (950034,
 * 11-10-2026 — lot 26AQWF went from 10 ST to 8 ST, 314 to 251 kg, € 784,83 to
 * € 627,87, still on `Ontvangst`). Returns the value that left the lot.
 */
export const applyPurchaseReturnIssue = async (
  tx: Transaction,
  {
    source,
    quantity,
    returnOrder,
    returnLine,
    userId,
    warehouseWorkOrderLineUuid,
  }: PurchaseReturnIssueParams,
): Promise<number> => {
  const previousQuantity = Number(source.quantity);
  const free = previousQuantity - Number(source.reservedQuantity);

  // Reserved goods are promised to a customer; they can't be sent back to
  // the supplier without breaking that promise.
  if (quantity > free) {
    throw new Error(
      `Only ${free.toFixed(3)} of this lot is free to return — the rest is reserved for a customer.`,
    );
  }

  const nextQuantity = (previousQuantity - quantity).toFixed(
    STOCK_QUANTITY_SCALE,
  );

  // Material leaving for the supplier takes its value with it. Reducing
  // the quantity alone left the rest of the lot carrying the value of
  // goods that had gone back, so every purchase return overstated stock.
  const previousValue = Number(source.valuationEuro ?? 0);
  const nextValue = restateLotValue({
    previousQuantity,
    remainingQuantity: Number(nextQuantity),
    unitCost: Number(source.valuationPrice ?? 0),
    previousValue,
  });

  // And its theoretical weight: 26AQWF read 251 kg after two of its ten
  // sheets went back, down from 314. The weight is arithmetic, so it
  // apportions by quantity.
  const previousKg = Number(source.quantityKg ?? 0);
  const nextKg =
    previousQuantity > 0
      ? (previousKg * Number(nextQuantity)) / previousQuantity
      : 0;

  const [stockUpdate] = await tx
    .update(Stock)
    .set({
      quantity: nextQuantity,
      quantityKg: nextKg.toFixed(STOCK_QUANTITY_SCALE),
      valuationEuro: moneyString(nextValue),
      status: Number(nextQuantity) > 0 ? "pending" : "received",
    })
    .where(and(eq(Stock.uuid, source.uuid), eq(Stock.quantity, source.quantity)));

  if (stockUpdate.affectedRows === 0) {
    throw new Error(
      "Stock changed while sending the return — please refresh and try again.",
    );
  }

  const returnedQuantity = quantity.toFixed(3);

  await tx.insert(StockMovements).values({
    uuid: generateUuid(),
    productUuid: source.productUuid,
    stockUuid: source.uuid,
    type: "out",
    reason: "purchase_return",
    quantity: returnedQuantity,
    purchaseOrderUuid: returnLine.originalPurchaseOrderUuid,
    warehouseWorkOrderLineUuid,
    createdByUserId: userId,
  });

  await recordFreightMovement(tx, {
    productUuid: source.productUuid,
    quantity: returnedQuantity,
    type: "out",
    reason: "purchase_return",
    purchaseOrderUuid: returnLine.originalPurchaseOrderUuid,
    operator: userId,
  });

  // The goods are gone but the supplier has not credited them yet, so
  // what they owe us for them is held until their credit note arrives.
  const valueOut = previousValue - nextValue;

  if (Math.abs(valueOut) >= 0.005) {
    await tx.insert(JournalEntries).values(
      buildInventoryMovementEntry({
        bookingDate: todayDateString(),
        documentNo: String(returnOrder.id),
        description: "Goods returned to supplier",
        companyUuid: returnOrder.supplierUuid,
        debCreditor: null,
        inventoryValue: -valueOut,
        counterAccount: LEDGER_ACCOUNTS.goodsReturnedNotCredited,
        reference: `Purchase return line ${returnLine.uuid}`,
        userId,
      }),
    );
  }

  return valueOut;
};

/**
 * Reporting a picking line that serves a purchase return: the lot it drew on
 * leaves for the supplier through the return's own movement, once.
 */
export const issuePurchaseReturnPick = async (
  tx: Transaction,
  {
    purchaseReturnOrderItemUuid,
    ...params
  }: PurchaseReturnPickParams,
): Promise<number> => {
  const [row] = await tx
    .select({
      returnLine: {
        uuid: PurchaseReturnOrderItems.uuid,
        originalPurchaseOrderUuid:
          PurchaseReturnOrderItems.originalPurchaseOrderUuid,
      },
      returnOrder: {
        id: PurchaseReturnOrders.id,
        supplierUuid: PurchaseReturnOrders.supplierUuid,
        status: PurchaseReturnOrders.status,
      },
    })
    .from(PurchaseReturnOrderItems)
    .innerJoin(
      PurchaseReturnOrders,
      eq(
        PurchaseReturnOrderItems.purchaseReturnOrderUuid,
        PurchaseReturnOrders.uuid,
      ),
    )
    .where(eq(PurchaseReturnOrderItems.uuid, purchaseReturnOrderItemUuid))
    .limit(1);

  if (!row) {
    throw new Error(
      "The purchase return line this picking serves no longer exists.",
    );
  }
  // `Send goods back` on the return already took the stock out; picking it
  // as well would send the same goods twice.
  if (!isPurchaseReturnOrderEditable(row.returnOrder.status)) {
    throw new Error(
      row.returnOrder.status === "cancelled"
        ? "The purchase return this picking serves was cancelled."
        : "The goods on this purchase return have already been sent back.",
    );
  }

  return applyPurchaseReturnIssue(tx, {
    ...params,
    returnOrder: row.returnOrder,
    returnLine: row.returnLine,
  });
};

/**
 * After a picking line serving a return is reported: the return line reads
 * what has gone, and once every line of the return has gone the return is
 * `Delivered`, as `Send goods back` leaves it.
 */
export const recordPurchaseReturnLinePicked = async (
  tx: Transaction,
  purchaseReturnOrderItemUuid: string,
): Promise<void> => {
  const [item] = await tx
    .select({
      purchaseReturnOrderUuid: PurchaseReturnOrderItems.purchaseReturnOrderUuid,
      returnQty: PurchaseReturnOrderItems.returnQty,
    })
    .from(PurchaseReturnOrderItems)
    .where(eq(PurchaseReturnOrderItems.uuid, purchaseReturnOrderItemUuid))
    .limit(1);

  if (!item) {
    return;
  }

  // A reported line has moved its stock whether or not somebody still has
  // to approve it, so `ready` counts as gone.
  const [picked] = await tx
    .select({
      quantity: sql<string>`COALESCE(SUM(${WarehouseWorkOrderLines.qtyActual}), 0)`,
    })
    .from(WarehouseWorkOrderLines)
    .where(
      and(
        eq(
          WarehouseWorkOrderLines.purchaseReturnOrderItemUuid,
          purchaseReturnOrderItemUuid,
        ),
        inArray(WarehouseWorkOrderLines.status, ["ready", "approved"]),
      ),
    );

  await tx
    .update(PurchaseReturnOrderItems)
    .set({
      lineStatus:
        Number(picked?.quantity ?? 0) >= Number(item.returnQty ?? 0)
          ? "completed"
          : "partially_delivered",
    })
    .where(eq(PurchaseReturnOrderItems.uuid, purchaseReturnOrderItemUuid));

  const [outstanding] = await tx
    .select({ value: count() })
    .from(PurchaseReturnOrderItems)
    .where(
      and(
        eq(
          PurchaseReturnOrderItems.purchaseReturnOrderUuid,
          item.purchaseReturnOrderUuid,
        ),
        or(
          isNull(PurchaseReturnOrderItems.lineStatus),
          ne(PurchaseReturnOrderItems.lineStatus, "completed"),
        ),
      ),
    );

  if (Number(outstanding?.value ?? 0) === 0) {
    await tx
      .update(PurchaseReturnOrders)
      .set({ status: "delivered" })
      .where(
        and(
          eq(PurchaseReturnOrders.uuid, item.purchaseReturnOrderUuid),
          inArray(PurchaseReturnOrders.status, ["provisional", "released"]),
        ),
      );
  }
};
