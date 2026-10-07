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
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  RevenueGroups,
  SelectRevenueGroups,
} from "@/db/schema/revenue-groups";
import {
  SelectWarehouseWorkOrders,
  WarehouseWorkOrderLines,
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import {
  ProductionWorkOrderLines,
  ProductionWorkOrders,
  SelectProductionWorkOrders,
} from "@/db/schema/production-work-orders";
import {
  SelectTransportWorkOrders,
  TransportWorkOrders,
} from "@/db/schema/transport-work-orders";
import { getClerkUserNames } from "@/lib/server/clerk";
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
import { count, desc, eq, getTableColumns, SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

// A movement names up to four companies at one remove — the order's customer,
// the purchase order's supplier, and the supplier and purchase order the steel
// originally came in on — so the tables are joined under their own names.
const OrderCompany = alias(Companies, "order_company");
const PurchaseSupplier = alias(Companies, "purchase_supplier");
const OriginSupplier = alias(Companies, "origin_supplier");
const OriginPurchaseOrder = alias(PurchaseOrders, "origin_purchase_order");
const LedgerMovements = alias(StockMovements, "ledger_movements");

/**
 * One row of `Stock mutations`, carrying every column the reference prints
 * (36, captured 9-9-2026 — see docs/reference-system/stock-mutations.md).
 */
export type StockMovementListItem = SelectStockMovements & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  purchaseInvoiceId: SelectPurchaseInvoices["id"] | null;
  orderId: SelectOrders["id"] | null;
  invoiceId: SelectInvoices["id"] | null;
  stockUnit: SelectProducts["stockUnit"] | null;
  standardProduct: SelectProducts["standardProduct"] | null;
  stockProduct: SelectProducts["stockProduct"] | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  lengthMm: SelectStock["lengthMm"] | null;
  widthMm: SelectStock["widthMm"] | null;
  charge: SelectStock["charge"] | null;
  internalCharge: SelectStock["internalCharge"] | null;
  internalBatch: SelectStock["internalBatch"] | null;
  receiptDate: SelectStock["receiptDate"] | null;
  warehouseWorkOrderNumber: SelectWarehouseWorkOrders["number"] | null;
  productionWorkOrderNumber: SelectProductionWorkOrders["number"] | null;
  tripNumber: SelectTransportWorkOrders["tripNumber"] | null;
  companyCode: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  originPurchaseOrderId: SelectPurchaseOrders["id"] | null;
  originSupplierName: SelectCompanies["companyName"] | null;
  /** The product's position at the two ends of the date filter — computed. */
  startingQty: number;
  startingKg: number;
  startingValue: number;
  closingQty: number;
  closingKg: number;
  closingValue: number;
  /** The Clerk user who booked it, by name — resolved, not a column. */
  operatorName: string | null;
  /** The filter window the balances are taken over. */
  startDate: string | null;
  endDate: string | null;
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
 * The product's balance up to a point, as the sum of its signed movements.
 *
 * The reference repeats `Starting stock` and `Closing stock` on every row of a
 * product: its position at the two ends of the filter window, not a running
 * total (733 of 735 products close exactly, 9-9-2026). Out is negative, in is
 * positive; an `adjust` row changes an attribute and carries no quantity.
 */
const balanceUpTo = (
  measure: "quantity" | "quantityKg" | "valueEur",
  bound: SQL | undefined,
) => {
  const column = LedgerMovements[measure];
  return sql<number>`(
    SELECT COALESCE(SUM(CASE WHEN ${LedgerMovements.type} = 'out' THEN -1 ELSE 1 END * COALESCE(${column}, 0)), 0)
    FROM ${sql.raw("`StockMovements` AS `ledger_movements`")}
    WHERE ${LedgerMovements.productUuid} = ${StockMovements.productUuid}
    ${bound ? sql`AND ${bound}` : sql``}
  )`.mapWith(Number);
};

/** The two ends of the `Moved` filter, as typed — `from..to`. */
const filterWindow = (query: TableQuery) => {
  const [from, to] = (query.filters.createdAt?.[0] ?? "").split("..");
  return { from: from || null, to: to || null };
};

/**
 * The rows one view of the stock movements overview selects, as a window onto
 * them. Shared by the page and the export.
 */
const stockMovementRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<StockMovementListItem[]> => {
    const { from, to } = filterWindow(query);
    const before = from
      ? sql`${LedgerMovements.createdAt} < ${new Date(from)}`
      : undefined;
    const upTo = to
      ? sql`${LedgerMovements.createdAt} <= ${new Date(`${to}T23:59:59`)}`
      : undefined;
    const rows = await db
      .select({
        ...getTableColumns(StockMovements),
        productCode: Products.productCode,
        productName: Products.name,
        purchaseOrderId: PurchaseOrders.id,
        purchaseInvoiceId: PurchaseInvoices.id,
        orderId: Orders.id,
        invoiceId: Invoices.id,
        stockUnit: Products.stockUnit,
        standardProduct: Products.standardProduct,
        stockProduct: Products.stockProduct,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        lengthMm: Stock.lengthMm,
        widthMm: Stock.widthMm,
        charge: Stock.charge,
        internalCharge: Stock.internalCharge,
        internalBatch: Stock.internalBatch,
        receiptDate: Stock.receiptDate,
        warehouseWorkOrderNumber: WarehouseWorkOrders.number,
        productionWorkOrderNumber: ProductionWorkOrders.number,
        tripNumber: TransportWorkOrders.tripNumber,
        companyCode: sql<number | null>`COALESCE(${OrderCompany.id}, ${PurchaseSupplier.id})`,
        companyName: sql<
          string | null
        >`COALESCE(${OrderCompany.companyName}, ${PurchaseSupplier.companyName})`,
        originPurchaseOrderId: OriginPurchaseOrder.id,
        originSupplierName: OriginSupplier.companyName,
        startingQty: from ? balanceUpTo("quantity", before) : sql<number>`0`.mapWith(Number),
        startingKg: from ? balanceUpTo("quantityKg", before) : sql<number>`0`.mapWith(Number),
        startingValue: from ? balanceUpTo("valueEur", before) : sql<number>`0`.mapWith(Number),
        closingQty: balanceUpTo("quantity", upTo),
        closingKg: balanceUpTo("quantityKg", upTo),
        closingValue: balanceUpTo("valueEur", upTo),
      })
      .from(StockMovements)
      .leftJoin(Products, eq(StockMovements.productUuid, Products.uuid))
      .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
      .leftJoin(Stock, eq(StockMovements.stockUuid, Stock.uuid))
      .leftJoin(
        WarehouseWorkOrderLines,
        eq(StockMovements.warehouseWorkOrderLineUuid, WarehouseWorkOrderLines.uuid),
      )
      .leftJoin(
        WarehouseWorkOrders,
        eq(WarehouseWorkOrderLines.workOrderUuid, WarehouseWorkOrders.uuid),
      )
      .leftJoin(
        ProductionWorkOrderLines,
        eq(StockMovements.productionWorkOrderLineUuid, ProductionWorkOrderLines.uuid),
      )
      .leftJoin(
        ProductionWorkOrders,
        eq(ProductionWorkOrderLines.workOrderUuid, ProductionWorkOrders.uuid),
      )
      .leftJoin(
        TransportWorkOrders,
        eq(StockMovements.transportWorkOrderUuid, TransportWorkOrders.uuid),
      )
      .leftJoin(
        OriginPurchaseOrder,
        eq(StockMovements.originPurchaseOrderUuid, OriginPurchaseOrder.uuid),
      )
      .leftJoin(
        OriginSupplier,
        eq(StockMovements.originSupplierUuid, OriginSupplier.uuid),
      )
      .leftJoin(
        PurchaseOrders,
        eq(StockMovements.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(
        PurchaseInvoices,
        eq(StockMovements.purchaseInvoiceUuid, PurchaseInvoices.uuid),
      )
      .leftJoin(Orders, eq(StockMovements.orderUuid, Orders.uuid))
      .leftJoin(OrderCompany, eq(Orders.companyUuid, OrderCompany.uuid))
      .leftJoin(
        PurchaseSupplier,
        eq(PurchaseOrders.supplierUuid, PurchaseSupplier.uuid),
      )
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

    const names = rows.some((row) => row.createdByUserId)
      ? await getClerkUserNames()
      : {};
    return rows.map((row) => ({
      ...row,
      operatorName: row.createdByUserId
        ? (names[row.createdByUserId] ?? null)
        : null,
      startDate: from,
      endDate: to,
    }));
  };

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
