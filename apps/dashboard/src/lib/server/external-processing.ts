import { db } from "@/db";
import { PurchaseOrderItemOptions } from "@/db/schema/purchase-order-item-options";
import { PurchaseLineReceivals } from "@/db/schema/purchase-line-receivals";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PurchaseOrderSupplies } from "@/db/schema/purchase-order-supplies";
import { PurchaseOrders, SelectPurchaseOrders } from "@/db/schema/purchase-orders";
import { SelectStock, Stock } from "@/db/schema/stock";
import { amountForWeight, moneyString } from "@/lib/helpers";
import { and, eq, inArray, sql } from "drizzle-orm";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type SuppliedIdentity = {
  /** The heat the processed metal keeps — `70120 3` out, `70120 3` back. */
  charge: SelectStock["charge"];
  /** Where the metal was bought, which the processed lot keeps (C13). */
  purchaseOrderUuid: SelectStock["purchaseOrderUuid"];
  purchaseOrderItemUuid: SelectStock["purchaseOrderItemUuid"];
  supplierUuid: SelectStock["supplierUuid"];
  receiptDate: SelectStock["receiptDate"];
  /** What went out, by weight and by value, to share among what comes back. */
  kgOut: number;
  valueOut: number;
};

/**
 * The purchase order a line belongs to, when it is a `Processing` order.
 */
export const processingOrderOf = async (
  tx: Transaction,
  purchaseOrderUuid: string,
): Promise<Pick<SelectPurchaseOrders, "uuid" | "purchaseOrderType"> | null> => {
  const [order] = await tx
    .select({
      uuid: PurchaseOrders.uuid,
      purchaseOrderType: PurchaseOrders.purchaseOrderType,
    })
    .from(PurchaseOrders)
    .where(eq(PurchaseOrders.uuid, purchaseOrderUuid))
    .limit(1);

  return order?.purchaseOrderType === "processing" ? order : null;
};

/**
 * What the processed metal coming back on a `Processing` order inherits from
 * the lot that went out (C13, captured on 402401 8-10-2026): the plates read
 * charge `539002` and purchase order `IO402399` with receipt date 28-11-2025 —
 * the coil's own, not the processor's € 0 order. Null when nothing was
 * supplied yet.
 */
export const suppliedIdentityOf = async (
  tx: Transaction,
  purchaseOrderUuid: string,
): Promise<SuppliedIdentity | null> => {
  const supplies = await tx
    .select({
      kgActual: PurchaseOrderSupplies.kgActual,
      valueEur: PurchaseOrderSupplies.valueEur,
      charge: Stock.charge,
      purchaseOrderUuid: Stock.purchaseOrderUuid,
      purchaseOrderItemUuid: Stock.purchaseOrderItemUuid,
      supplierUuid: Stock.supplierUuid,
      receiptDate: Stock.receiptDate,
    })
    .from(PurchaseOrderSupplies)
    .innerJoin(Stock, eq(PurchaseOrderSupplies.stockUuid, Stock.uuid))
    .where(
      and(
        eq(PurchaseOrderSupplies.purchaseOrderUuid, purchaseOrderUuid),
        eq(PurchaseOrderSupplies.status, "delivered"),
      ),
    )
    .orderBy(PurchaseOrderSupplies.id);

  const first = supplies[0];
  if (!first) {
    return null;
  }

  return {
    charge: first.charge,
    purchaseOrderUuid: first.purchaseOrderUuid,
    purchaseOrderItemUuid: first.purchaseOrderItemUuid,
    supplierUuid: first.supplierUuid,
    receiptDate: first.receiptDate,
    kgOut: supplies.reduce((sum, row) => sum + Number(row.kgActual ?? 0), 0),
    valueOut: supplies.reduce((sum, row) => sum + Number(row.valueEur ?? 0), 0),
  };
};

/**
 * Restate a purchase line's options on the weight that came back (C10):
 * `Decoilen` at € 110,00 per TN on `400066` is € 99,00 because 900 kg came back,
 * whatever went out. Then the order's amount is its lines plus its options.
 */
export const restatePurchaseLineOptions = async (
  tx: Transaction,
  purchaseOrderItemUuid: string,
): Promise<void> => {
  const [line] = await tx
    .select({
      purchaseOrderUuid: PurchaseOrderItems.purchaseOrderUuid,
      kgPurchased: PurchaseOrderItems.kgPurchased,
      quantity: PurchaseOrderItems.quantity,
    })
    .from(PurchaseOrderItems)
    .where(eq(PurchaseOrderItems.uuid, purchaseOrderItemUuid))
    .limit(1);

  if (!line) {
    return;
  }

  // Received weight when there is one — the receptions' own `Kg(a)`, summed —
  // and the planned weight until then.
  const [received] = await tx
    .select({
      kg: sql<string>`COALESCE(SUM(${PurchaseLineReceivals.kgActual}), 0)`,
    })
    .from(PurchaseLineReceivals)
    .where(eq(PurchaseLineReceivals.purchaseOrderItemUuid, purchaseOrderItemUuid));
  const kg =
    Number(received?.kg ?? 0) > 0
      ? Number(received?.kg ?? 0)
      : Number(line.kgPurchased ?? 0);

  const options = await tx
    .select()
    .from(PurchaseOrderItemOptions)
    .where(eq(PurchaseOrderItemOptions.purchaseOrderItemUuid, purchaseOrderItemUuid));

  for (const option of options) {
    const net =
      Number(option.grossPrice ?? 0) *
      (1 - Number(option.discountPercent ?? 0) / 100) *
      Number(option.referenceFactor ?? 1);
    await tx
      .update(PurchaseOrderItemOptions)
      .set({
        netPrice: net.toFixed(4),
        amount: moneyString(
          amountForWeight(net, option.per, kg, {
            quantity: Number(option.quantity ?? line.quantity ?? 0),
          }),
        ),
      })
      .where(eq(PurchaseOrderItemOptions.uuid, option.uuid));
  }

  await restatePurchaseOrderAmount(tx, line.purchaseOrderUuid);
};

/** The order's amount: its lines and its options together. */
export const restatePurchaseOrderAmount = async (
  tx: Transaction,
  purchaseOrderUuid: string,
): Promise<void> => {
  const [lines] = await tx
    .select({ amount: sql<string>`COALESCE(SUM(${PurchaseOrderItems.amount}), 0)` })
    .from(PurchaseOrderItems)
    .where(eq(PurchaseOrderItems.purchaseOrderUuid, purchaseOrderUuid));
  const [options] = await tx
    .select({
      amount: sql<string>`COALESCE(SUM(${PurchaseOrderItemOptions.amount}), 0)`,
    })
    .from(PurchaseOrderItemOptions)
    .where(eq(PurchaseOrderItemOptions.purchaseOrderUuid, purchaseOrderUuid));

  await tx
    .update(PurchaseOrders)
    .set({
      amount: moneyString(
        Number(lines?.amount ?? 0) + Number(options?.amount ?? 0),
      ),
    })
    .where(eq(PurchaseOrders.uuid, purchaseOrderUuid));
};

/**
 * The supply has gone out: record what left, at what value, and mark it
 * `Delivered` — the status both `400066` and `402401` read.
 */
export const markSupplyDelivered = async (
  tx: Transaction,
  supplyUuid: string,
  sent: { quantity: number; kg: number; value: number },
): Promise<void> => {
  await tx
    .update(PurchaseOrderSupplies)
    .set({
      qtyPicked: sent.quantity.toFixed(3),
      qtyActual: sent.quantity.toFixed(3),
      kgActual: sent.kg.toFixed(2),
      valueEur: moneyString(sent.value),
      status: "delivered",
    })
    .where(eq(PurchaseOrderSupplies.uuid, supplyUuid));
};

/** Mark supplies as being picked once a work order has been raised for them. */
export const markSuppliesPicking = async (
  tx: Transaction,
  supplyUuids: string[],
): Promise<void> => {
  if (supplyUuids.length === 0) {
    return;
  }
  await tx
    .update(PurchaseOrderSupplies)
    .set({ status: "workorders_created" })
    .where(inArray(PurchaseOrderSupplies.uuid, supplyUuids));
};
