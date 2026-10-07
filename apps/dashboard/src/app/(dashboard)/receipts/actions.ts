"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { PurchaseLineReceivals } from "@/db/schema/purchase-line-receivals";
import { Companies } from "@/db/schema/companies";
import { ProductGroups } from "@/db/schema/product-groups";
import { Products } from "@/db/schema/products";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { RevenueGroups } from "@/db/schema/revenue-groups";
import { ReturnOrderItems } from "@/db/schema/return-order-items";
import { ReturnOrders } from "@/db/schema/return-orders";
import {
  WarehouseWorkOrderLines,
  WarehouseWorkOrderPicks,
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import { Warehouses } from "@/db/schema/warehouses";
import { RECEIPT_COLUMNS } from "@/app/(dashboard)/receipts/columns";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { exportRows } from "@/lib/server/excel";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { and, count, eq, like, or, SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

const ParentGroups = alias(ProductGroups, "parent_groups");
const ReturnCompanies = alias(Companies, "return_companies");

/**
 * One receipt on `Overviews → Logistics → Receipts` — one lorry's worth of
 * one line (docs/reference-system/receipts.md), with all 22 columns of the
 * reference's export.
 *
 * Two kinds, as there: goods from a supplier (`Purchase order`, 3 026 rows)
 * and goods a customer sent back (`Return`, 62). The first is a purchase
 * reception; the second an approved unloading against a return line.
 */
export type ReceiptRow = {
  uuid: string;
  orderType: "Purchase order" | "Return";
  sectionName: string | null;
  mainGroup: string | null;
  subGroup: string | null;
  productCode: string | null;
  productName: string | null;
  companyCode: number | null;
  companyName: string | null;
  companyCity: string | null;
  completedOn: string | null;
  qty: number;
  unit: string | null;
  deliverDays: number | null;
  kg: number;
  orderNumber: string | null;
  orderLine: number | null;
  receiptStatus: string | null;
  lineStatus: string | null;
  revenueGroupNumber: number | null;
  revenueGroupName: string | null;
  netPrice: number | null;
  priceUnit: string | null;
};

const visiting = companyAddressFor("visit", "receipt_visiting");

/** The day typed in the `Date reported as completed` filter, as two ends. */
const dateWindow = (query: TableQuery) => {
  const [from, to] = (query.filters.completedOn?.[0] ?? "").split("..");
  return { from: from || null, to: to || null };
};

const term = (query: TableQuery) => (query.q ? `%${query.q.trim()}%` : null);

const purchaseWhere = (query: TableQuery): SQL | undefined => {
  const { from, to } = dateWindow(query);
  const text = term(query);
  return and(
    from ? sql`${PurchaseLineReceivals.receiptDate} >= ${from}` : undefined,
    to ? sql`${PurchaseLineReceivals.receiptDate} <= ${to}` : undefined,
    text
      ? or(
          like(Products.productCode, text),
          like(Products.name, text),
          like(Companies.companyName, text),
          like(PurchaseLineReceivals.purchaseOrderCode, text),
        )
      : undefined,
    query.filters.orderType?.[0] === "return" ? sql`FALSE` : undefined,
  );
};

const returnDate = sql`(
  SELECT DATE(MAX(${WarehouseWorkOrderPicks.executedAt})) FROM ${WarehouseWorkOrderPicks}
  WHERE ${WarehouseWorkOrderPicks.workOrderLineUuid} = ${WarehouseWorkOrderLines.uuid}
)`;

const returnWhere = (query: TableQuery): SQL | undefined => {
  const { from, to } = dateWindow(query);
  const text = term(query);
  return and(
    sql`${WarehouseWorkOrderLines.returnOrderItemUuid} IS NOT NULL`,
    eq(WarehouseWorkOrders.type, "unloading"),
    eq(WarehouseWorkOrderLines.status, "approved"),
    from ? sql`${returnDate} >= ${from}` : undefined,
    to ? sql`${returnDate} <= ${to}` : undefined,
    text
      ? or(
          like(Products.productCode, text),
          like(Products.name, text),
          like(ReturnCompanies.companyName, text),
        )
      : undefined,
    query.filters.orderType?.[0] === "purchase" ? sql`FALSE` : undefined,
  );
};

const mainGroup = sql<string | null>`COALESCE(${ParentGroups.name}, ${ProductGroups.name})`;
const subGroup = sql<
  string | null
>`CASE WHEN ${ParentGroups.uuid} IS NULL THEN NULL ELSE ${ProductGroups.name} END`;

const purchaseSelect = (query: TableQuery) =>
  db
    .select({
      uuid: sql<string>`${PurchaseLineReceivals.uuid}`.as("uuid"),
      orderType: sql<ReceiptRow["orderType"]>`'Purchase order'`.as("order_type"),
      // The warehouse the unloading booked it into.
      sectionName: sql<string | null>`(
        SELECT MAX(${Warehouses.name}) FROM ${WarehouseWorkOrderLines}
        INNER JOIN ${WarehouseWorkOrders} ON ${WarehouseWorkOrders.uuid} = ${WarehouseWorkOrderLines.workOrderUuid}
        INNER JOIN ${Warehouses} ON ${Warehouses.uuid} = ${WarehouseWorkOrders.warehouseUuid}
        WHERE ${WarehouseWorkOrderLines.purchaseOrderItemUuid} = ${PurchaseLineReceivals.purchaseOrderItemUuid}
      )`.as("section_name"),
      mainGroup: mainGroup.as("main_group"),
      subGroup: subGroup.as("sub_group"),
      productCode: sql<string | null>`${Products.productCode}`.as("product_code"),
      productName: sql<string | null>`${Products.name}`.as("product_name"),
      companyCode: sql<number | null>`${Companies.id}`.as("company_code"),
      companyName: sql<string | null>`${Companies.companyName}`.as("company_name"),
      companyCity: sql<string | null>`${visiting.city}`.as("company_city"),
      completedOn: sql<string | null>`${PurchaseLineReceivals.receiptDate}`.as(
        "completed_on",
      ),
      qty: sql<number>`COALESCE(NULLIF(${PurchaseLineReceivals.receivedQty}, 0), ${PurchaseLineReceivals.qtyActual}, 0)`.as("qty"),
      unit: sql<string | null>`UPPER(${PurchaseLineReceivals.unit})`.as("unit"),
      // Days from ordering to the goods landing.
      deliverDays: sql<number | null>`DATEDIFF(${PurchaseLineReceivals.receiptDate}, ${PurchaseOrders.orderDate})`.as(
        "deliver_days",
      ),
      kg: sql<number>`COALESCE(${PurchaseLineReceivals.kgActual}, 0)`.as("kg"),
      orderNumber: sql<string | null>`${PurchaseLineReceivals.purchaseOrderCode}`.as(
        "order_number",
      ),
      orderLine: sql<number | null>`${PurchaseLineReceivals.lineNumber} * 10`.as(
        "order_line",
      ),
      receiptStatus: sql<string | null>`${PurchaseLineReceivals.receiptStatus}`.as(
        "receipt_status",
      ),
      lineStatus: sql<string | null>`${PurchaseLineReceivals.lineStatus}`.as(
        "line_status",
      ),
      revenueGroupNumber: sql<number | null>`${RevenueGroups.number}`.as(
        "revenue_group_number",
      ),
      revenueGroupName: sql<string | null>`${RevenueGroups.name}`.as(
        "revenue_group_name",
      ),
      netPrice: sql<number | null>`${PurchaseOrderItems.netPrice}`.as("net_price"),
      priceUnit: sql<string | null>`${PurchaseOrderItems.priceUnit}`.as("price_unit"),
    })
    .from(PurchaseLineReceivals)
    .leftJoin(Companies, eq(PurchaseLineReceivals.companyUuid, Companies.uuid))
    .leftJoin(visiting, eq(visiting.companyUuid, Companies.uuid))
    .leftJoin(Products, eq(PurchaseLineReceivals.productUuid, Products.uuid))
    .leftJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
    .leftJoin(ParentGroups, eq(ProductGroups.parentUuid, ParentGroups.uuid))
    .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
    .leftJoin(
      PurchaseOrderItems,
      eq(PurchaseLineReceivals.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
    )
    .leftJoin(
      PurchaseOrders,
      eq(PurchaseLineReceivals.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .where(purchaseWhere(query));

const returnSelect = (query: TableQuery) =>
  db
    .select({
      uuid: sql<string>`${WarehouseWorkOrderLines.uuid}`.as("uuid"),
      orderType: sql<ReceiptRow["orderType"]>`'Return'`.as("order_type"),
      sectionName: sql<string | null>`${Warehouses.name}`.as("section_name"),
      mainGroup: mainGroup.as("main_group"),
      subGroup: subGroup.as("sub_group"),
      productCode: sql<string | null>`${Products.productCode}`.as("product_code"),
      productName: sql<string | null>`${Products.name}`.as("product_name"),
      companyCode: sql<number | null>`${ReturnCompanies.id}`.as("company_code"),
      companyName: sql<string | null>`${ReturnCompanies.companyName}`.as(
        "company_name",
      ),
      companyCity: sql<string | null>`${visiting.city}`.as("company_city"),
      completedOn: sql<string | null>`${returnDate}`.as("completed_on"),
      qty: sql<number>`COALESCE(${WarehouseWorkOrderLines.qtyActual}, 0)`.as("qty"),
      unit: sql<string | null>`UPPER(${ReturnOrderItems.unit})`.as("unit"),
      deliverDays: sql<number | null>`NULL`.as("deliver_days"),
      kg: sql<number>`COALESCE(${WarehouseWorkOrderLines.kgActual}, 0)`.as("kg"),
      orderNumber: sql<string | null>`CONCAT('R', ${ReturnOrders.id})`.as(
        "order_number",
      ),
      orderLine: sql<number | null>`${ReturnOrderItems.lineNumber}`.as("order_line"),
      receiptStatus: sql<string | null>`'received'`.as("receipt_status"),
      lineStatus: sql<string | null>`${ReturnOrderItems.lineStatus}`.as("line_status"),
      revenueGroupNumber: sql<number | null>`${RevenueGroups.number}`.as(
        "revenue_group_number",
      ),
      revenueGroupName: sql<string | null>`${RevenueGroups.name}`.as(
        "revenue_group_name",
      ),
      netPrice: sql<number | null>`NULL`.as("net_price"),
      priceUnit: sql<string | null>`NULL`.as("price_unit"),
    })
    .from(WarehouseWorkOrderLines)
    .innerJoin(
      WarehouseWorkOrders,
      eq(WarehouseWorkOrderLines.workOrderUuid, WarehouseWorkOrders.uuid),
    )
    .leftJoin(Warehouses, eq(WarehouseWorkOrders.warehouseUuid, Warehouses.uuid))
    .innerJoin(
      ReturnOrderItems,
      eq(WarehouseWorkOrderLines.returnOrderItemUuid, ReturnOrderItems.uuid),
    )
    .leftJoin(ReturnOrders, eq(ReturnOrderItems.returnOrderUuid, ReturnOrders.uuid))
    .leftJoin(ReturnCompanies, eq(ReturnOrders.companyUuid, ReturnCompanies.uuid))
    .leftJoin(visiting, eq(visiting.companyUuid, ReturnCompanies.uuid))
    .leftJoin(Products, eq(WarehouseWorkOrderLines.productUuid, Products.uuid))
    .leftJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
    .leftJoin(ParentGroups, eq(ProductGroups.parentUuid, ParentGroups.uuid))
    .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
    .where(returnWhere(query));

const SORTS: Record<string, string> = {
  completedOn: "completed_on",
  companyName: "company_name",
  productCode: "product_code",
  orderNumber: "order_number",
  kg: "kg",
};

const receiptRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<ReceiptRow[]> => {
    const sortColumn = (query.sort && SORTS[query.sort]) || "completed_on";
    const direction = query.sort ? (query.dir === "desc" ? "DESC" : "ASC") : "DESC";
    const rows = await purchaseSelect(query)
      .unionAll(returnSelect(query))
      .orderBy(sql.raw(`${sortColumn} ${direction}, uuid ASC`))
      .limit(limit)
      .offset(offset);
    return rows.map((row) => ({
      ...row,
      qty: Number(row.qty ?? 0),
      kg: Number(row.kg ?? 0),
      companyCode: row.companyCode === null ? null : Number(row.companyCode),
      deliverDays: row.deliverDays === null ? null : Number(row.deliverDays),
      orderLine: row.orderLine === null ? null : Number(row.orderLine),
      revenueGroupNumber:
        row.revenueGroupNumber === null ? null : Number(row.revenueGroupNumber),
      netPrice: row.netPrice === null ? null : Number(row.netPrice),
      completedOn: row.completedOn ? String(row.completedOn).slice(0, 10) : null,
    }));
  };

const countReceipts = async (query: TableQuery): Promise<number> => {
  const [purchase] = await db
    .select({ value: count() })
    .from(PurchaseLineReceivals)
    .leftJoin(Companies, eq(PurchaseLineReceivals.companyUuid, Companies.uuid))
    .leftJoin(Products, eq(PurchaseLineReceivals.productUuid, Products.uuid))
    .where(purchaseWhere(query));
  const [returned] = await db
    .select({ value: count() })
    .from(WarehouseWorkOrderLines)
    .innerJoin(
      WarehouseWorkOrders,
      eq(WarehouseWorkOrderLines.workOrderUuid, WarehouseWorkOrders.uuid),
    )
    .innerJoin(
      ReturnOrderItems,
      eq(WarehouseWorkOrderLines.returnOrderItemUuid, ReturnOrderItems.uuid),
    )
    .leftJoin(ReturnOrders, eq(ReturnOrderItems.returnOrderUuid, ReturnOrders.uuid))
    .leftJoin(ReturnCompanies, eq(ReturnOrders.companyUuid, ReturnCompanies.uuid))
    .leftJoin(Products, eq(WarehouseWorkOrderLines.productUuid, Products.uuid))
    .where(returnWhere(query));
  return Number(purchase?.value ?? 0) + Number(returned?.value ?? 0);
};

/** Goods received, one row per reception, paged in SQL. */
export const getReceipts = async (
  query: TableQuery,
): Promise<Paged<ReceiptRow>> => {
  try {
    const rows = await receiptRows(query)(
      query.pageSize,
      (query.page - 1) * query.pageSize,
    );
    const total = await countReceipts(query);
    return { rows, total, page: query.page, pageSize: query.pageSize };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch receipts"));
  }
};

export const exportReceipts = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Receipts",
    columns: RECEIPT_COLUMNS,
    columnKeys,
    rows: receiptRows(parseTableQuery(params)),
  });
