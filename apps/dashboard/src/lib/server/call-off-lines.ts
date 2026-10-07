import "server-only";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import {
  RevenueGroups,
  SelectRevenueGroups,
} from "@/db/schema/revenue-groups";
import { Stock } from "@/db/schema/stock";
import { orderLineStatuses } from "@/lib/enums";
import {
  dateRangeFilter,
  enumFilter,
  FilterBindings,
  relationFilter,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import { TableQuery } from "@/lib/table-query";
import { asc, count, eq, ne, notInArray, SQL, sql } from "drizzle-orm";
import { AnyMySqlColumn } from "drizzle-orm/mysql-core";

// The purchase orders whose lines are still to come in.
const OPEN_PURCHASE = sql.raw(
  "('released', 'checked', 'in_progress', 'partially_received')",
);

/** The customer's own city — its visiting address. */
const visiting = db
  .select({
    companyUuid: CompanyAddresses.companyUuid,
    city: sql<string | null>`MIN(${CompanyAddresses.city})`.as("call_off_city"),
  })
  .from(CompanyAddresses)
  .where(sql`JSON_CONTAINS(${CompanyAddresses.category}, '"visit"')`)
  .groupBy(CompanyAddresses.companyUuid)
  .as("call_off_visiting");

/**
 * One line of a `Call-off` order, as `Orders still to be called` (B14) prints
 * it — 49 columns — and `Order lines still to be called` (B13) prints 26 of.
 *
 * ⚠️ The reference's B14 grid joins each line to every open purchase line of
 * its product, so 691 rows cover 77 lines (540 byte-identical duplicates). Here
 * the product's stock and purchasing block is summed per product instead, one
 * row per line, so a money column can be added up.
 */
export type CallOffLineRow = {
  uuid: SelectOrderItems["uuid"];
  orderId: SelectOrders["id"];
  ourReference: SelectOrders["ourReference"];
  reference: SelectOrders["customerRef"];
  callOffFrom: SelectOrders["callOffPeriodFrom"];
  callOffTo: SelectOrders["callOffPeriodTo"];
  consignment: SelectOrders["isConsignment"];
  lineNumber: SelectOrderItems["lineNumber"];
  lineStatus: SelectOrderItems["lineStatus"];
  deliveryDate: SelectOrderItems["deliveryDate"];
  unit: SelectOrderItems["unit"];
  lengthMm: SelectOrderItems["lengthMm"];
  widthMm: SelectOrderItems["widthMm"];
  netPrice: SelectOrderItems["netPrice"];
  priceUnit: SelectOrderItems["priceUnit"];
  productCode: SelectProducts["productCode"];
  description: SelectProducts["name"];
  stockUnit: SelectProducts["stockUnit"];
  minStockMode: SelectProducts["minStockMode"];
  minStockMultiplier: SelectProducts["minStockMultiplier"];
  minStockFixedValue: SelectProducts["minStockFixedValue"];
  customerCode: SelectCompanies["id"];
  customerName: SelectCompanies["companyName"];
  representative: SelectCompanies["representative"];
  city: string | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  // Computed — the line's own figures and the product's position.
  quantity: number;
  weightKg: number;
  amount: number;
  deliveredQty: number;
  deliveredKg: number;
  consumptionLastYear: number;
  consumptionLastYearKg: number;
  consumptionLast3Months: number;
  consumptionLast3MonthsKg: number;
  consumptionLastMonth: number;
  consumptionLastMonthKg: number;
  stock: number;
  stockKg: number;
  reservedStock: number;
  onOrder: number;
  onOrderKg: number;
  dateOfArrival: string | null;
  purchasePrice: number | null;
  purchasePriceUnit: string | null;
  lastOrderDate: string | null;
};

export type CallOffScope = "open" | "all";

const SEARCH = [
  Products.productCode,
  Products.name,
  Companies.companyName,
  Orders.customerRef,
] as const;

const SORTABLE = {
  order: Orders.id,
  productCode: Products.productCode,
  customer: Companies.companyName,
  deliveryDate: OrderItems.deliveryDate,
};

const FILTERS: FilterBindings = {
  lineStatus: enumFilter(OrderItems.lineStatus, orderLineStatuses),
  customer: relationFilter(Orders.companyUuid),
  deliveryDate: dateRangeFilter(OrderItems.deliveryDate),
};

/**
 * Both screens list **call-off orders only** (14 and 15 orders in the
 * reference). B13 is the work list — lines not yet invoiced (`010`–`805`);
 * B14 is the history and keeps the invoiced ones too.
 */
const scopeOf = (scope: CallOffScope): SQL[] => [
  eq(Orders.orderType, "call_off"),
  ne(OrderItems.status, "cancelled"),
  ...(scope === "open"
    ? [notInArray(OrderItems.lineStatus, ["invoiced", "completed", "cancelled"])]
    : []),
];

/** Invoiced demand for the line's product over a trailing window. */
const consumption = (column: AnyMySqlColumn, window: SQL) =>
  sql<number>`(
    SELECT COALESCE(SUM(${column}), 0)
    FROM ${InvoiceItems}
    INNER JOIN ${Invoices} ON ${Invoices.uuid} = ${InvoiceItems.invoiceUuid}
    WHERE ${InvoiceItems.productUuid} = ${OrderItems.productUuid}
      AND ${window}
  )`.mapWith(Number);

const LAST_YEAR = sql`${Invoices.invoiceDate} >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)`;
const LAST_3_MONTHS = sql`${Invoices.invoiceDate} >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)`;
const LAST_MONTH = sql`${Invoices.invoiceDate} >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01') AND ${Invoices.invoiceDate} < DATE_FORMAT(CURDATE(), '%Y-%m-01')`;

const stockOf = (column: AnyMySqlColumn) =>
  sql<number>`(
    SELECT COALESCE(SUM(${column}), 0) FROM ${Stock}
    WHERE ${Stock.productUuid} = ${OrderItems.productUuid}
      AND ${Stock.status} = 'pending'
  )`.mapWith(Number);

const onOrderOf = (kilos: boolean) =>
  sql<number>`(
    SELECT COALESCE(SUM(${
      kilos
        ? sql`CASE WHEN ${PurchaseOrderItems.quantity} > 0 THEN ${PurchaseOrderItems.kgPurchased} * GREATEST(${PurchaseOrderItems.quantity} - COALESCE(${PurchaseOrderItems.qtyReceived}, 0), 0) / ${PurchaseOrderItems.quantity} ELSE 0 END`
        : sql`GREATEST(${PurchaseOrderItems.quantity} - COALESCE(${PurchaseOrderItems.qtyReceived}, 0), 0)`
    }), 0)
    FROM ${PurchaseOrderItems}
    INNER JOIN ${PurchaseOrders} ON ${PurchaseOrders.uuid} = ${PurchaseOrderItems.purchaseOrderUuid}
    WHERE ${PurchaseOrderItems.productUuid} = ${OrderItems.productUuid}
      AND ${PurchaseOrders.status} IN ${OPEN_PURCHASE}
  )`.mapWith(Number);

const whereOf = (query: TableQuery, scope: CallOffScope) =>
  tableWhere({ query, search: SEARCH, filters: FILTERS, scope: scopeOf(scope) });

export const callOffLineRows =
  (query: TableQuery, scope: CallOffScope) =>
  async (limit: number, offset: number): Promise<CallOffLineRow[]> => {
    const rows = await db
      .select({
        uuid: OrderItems.uuid,
        orderId: Orders.id,
        ourReference: Orders.ourReference,
        reference: Orders.customerRef,
        callOffFrom: Orders.callOffPeriodFrom,
        callOffTo: Orders.callOffPeriodTo,
        consignment: Orders.isConsignment,
        lineNumber: OrderItems.lineNumber,
        lineStatus: OrderItems.lineStatus,
        deliveryDate: OrderItems.deliveryDate,
        unit: OrderItems.unit,
        lengthMm: OrderItems.lengthMm,
        widthMm: OrderItems.widthMm,
        netPrice: OrderItems.netPrice,
        priceUnit: OrderItems.priceUnit,
        productCode: Products.productCode,
        description: Products.name,
        stockUnit: Products.stockUnit,
        minStockMode: Products.minStockMode,
        minStockMultiplier: Products.minStockMultiplier,
        minStockFixedValue: Products.minStockFixedValue,
        customerCode: Companies.id,
        customerName: Companies.companyName,
        representative: Companies.representative,
        city: visiting.city,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        quantity: sql<number>`COALESCE(${OrderItems.qtyPlanned}, ${OrderItems.quantity}, 0)`.mapWith(Number),
        weightKg: sql<number>`COALESCE(${OrderItems.kgPlanned}, 0)`.mapWith(Number),
        amount: sql<number>`COALESCE(${OrderItems.amount}, 0)`.mapWith(Number),
        deliveredQty: sql<number>`COALESCE(${OrderItems.qtyActual}, 0)`.mapWith(Number),
        deliveredKg: sql<number>`COALESCE(${OrderItems.kgActual}, 0)`.mapWith(Number),
        consumptionLastYear: consumption(InvoiceItems.quantity, LAST_YEAR),
        consumptionLastYearKg: consumption(InvoiceItems.weightKg, LAST_YEAR),
        consumptionLast3Months: consumption(InvoiceItems.quantity, LAST_3_MONTHS),
        consumptionLast3MonthsKg: consumption(InvoiceItems.weightKg, LAST_3_MONTHS),
        consumptionLastMonth: consumption(InvoiceItems.quantity, LAST_MONTH),
        consumptionLastMonthKg: consumption(InvoiceItems.weightKg, LAST_MONTH),
        stock: stockOf(Stock.quantity),
        stockKg: stockOf(Stock.quantityKg),
        reservedStock: stockOf(Stock.reservedQuantity),
        onOrder: onOrderOf(false),
        onOrderKg: onOrderOf(true),
        dateOfArrival: sql<string | null>`(
          SELECT MIN(${PurchaseOrders.deliveryDate})
          FROM ${PurchaseOrderItems}
          INNER JOIN ${PurchaseOrders} ON ${PurchaseOrders.uuid} = ${PurchaseOrderItems.purchaseOrderUuid}
          WHERE ${PurchaseOrderItems.productUuid} = ${OrderItems.productUuid}
            AND ${PurchaseOrders.status} IN ${OPEN_PURCHASE}
        )`,
        // The last price paid for the product, with its unit.
        purchasePrice: sql<number | null>`(
          SELECT ${PurchaseOrderItems.netPrice} FROM ${PurchaseOrderItems}
          WHERE ${PurchaseOrderItems.productUuid} = ${OrderItems.productUuid}
          ORDER BY ${PurchaseOrderItems.createdAt} DESC LIMIT 1
        )`,
        purchasePriceUnit: sql<string | null>`(
          SELECT ${PurchaseOrderItems.priceUnit} FROM ${PurchaseOrderItems}
          WHERE ${PurchaseOrderItems.productUuid} = ${OrderItems.productUuid}
          ORDER BY ${PurchaseOrderItems.createdAt} DESC LIMIT 1
        )`,
        lastOrderDate: sql<string | null>`(
          SELECT MAX(${sql.raw("`o2`.`created_at`")})
          FROM ${sql.raw("`OrderItems` AS `oi2`")}
          INNER JOIN ${sql.raw("`Orders` AS `o2` ON `o2`.`uuid` = `oi2`.`order_uuid`")}
          WHERE ${sql.raw("`oi2`.`product_uuid`")} = ${OrderItems.productUuid}
        )`,
      })
      .from(OrderItems)
      .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .innerJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .innerJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
      .leftJoin(visiting, eq(visiting.companyUuid, Companies.uuid))
      .where(whereOf(query, scope))
      .orderBy(
        ...tableOrderBy(
          SORTABLE,
          query,
          [asc(Orders.id), asc(OrderItems.lineNumber)],
          OrderItems.id,
        ),
      )
      .limit(limit)
      .offset(offset);
    return rows.map((row) => ({
      ...row,
      purchasePrice: row.purchasePrice === null ? null : Number(row.purchasePrice),
    }));
  };

export const countCallOffLines = async (
  query: TableQuery,
  scope: CallOffScope,
): Promise<number> => {
  const [row] = await db
    .select({ value: count() })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .innerJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .innerJoin(Products, eq(OrderItems.productUuid, Products.uuid))
    .where(whereOf(query, scope));
  return Number(row?.value ?? 0);
};
