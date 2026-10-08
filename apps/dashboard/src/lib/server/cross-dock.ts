import { db } from "@/db";
import { OrderItems } from "@/db/schema/order-items";
import { Reservations } from "@/db/schema/reservations";
import { SelectStock, Stock } from "@/db/schema/stock";
import { generateUuid, moneyString, STOCK_QUANTITY_SCALE } from "@/lib/helpers";
import { and, eq, isNull } from "drizzle-orm";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type PurchaseLineCost = {
  /** The purchase line's amount — what the whole line is bought for. */
  amount: number;
  /** The purchase line's quantity, to share that amount out by. */
  quantity: number;
};

type ReceivedLot = {
  stockUuid: string;
  quantity: number;
  /** The lot's value, which is the price paid on what was unloaded. */
  value: number;
  unit: SelectStock["unit"];
};

/**
 * Restate a sales line's cost and margin from a cost amount.
 *
 * C11 of PLANNED-CODE-CHANGES-8: a `CD` line is costed at the purchase bought
 * for it. On `O108183/10` the reference reads `Purchase price` € 3 050,00 and
 * `Costs` € 6 661,20 — 3 050 €/TN on the 2,184 t **unloaded**, not the 2,1725 t
 * sold — and the profit (€ 508,05, 7,09 %) follows from it.
 */
const restateLineCost = async (
  tx: Transaction,
  orderItemUuid: string,
  costAmount: number,
): Promise<void> => {
  const [line] = await tx
    .select({ quantity: OrderItems.quantity, amount: OrderItems.amount })
    .from(OrderItems)
    .where(eq(OrderItems.uuid, orderItemUuid))
    .limit(1);

  if (!line) {
    return;
  }

  const quantity = Number(line.quantity ?? 0);
  const amount = Number(line.amount ?? 0);
  const profit = amount - costAmount;

  await tx
    .update(OrderItems)
    .set({
      costPrice: (quantity > 0 ? costAmount / quantity : 0).toFixed(4),
      costAmount: moneyString(costAmount),
      profit: moneyString(profit),
      profitMargin: (amount !== 0 ? (profit / amount) * 100 : 0).toFixed(2),
    })
    .where(eq(OrderItems.uuid, orderItemUuid));
};

/**
 * A purchase line has been raised **for** a sales line: point the sale at it
 * and make the sale `CD`.
 *
 * Captured 8-10-2026 on purchase order `404299` / sales order `O108183`: the
 * purchase line reads `For line O108183/10` and the sales line's `Type` reads
 * `CD`. A sales line that already holds stock of its own and is topped up by
 * the purchase is `Stk+CD`, the reference's third value.
 *
 * A line with no lot of its own is costed from the purchase straight away, by
 * its share of the purchase line (C11). The receipt restates it on what was
 * actually unloaded.
 */
export const coverSalesLineWithPurchase = async (
  tx: Transaction,
  orderItemUuid: string,
  purchaseOrderItemUuid: string,
  purchaseCost?: PurchaseLineCost,
): Promise<void> => {
  const [line] = await tx
    .select({
      qtyReserved: OrderItems.qtyReserved,
      stockUuid: OrderItems.stockUuid,
      quantity: OrderItems.quantity,
    })
    .from(OrderItems)
    .where(eq(OrderItems.uuid, orderItemUuid))
    .limit(1);

  if (!line) {
    return;
  }

  await tx
    .update(OrderItems)
    .set({
      purchaseOrderItemUuid,
      sourceType:
        Number(line.qtyReserved ?? 0) > 0 ? "stock_and_cross_dock" : "cross_dock",
    })
    .where(eq(OrderItems.uuid, orderItemUuid));

  if (!line.stockUuid && purchaseCost && purchaseCost.quantity > 0) {
    const share = Math.min(1, Number(line.quantity ?? 0) / purchaseCost.quantity);
    await restateLineCost(tx, orderItemUuid, purchaseCost.amount * share);
  }
};

/**
 * The goods bought for `CD` sales lines have been received: give each of
 * those lines the new lot and reserve it to them.
 *
 * Captured 8-10-2026: lot `404744` was created on 21-9-2026 already reserved
 * 41 of 41 to `O108183/10`, the line purchase order `404299` was raised for,
 * and placed straight on `Laad` for the customer's lorry. Lines are served in
 * line order until the lot runs out. Each takes the lot's own value for its
 * share as its cost (C11), which is the price paid on the weight unloaded.
 */
export const reserveReceiptToCoveredSalesLines = async (
  tx: Transaction,
  purchaseOrderItemUuid: string,
  lot: ReceivedLot,
  reservedFor: Date | null,
): Promise<number> => {
  const covered = await tx
    .select({
      uuid: OrderItems.uuid,
      quantity: OrderItems.quantity,
      kgPlanned: OrderItems.kgPlanned,
    })
    .from(OrderItems)
    .where(
      and(
        eq(OrderItems.purchaseOrderItemUuid, purchaseOrderItemUuid),
        isNull(OrderItems.stockUuid),
        eq(OrderItems.status, "reserved"),
      ),
    )
    .orderBy(OrderItems.lineNumber);

  // Served in line order until the lot runs out.
  const allocations = covered.reduce<
    { uuid: string; kgPlanned: string | null; take: number }[]
  >((taken, line) => {
    const used = taken.reduce((sum, entry) => sum + entry.take, 0);
    const take = Math.min(lot.quantity - used, Number(line.quantity ?? 0));
    return take > 0
      ? [...taken, { uuid: line.uuid, kgPlanned: line.kgPlanned, take }]
      : taken;
  }, []);

  for (const line of allocations) {
    await tx
      .update(OrderItems)
      .set({
        stockUuid: lot.stockUuid,
        qtyReserved: line.take.toFixed(STOCK_QUANTITY_SCALE),
      })
      .where(eq(OrderItems.uuid, line.uuid));

    await tx.insert(Reservations).values({
      uuid: generateUuid(),
      stockUuid: lot.stockUuid,
      orderItemUuid: line.uuid,
      type: "sale",
      status: "definitive",
      quantity: line.take.toFixed(STOCK_QUANTITY_SCALE),
      unit: lot.unit ?? "st",
      quantityKg: line.kgPlanned ?? "0.00",
      reservedFor,
    });

    await restateLineCost(
      tx,
      line.uuid,
      lot.quantity > 0 ? (lot.value * line.take) / lot.quantity : 0,
    );
  }

  const reserved = allocations.reduce((sum, entry) => sum + entry.take, 0);

  if (reserved > 0) {
    await tx
      .update(Stock)
      .set({ reservedQuantity: reserved.toFixed(STOCK_QUANTITY_SCALE) })
      .where(eq(Stock.uuid, lot.stockUuid));
  }

  return reserved;
};
