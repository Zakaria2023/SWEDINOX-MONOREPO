"use server";

import { db } from "@/db";
import { SelectStock, Stock } from "@/db/schema/stock";
import {
  SelectStockMovements,
  StockMovements,
} from "@/db/schema/stock-movements";
import { Products, SelectProducts } from "@/db/schema/products";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import { JournalEntries } from "@/db/schema/journal-entries";
import { StockCorrectionReason, StockMovementType } from "@/lib/enums";
import {
  describeError,
  generateUuid,
  restateLotValue,
  todayDateString,
} from "@/lib/helpers";
import { STOCK_MOVEMENT_REASON_LABELS } from "@/lib/labels";
import { recordFreightMovement } from "@/lib/server/freight";
import {
  buildInventoryMovementEntry,
  LEDGER_ACCOUNTS,
} from "@/lib/server/ledger";
import { currentUser } from "@clerk/nextjs/server";
import { stockStatuses } from "@/lib/enums";
import {
  booleanFilter,
  dateRangeFilter,
  enumFilter,
  numberRangeFilter,
  relationFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { exportRows } from "@/lib/server/excel";
import { STOCK_COLUMNS } from "@/app/(dashboard)/stock/columns";
import { and, count, desc, eq, getTableColumns, gt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type StockListItem = SelectStock & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  companyName: SelectCompanies["companyName"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  originalQuantity: SelectPurchaseOrderItems["quantity"] | null;
};

export type PendingStockOption = Pick<SelectStock, "uuid" | "quantity"> & {
  productUuid: SelectProducts["uuid"];
  productCode: SelectProducts["productCode"];
  productName: SelectProducts["name"];
};

export type AvailableStockOption = PendingStockOption;

export type StockCorrectionInput = {
  stockUuid: string;
  direction: StockMovementType;
  quantity: string;
  reason: StockCorrectionReason;
  note?: string;
};

export type StockActionResult = {
  error?: string;
  success?: boolean;
};

export type StockDetail = StockListItem & {
  movements: SelectStockMovements[];
};

const STOCK_SEARCH = [
  Products.productCode,
  Products.name,
  Stock.charge,
  Stock.internalCharge,
] as const;

const STOCK_SORTABLE = {
  createdAt: Stock.createdAt,
  product: Products.productCode,
  status: Stock.status,
  receiptDate: Stock.receiptDate,
  quantity: Stock.quantity,
  valuationEuro: Stock.valuationEuro,
};

// A lot is looked for by article, by state, by where it sits and by who supplied
// it. `blocked` is offered because blocked stock is on the shelf but cannot be
// sold, which is exactly the discrepancy someone is chasing when they ask.
const STOCK_FILTERS = {
  status: enumFilter(Stock.status, stockStatuses),
  product: relationFilter(Stock.productUuid),
  location: relationFilter(Stock.locationUuid),
  supplier: relationFilter(Stock.supplierUuid),
  receiptDate: dateRangeFilter(Stock.receiptDate),
  quantity: numberRangeFilter(Stock.quantity),
  blocked: booleanFilter(Stock.blocked),
};

/**
 * The rows one view of the stock overview selects, as a window onto them.
 * Shared by the page and the export.
 */
const stockRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<StockListItem[]> =>
    db
      .select({
        ...getTableColumns(Stock),
        productCode: Products.productCode,
        productName: Products.name,
        companyName: Companies.companyName,
        purchaseOrderId: PurchaseOrders.id,
        originalQuantity: PurchaseOrderItems.quantity,
      })
      .from(Stock)
      .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
      .leftJoin(Companies, eq(Products.companyUuid, Companies.uuid))
      .leftJoin(
        PurchaseOrders,
        eq(Stock.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(
        PurchaseOrderItems,
        eq(Stock.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
      )
      .where(
        tableWhere({ query, search: STOCK_SEARCH, filters: STOCK_FILTERS }),
      )
      .orderBy(
        ...tableOrderBy(
          STOCK_SORTABLE,
          query,
          [desc(Stock.createdAt)],
          Stock.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/** Every stock lot the current view matches, as a workbook. */
export const exportStock = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Stock",
    columns: STOCK_COLUMNS,
    columnKeys,
    rows: stockRows(parseTableQuery(params)),
  });

export const getStock = async (
  query: TableQuery,
): Promise<Paged<StockListItem>> => {
  try {
    const where = tableWhere({
      query,
      search: STOCK_SEARCH,
      filters: STOCK_FILTERS,
    });

    return await runPaged(query, {
      rows: stockRows(query),

      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(Stock)
          .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
          .where(where);
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch stock"));
  }
};

// Remaining quantity actually free to draw down further — physical quantity
// minus whatever open sales-order reservations already hold on the lot.
const availableQuantity = sql<string>`(${Stock.quantity} - ${Stock.reservedQuantity})`;

export const getPendingStockForCompany = async (
  companyUuid: string,
): Promise<PendingStockOption[]> =>
  db
    .select({
      uuid: Stock.uuid,
      quantity: availableQuantity,
      productUuid: Products.uuid,
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(Stock)
    .innerJoin(Products, eq(Stock.productUuid, Products.uuid))
    .where(
      and(
        eq(Products.companyUuid, companyUuid),
        eq(Stock.status, "pending"),
        gt(availableQuantity, "0"),
      ),
    )
    .orderBy(desc(Stock.createdAt));

// Available stock across every product — not scoped to a single company,
// since a sales order can draw from any lot currently in the warehouse.
export const getAvailableStockForSelect = async (): Promise<
  AvailableStockOption[]
> =>
  db
    .select({
      uuid: Stock.uuid,
      quantity: availableQuantity,
      productUuid: Products.uuid,
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(Stock)
    .innerJoin(Products, eq(Stock.productUuid, Products.uuid))
    .where(and(eq(Stock.status, "pending"), gt(availableQuantity, "0")))
    .orderBy(desc(Stock.createdAt));

export const createStockCorrection = async (
  input: StockCorrectionInput,
): Promise<StockActionResult> => {
  try {
    const [stockRow] = await db
      .select()
      .from(Stock)
      .where(eq(Stock.uuid, input.stockUuid))
      .limit(1);

    if (!stockRow) {
      return { error: "Stock item not found." };
    }

    if (stockRow.status === "cancelled") {
      return { error: "Cannot correct a cancelled stock item." };
    }

    const freeQuantity =
      Number(stockRow.quantity) - Number(stockRow.reservedQuantity);

    if (input.direction === "out" && Number(input.quantity) > freeQuantity) {
      return {
        error:
          freeQuantity < Number(stockRow.quantity)
            ? `Cannot remove more than the unreserved quantity (${freeQuantity.toFixed(3)}) — some of this lot is held by open sales orders.`
            : `Cannot remove more than the available quantity (${stockRow.quantity}).`,
      };
    }

    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const delta =
      input.direction === "in"
        ? Number(input.quantity)
        : -Number(input.quantity);
    const nextQuantity = (Number(stockRow.quantity) + delta).toFixed(3);

    // A correction has to move the lot's value as well as its count, or the
    // shelf keeps the worth of material that is no longer on it. Material added
    // by a count difference can only be valued at what the rest of the lot cost;
    // material removed takes its share of the value with it.
    const previousValue = Number(stockRow.valuationEuro ?? 0);
    const unitCost = Number(stockRow.valuationPrice ?? 0);
    const nextValue =
      delta > 0
        ? previousValue + delta * unitCost
        : restateLotValue({
            previousQuantity: Number(stockRow.quantity),
            remainingQuantity: Number(nextQuantity),
            unitCost,
            previousValue,
          });

    await db.transaction(async (tx) => {
      // Optimistic lock: only apply if the quantity we read hasn't changed —
      // otherwise another correction/consumption raced us and we roll back.
      const [updateResult] = await tx
        .update(Stock)
        .set({
          quantity: nextQuantity,
          valuationEuro: nextValue.toFixed(2),
          status: Number(nextQuantity) > 0 ? "pending" : "received",
        })
        .where(
          and(
            eq(Stock.uuid, input.stockUuid),
            eq(Stock.quantity, stockRow.quantity),
          ),
        );

      if (updateResult.affectedRows === 0) {
        throw new Error(
          "Stock changed while applying this correction — please refresh and try again.",
        );
      }

      await tx.insert(StockMovements).values({
        uuid: generateUuid(),
        productUuid: stockRow.productUuid,
        stockUuid: input.stockUuid,
        type: input.direction,
        reason: input.reason,
        quantity: input.quantity,
        note: input.note || null,
        createdByUserId: userId,
      });

      await recordFreightMovement(tx, {
        productUuid: stockRow.productUuid,
        quantity: input.quantity,
        type: input.direction,
        reason: input.reason,
        note: input.note || null,
        valuationPrice: stockRow.valuationPrice,
        operator: userId,
      });

      // Every other inventory movement has a document on the other side. This
      // one does not: material appearing or vanishing off the back of a count is
      // a gain or a loss the moment it is recorded, so it goes straight to the
      // result rather than waiting for paperwork that will never come.
      const valueChange = nextValue - previousValue;

      if (Math.abs(valueChange) >= 0.005) {
        await tx.insert(JournalEntries).values(
          buildInventoryMovementEntry({
            bookingDate: todayDateString(),
            documentNo: null,
            description: `Stock correction — ${STOCK_MOVEMENT_REASON_LABELS[input.reason]}`,
            companyUuid: null,
            debCreditor: null,
            inventoryValue: valueChange,
            counterAccount: LEDGER_ACCOUNTS.inventoryDifferences,
            reference: `Stock lot ${input.stockUuid}`,
            userId,
          }),
        );
      }
    });

    revalidatePath("/stock");
    revalidatePath("/stock-movements");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to apply stock correction",
    };
  }
};

export const getStockDetail = async (
  uuid: string,
): Promise<StockDetail | null> => {
  const [stockRow] = await db
    .select({
      ...getTableColumns(Stock),
      productCode: Products.productCode,
      productName: Products.name,
      companyName: Companies.companyName,
      purchaseOrderId: PurchaseOrders.id,
      originalQuantity: PurchaseOrderItems.quantity,
    })
    .from(Stock)
    .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
    .leftJoin(Companies, eq(Products.companyUuid, Companies.uuid))
    .leftJoin(PurchaseOrders, eq(Stock.purchaseOrderUuid, PurchaseOrders.uuid))
    .leftJoin(
      PurchaseOrderItems,
      eq(Stock.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
    )
    .where(eq(Stock.uuid, uuid))
    .limit(1);

  if (!stockRow) {
    return null;
  }

  const movements = await db
    .select()
    .from(StockMovements)
    .where(eq(StockMovements.stockUuid, uuid))
    .orderBy(desc(StockMovements.createdAt));

  return { ...stockRow, movements };
};
