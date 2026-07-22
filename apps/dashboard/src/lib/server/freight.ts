import {
  db,
  FreightMovements,
  InsertFreightMovements,
  Products,
  Stock,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { eq, sql } from "drizzle-orm";

// The Drizzle transaction handle passed into db.transaction(async (tx) => ...).
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type RecordFreightMovementParams = {
  productUuid: string;
  // Always a positive amount; the direction is expressed by `type`.
  quantity: string;
  type: "in" | "out";
  reason: InsertFreightMovements["reason"];
  companyUuid?: string | null;
  orderUuid?: string | null;
  purchaseOrderUuid?: string | null;
  supplierUuid?: string | null;
  note?: string | null;
  operator?: string | null;
  // Unit valuation used to value the running stock balance (optional).
  valuationPrice?: string | null;
};

// Records one row in the FreightMovements goods-flow ledger to mirror a stock
// mutation, capturing the running stock balance (before/after) and its
// accounting dimensions. Call it with the same transaction that wrote the
// StockMovements row, right after the stock quantity has been updated, so the
// closing balance reflects the mutation.
export const recordFreightMovement = async (
  tx: Transaction,
  params: RecordFreightMovementParams,
): Promise<void> => {
  const [product] = await tx
    .select({ revenueGroupUuid: Products.revenueGroupUuid })
    .from(Products)
    .where(eq(Products.uuid, params.productUuid))
    .limit(1);

  // Closing balance = the product's total on-hand stock after this mutation.
  const [totals] = await tx
    .select({ total: sql<string>`COALESCE(SUM(${Stock.quantity}), 0)` })
    .from(Stock)
    .where(eq(Stock.productUuid, params.productUuid));

  const closingQty = Number(totals?.total ?? 0);
  const signed =
    params.type === "in" ? Number(params.quantity) : -Number(params.quantity);
  const startingQty = closingQty - signed;
  const unitPrice = Number(params.valuationPrice ?? 0);

  await tx.insert(FreightMovements).values({
    uuid: generateUuid(),
    mutationDate: new Date(),
    mutationOperator: params.operator ?? null,
    productUuid: params.productUuid,
    mutationQuantity: params.quantity,
    reason: params.reason,
    startingStockQty: startingQty.toFixed(3),
    startingStockValue: (startingQty * unitPrice).toFixed(2),
    closingStockQty: closingQty.toFixed(3),
    closingStockValue: (closingQty * unitPrice).toFixed(2),
    revenueGroupUuid: product?.revenueGroupUuid ?? null,
    companyUuid: params.companyUuid ?? null,
    orderUuid: params.orderUuid ?? null,
    purchaseOrderUuid: params.purchaseOrderUuid ?? null,
    supplierUuid: params.supplierUuid ?? null,
    text: params.note ?? null,
  });
};
