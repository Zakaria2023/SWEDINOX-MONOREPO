"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import {
  SelectStockMovements,
  StockMovements,
} from "@/db/schema/stock-movements";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import {
  PurchaseInvoices,
  SelectPurchaseInvoices,
} from "@/db/schema/purchase-invoices";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Invoices, SelectInvoices } from "@/db/schema/invoices";
import { SelectStock, Stock } from "@/db/schema/stock";
import { stockMovementReasons, stockMovementTypes } from "@/lib/enums";
import {
  dateRangeFilter,
  enumFilter,
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
import { STOCK_MOVEMENT_COLUMNS } from "@/app/(dashboard)/stock-movements/columns";
import { count, desc, eq, getTableColumns } from "drizzle-orm";

export type StockMovementListItem = SelectStockMovements & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  purchaseInvoiceId: SelectPurchaseInvoices["id"] | null;
  orderId: SelectOrders["id"] | null;
  invoiceId: SelectInvoices["id"] | null;
};

export type StockMovementDetail = SelectStockMovements & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  purchaseInvoiceId: SelectPurchaseInvoices["id"] | null;
  orderId: SelectOrders["id"] | null;
  invoiceId: SelectInvoices["id"] | null;
  stock: SelectStock | null;
};

const MOVEMENT_SEARCH = [
  Products.productCode,
  Products.name,
  StockMovements.note,
] as const;

const MOVEMENT_SORTABLE = {
  createdAt: StockMovements.createdAt,
  product: Products.productCode,
  type: StockMovements.type,
  reason: StockMovements.reason,
  quantity: StockMovements.quantity,
};

// Which way the stock went, why, and which article — the three questions asked
// of a movement list. reason and product_uuid are indexed already; type is
// indexed by this change, since "show me every issue" is the common narrowing
// and there are only two values to seek on.
const MOVEMENT_FILTERS = {
  type: enumFilter(StockMovements.type, stockMovementTypes),
  reason: enumFilter(StockMovements.reason, stockMovementReasons),
  product: relationFilter(StockMovements.productUuid),
  createdAt: dateRangeFilter(StockMovements.createdAt),
};

/**
 * The rows one view of the stock movements overview selects, as a window onto
 * them. Shared by the page and the export.
 */
const stockMovementRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<StockMovementListItem[]> =>
    db
      .select({
        ...getTableColumns(StockMovements),
        productCode: Products.productCode,
        productName: Products.name,
        purchaseOrderId: PurchaseOrders.id,
        purchaseInvoiceId: PurchaseInvoices.id,
        orderId: Orders.id,
        invoiceId: Invoices.id,
      })
      .from(StockMovements)
      .leftJoin(Products, eq(StockMovements.productUuid, Products.uuid))
      .leftJoin(
        PurchaseOrders,
        eq(StockMovements.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(
        PurchaseInvoices,
        eq(StockMovements.purchaseInvoiceUuid, PurchaseInvoices.uuid),
      )
      .leftJoin(Orders, eq(StockMovements.orderUuid, Orders.uuid))
      .leftJoin(Invoices, eq(StockMovements.invoiceUuid, Invoices.uuid))
      .where(
        tableWhere({
          query,
          search: MOVEMENT_SEARCH,
          filters: MOVEMENT_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          MOVEMENT_SORTABLE,
          query,
          [desc(StockMovements.createdAt)],
          StockMovements.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/** Every stock movement the current view matches, as a workbook. */
export const exportStockMovements = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Stock Movements",
    columns: STOCK_MOVEMENT_COLUMNS,
    columnKeys,
    rows: stockMovementRows(parseTableQuery(params)),
  });

export const getStockMovements = async (
  query: TableQuery,
): Promise<Paged<StockMovementListItem>> => {
  try {
    const where = tableWhere({
      query,
      search: MOVEMENT_SEARCH,
      filters: MOVEMENT_FILTERS,
    });

    return await runPaged(query, {
      rows: stockMovementRows(query),

      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(StockMovements)
          .leftJoin(Products, eq(StockMovements.productUuid, Products.uuid))
          .where(where);
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch stock movements"));
  }
};

export const getStockMovementDetail = async (
  uuid: string,
): Promise<StockMovementDetail | null> => {
  const [movement] = await db
    .select({
      ...getTableColumns(StockMovements),
      productCode: Products.productCode,
      productName: Products.name,
      purchaseOrderId: PurchaseOrders.id,
      purchaseInvoiceId: PurchaseInvoices.id,
      orderId: Orders.id,
      invoiceId: Invoices.id,
    })
    .from(StockMovements)
    .leftJoin(Products, eq(StockMovements.productUuid, Products.uuid))
    .leftJoin(
      PurchaseOrders,
      eq(StockMovements.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .leftJoin(
      PurchaseInvoices,
      eq(StockMovements.purchaseInvoiceUuid, PurchaseInvoices.uuid),
    )
    .leftJoin(Orders, eq(StockMovements.orderUuid, Orders.uuid))
    .leftJoin(Invoices, eq(StockMovements.invoiceUuid, Invoices.uuid))
    .where(eq(StockMovements.uuid, uuid))
    .limit(1);

  if (!movement) {
    return null;
  }

  const [stock] = await db
    .select()
    .from(Stock)
    .where(eq(Stock.uuid, movement.stockUuid))
    .limit(1);

  return { ...movement, stock: stock ?? null };
};
