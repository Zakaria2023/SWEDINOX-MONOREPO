import { db } from "@/db";
import { Batches } from "@/db/schema/batches";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { Stock } from "@/db/schema/stock";
import { StockBatches } from "@/db/schema/stock-batches";
import { generateUuid, todayDateString } from "@/lib/helpers";
import { and, eq } from "drizzle-orm";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type RegisterBatchOptions = {
  /** The reception the goods arrived on, when a receipt made the lot. */
  purchaseLineReceivalUuid?: string | null;
  /**
   * The day the batch row is written for. A receipt is dated the day it
   * arrived; a processing output is dated the day it came off the machine,
   * even though its lot keeps the receipt date of the steel it was cut from.
   */
  date?: string;
  /** Excused from the certificate requirement (stock taken over, found). */
  mandatoryIgnoreDocument?: boolean;
};

/**
 * Writes the Batches row for a lot that has just come into stock, and links the
 * lot to it.
 *
 * The reference writes a batch row whenever material enters stock under a
 * charge — at the goods receipt, and again for every processing output (192
 * decoil rows on received charges, 125 production rows, 76 from outside
 * processors, 16-9-2026). The processing row keeps the internal charge and
 * heat of what it was made from, with its own date, size, pieces and kilos;
 * that is how a sheet sold as a different product still traces to the heat.
 *
 * A lot without an internal charge has no batch identity to register, so it is
 * left alone — sawing waste is the case.
 */
export const registerBatchForLot = async (
  tx: Transaction,
  stockUuid: string,
  options: RegisterBatchOptions = {},
): Promise<string | null> => {
  const [lot] = await tx
    .select({
      uuid: Stock.uuid,
      productUuid: Stock.productUuid,
      supplierUuid: Stock.supplierUuid,
      purchaseOrderUuid: Stock.purchaseOrderUuid,
      purchaseOrderItemUuid: Stock.purchaseOrderItemUuid,
      purchaseOrderId: PurchaseOrders.id,
      receiptDate: Stock.receiptDate,
      lengthMm: Stock.lengthMm,
      widthMm: Stock.widthMm,
      thicknessMm: Stock.thicknessMm,
      quantity: Stock.quantity,
      unit: Stock.unit,
      quantityKg: Stock.quantityKg,
      charge: Stock.charge,
      internalCharge: Stock.internalCharge,
      plateNumber: Stock.plateNumber,
      stockCategory: Stock.stockCategory,
      quality: Stock.quality,
      options: Stock.options,
    })
    .from(Stock)
    .leftJoin(PurchaseOrders, eq(Stock.purchaseOrderUuid, PurchaseOrders.uuid))
    .where(eq(Stock.uuid, stockUuid))
    .limit(1);

  if (!lot?.internalCharge) {
    return null;
  }

  const batchUuid = generateUuid();
  await tx.insert(Batches).values({
    uuid: batchUuid,
    purchaseOrderUuid: lot.purchaseOrderUuid,
    purchaseOrderItemUuid: lot.purchaseOrderItemUuid,
    purchaseLineReceivalUuid: options.purchaseLineReceivalUuid ?? null,
    stockUuid: lot.uuid,
    productUuid: lot.productUuid,
    supplierUuid: lot.supplierUuid,
    purchaseOrderCode:
      lot.purchaseOrderId === null ? null : String(lot.purchaseOrderId),
    receiptDate: options.date ?? lot.receiptDate ?? todayDateString(),
    lengthMm: lot.lengthMm,
    widthMm: lot.widthMm,
    thicknessMm: lot.thicknessMm,
    qty: lot.quantity,
    unit: lot.unit ?? "st",
    kg: lot.quantityKg ?? "0.00",
    charge: lot.charge,
    internalCharge: lot.internalCharge,
    sheetNumber: lot.plateNumber,
    stockCategory: lot.stockCategory,
    qualityCode: lot.quality,
    options: lot.options,
    mandatoryIgnoreDocument: options.mandatoryIgnoreDocument ?? false,
  });

  await tx.insert(StockBatches).values({
    uuid: generateUuid(),
    stockUuid: lot.uuid,
    batchUuid,
    quantity: lot.quantity,
  });

  return batchUuid;
};

/**
 * Carries a lot's batches along when part of it moves to another lot.
 *
 * A batch spreads over lots — bundles are split across racks and combined on
 * them — which is why the link is a table of its own. The moved quantity takes
 * each batch in the share the source held it, and the source gives that much
 * up, so every piece stays traceable to the batch it came from.
 */
export const carryLotBatches = async (
  tx: Transaction,
  fromStockUuid: string,
  toStockUuid: string,
  quantity: number,
): Promise<void> => {
  if (quantity <= 0 || fromStockUuid === toStockUuid) {
    return;
  }

  const links = await tx
    .select()
    .from(StockBatches)
    .where(eq(StockBatches.stockUuid, fromStockUuid));

  const held = links.reduce((sum, link) => sum + Number(link.quantity), 0);
  if (links.length === 0 || held <= 0) {
    return;
  }

  for (const link of links) {
    const share = (quantity * Number(link.quantity)) / held;

    await tx
      .update(StockBatches)
      .set({
        quantity: Math.max(0, Number(link.quantity) - share).toFixed(3),
      })
      .where(eq(StockBatches.uuid, link.uuid));

    const [existing] = await tx
      .select()
      .from(StockBatches)
      .where(
        and(
          eq(StockBatches.stockUuid, toStockUuid),
          eq(StockBatches.batchUuid, link.batchUuid),
        ),
      )
      .limit(1);

    if (existing) {
      await tx
        .update(StockBatches)
        .set({ quantity: (Number(existing.quantity) + share).toFixed(3) })
        .where(eq(StockBatches.uuid, existing.uuid));
    } else {
      await tx.insert(StockBatches).values({
        uuid: generateUuid(),
        stockUuid: toStockUuid,
        batchUuid: link.batchUuid,
        quantity: share.toFixed(3),
      });
    }
  }
};
