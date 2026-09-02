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
import { describeError } from "@/lib/helpers";
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
import { count, desc, eq, getTableColumns } from "drizzle-orm";

export type StockListItem = SelectStock & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  companyName: SelectCompanies["companyName"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  originalQuantity: SelectPurchaseOrderItems["quantity"] | null;
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
