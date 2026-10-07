"use server";

import { db } from "@/db";
import { Companies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { Products } from "@/db/schema/products";
import {
  ProductionWorkOrderLines,
  ProductionWorkOrders,
} from "@/db/schema/production-work-orders";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { Warehouses } from "@/db/schema/warehouses";
import {
  WarehouseWorkOrderLines,
  WarehouseWorkOrderPicks,
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import { COMBINED_WORK_ORDER_COLUMNS } from "@/app/(dashboard)/warehouse-and-production-workorders/columns";
import {
  describeError,
  timestampFromDriver,
  weightDeviationPercent,
} from "@/lib/helpers";
import { getClerkUserNames } from "@/lib/server/clerk";
import { exportRows } from "@/lib/server/excel";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { and, count, eq, like, or, SQL, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

// Each line is placed on the yard twice: the subsection its source location
// hangs under, and the warehouse that subsection belongs to.
const WSection = alias(Warehouses, "w_section");
const WFrom = alias(Warehouses, "w_from");
const WFromParent = alias(Warehouses, "w_from_parent");
const WTo = alias(Warehouses, "w_to");
const WToParent = alias(Warehouses, "w_to_parent");
const PFrom = alias(Warehouses, "p_from");
const PFromParent = alias(Warehouses, "p_from_parent");
const PFromRoot = alias(Warehouses, "p_from_root");
const WAddress = alias(CompanyAddresses, "w_address");
const PAddress = alias(CompanyAddresses, "p_address");
const POrderItems = alias(OrderItems, "p_order_items");
const POrders = alias(Orders, "p_orders");
const PCompanies = alias(Companies, "p_companies");

/**
 * One line of `Warehouse- and production workorders` — both streams in one
 * list, as the reference prints it: 13 610 lines × 23 columns
 * (docs/reference-system/warehouse-and-production-workorders.md).
 */
export type CombinedWorkOrderLine = {
  uuid: string;
  kind: "warehouse" | "production";
  workOrderUuid: string;
  sectionName: string | null;
  subsectionName: string | null;
  releasedAt: Date | null;
  workOrderNumber: number;
  lineNumber: number | null;
  qtyPlanned: number;
  qtyActual: number;
  qtyUnit: string | null;
  kgPlanned: number;
  kgActual: number;
  workOrderType: string | null;
  workOrderDate: string | null;
  workOrderStatus: string | null;
  reportedAt: Date | null;
  companyName: string | null;
  companyCity: string | null;
  orderNumber: number | null;
  modifiedByUserId: string | null;
  /** Resolved from Clerk, not a column. */
  modifiedByName: string | null;
  weightDeviation: number;
};

const dateWindow = (query: TableQuery) => {
  const [from, to] = (query.filters.workOrderDate?.[0] ?? "").split("..");
  return { from: from || null, to: to || null };
};

const term = (query: TableQuery) => (query.q ? `%${query.q.trim()}%` : null);

const warehouseWhere = (query: TableQuery): SQL | undefined => {
  const { from, to } = dateWindow(query);
  const text = term(query);
  return and(
    query.filters.kind?.[0] === "production" ? sql`FALSE` : undefined,
    from ? sql`${WarehouseWorkOrders.plannedDate} >= ${from}` : undefined,
    to ? sql`${WarehouseWorkOrders.plannedDate} <= ${to}` : undefined,
    text
      ? or(
          like(WarehouseWorkOrderLines.productCode, text),
          like(Companies.companyName, text),
          sql`CAST(${WarehouseWorkOrders.number} AS CHAR) LIKE ${text}`,
        )
      : undefined,
  );
};

const productionWhere = (query: TableQuery): SQL | undefined => {
  const { from, to } = dateWindow(query);
  const text = term(query);
  return and(
    query.filters.kind?.[0] === "warehouse" ? sql`FALSE` : undefined,
    from ? sql`${ProductionWorkOrders.plannedDate} >= ${from}` : undefined,
    to ? sql`${ProductionWorkOrders.plannedDate} <= ${to}` : undefined,
    text
      ? or(
          like(ProductionWorkOrderLines.productCode, text),
          like(PCompanies.companyName, text),
          sql`CAST(${ProductionWorkOrders.number} AS CHAR) LIKE ${text}`,
        )
      : undefined,
  );
};

const warehouseSelect = (query: TableQuery) =>
  db
    .select({
      uuid: sql<string>`${WarehouseWorkOrderLines.uuid}`.as("uuid"),
      kind: sql<CombinedWorkOrderLine["kind"]>`'warehouse'`.as("kind"),
      workOrderUuid: sql<string>`${WarehouseWorkOrders.uuid}`.as("work_order_uuid"),
      sectionName: sql<string | null>`${WSection.name}`.as("section_name"),
      subsectionName: sql<
        string | null
      >`COALESCE(${WFromParent.name}, ${WToParent.name})`.as("subsection_name"),
      releasedAt: sql<Date | null>`${WarehouseWorkOrders.releasedAt}`.as("released_at"),
      workOrderNumber: sql<number>`${WarehouseWorkOrders.number}`.as(
        "work_order_number",
      ),
      lineNumber: sql<number | null>`${WarehouseWorkOrderLines.lineNumber}`.as(
        "line_number",
      ),
      qtyPlanned: sql<number>`COALESCE(${WarehouseWorkOrderLines.qtyPlanned}, 0)`.as(
        "qty_planned",
      ),
      qtyActual: sql<number>`COALESCE(${WarehouseWorkOrderLines.qtyActual}, 0)`.as(
        "qty_actual",
      ),
      qtyUnit: sql<string | null>`${Products.stockUnit}`.as("qty_unit"),
      kgPlanned: sql<number>`COALESCE(${WarehouseWorkOrderLines.kgPlanned}, 0)`.as(
        "kg_planned",
      ),
      kgActual: sql<number>`COALESCE(${WarehouseWorkOrderLines.kgActual}, 0)`.as(
        "kg_actual",
      ),
      workOrderType: sql<string | null>`${WarehouseWorkOrders.type}`.as(
        "work_order_type",
      ),
      workOrderDate: sql<string | null>`${WarehouseWorkOrders.plannedDate}`.as(
        "work_order_date",
      ),
      workOrderStatus: sql<string | null>`${WarehouseWorkOrderLines.status}`.as(
        "work_order_status",
      ),
      reportedAt: sql<Date | null>`(
        SELECT MAX(${WarehouseWorkOrderPicks.executedAt}) FROM ${WarehouseWorkOrderPicks}
        WHERE ${WarehouseWorkOrderPicks.workOrderLineUuid} = ${WarehouseWorkOrderLines.uuid}
      )`.as("reported_at"),
      companyName: sql<string | null>`${Companies.companyName}`.as("company_name"),
      companyCity: sql<string | null>`${WAddress.city}`.as("company_city"),
      orderNumber: sql<number | null>`COALESCE(${Orders.id}, ${PurchaseOrders.id})`.as(
        "order_number",
      ),
      modifiedByUserId: sql<
        string | null
      >`${WarehouseWorkOrderLines.modifiedByUserId}`.as("modified_by_user_id"),
    })
    .from(WarehouseWorkOrderLines)
    .innerJoin(
      WarehouseWorkOrders,
      eq(WarehouseWorkOrderLines.workOrderUuid, WarehouseWorkOrders.uuid),
    )
    .leftJoin(WSection, eq(WarehouseWorkOrders.warehouseUuid, WSection.uuid))
    .leftJoin(WFrom, eq(WarehouseWorkOrderLines.fromLocationUuid, WFrom.uuid))
    .leftJoin(WFromParent, eq(WFrom.parentUuid, WFromParent.uuid))
    .leftJoin(WTo, eq(WarehouseWorkOrderLines.toLocationUuid, WTo.uuid))
    .leftJoin(WToParent, eq(WTo.parentUuid, WToParent.uuid))
    .leftJoin(Products, eq(WarehouseWorkOrderLines.productUuid, Products.uuid))
    .leftJoin(Companies, eq(WarehouseWorkOrderLines.companyUuid, Companies.uuid))
    .leftJoin(OrderItems, eq(WarehouseWorkOrderLines.orderItemUuid, OrderItems.uuid))
    .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .leftJoin(WAddress, eq(Orders.deliveryAddressUuid, WAddress.uuid))
    .leftJoin(
      PurchaseOrderItems,
      eq(WarehouseWorkOrderLines.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
    )
    .leftJoin(
      PurchaseOrders,
      eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .where(warehouseWhere(query));

const productionSelect = (query: TableQuery) =>
  db
    .select({
      uuid: sql<string>`${ProductionWorkOrderLines.uuid}`.as("uuid"),
      kind: sql<CombinedWorkOrderLine["kind"]>`'production'`.as("kind"),
      workOrderUuid: sql<string>`${ProductionWorkOrders.uuid}`.as(
        "work_order_uuid",
      ),
      sectionName: sql<
        string | null
      >`COALESCE(${PFromRoot.name}, ${PFromParent.name})`.as("section_name"),
      subsectionName: sql<string | null>`${PFromParent.name}`.as("subsection_name"),
      releasedAt: sql<Date | null>`${ProductionWorkOrders.releasedAt}`.as(
        "released_at",
      ),
      workOrderNumber: sql<number>`${ProductionWorkOrders.number}`.as(
        "work_order_number",
      ),
      lineNumber: sql<number | null>`${ProductionWorkOrderLines.lineNumber}`.as(
        "line_number",
      ),
      qtyPlanned: sql<number>`COALESCE(${ProductionWorkOrderLines.qtyPlanned}, 0)`.as(
        "qty_planned",
      ),
      qtyActual: sql<number>`COALESCE(${ProductionWorkOrderLines.qtyActual}, 0)`.as(
        "qty_actual",
      ),
      qtyUnit: sql<string | null>`UPPER(${ProductionWorkOrderLines.unitPlanned})`.as(
        "qty_unit",
      ),
      kgPlanned: sql<number>`COALESCE(${ProductionWorkOrderLines.kgPlanned}, 0)`.as(
        "kg_planned",
      ),
      kgActual: sql<number>`COALESCE(${ProductionWorkOrderLines.kgActual}, 0)`.as(
        "kg_actual",
      ),
      // Blank on every production row of the reference: the type column
      // belongs to the warehouse stream.
      workOrderType: sql<string | null>`NULL`.as("work_order_type"),
      workOrderDate: sql<string | null>`${ProductionWorkOrders.plannedDate}`.as(
        "work_order_date",
      ),
      workOrderStatus: sql<string | null>`${ProductionWorkOrderLines.status}`.as(
        "work_order_status",
      ),
      reportedAt: sql<Date | null>`${ProductionWorkOrderLines.dateFinished}`.as(
        "reported_at",
      ),
      companyName: sql<string | null>`${PCompanies.companyName}`.as("company_name"),
      companyCity: sql<string | null>`${PAddress.city}`.as("company_city"),
      orderNumber: sql<number | null>`${POrders.id}`.as("order_number"),
      modifiedByUserId: sql<string | null>`NULL`.as("modified_by_user_id"),
    })
    .from(ProductionWorkOrderLines)
    .innerJoin(
      ProductionWorkOrders,
      eq(ProductionWorkOrderLines.workOrderUuid, ProductionWorkOrders.uuid),
    )
    .leftJoin(PFrom, eq(ProductionWorkOrderLines.fromLocationUuid, PFrom.uuid))
    .leftJoin(PFromParent, eq(PFrom.parentUuid, PFromParent.uuid))
    .leftJoin(PFromRoot, eq(PFromParent.parentUuid, PFromRoot.uuid))
    .leftJoin(PCompanies, eq(ProductionWorkOrderLines.companyUuid, PCompanies.uuid))
    .leftJoin(
      POrderItems,
      eq(ProductionWorkOrderLines.orderItemUuid, POrderItems.uuid),
    )
    .leftJoin(POrders, eq(POrderItems.orderUuid, POrders.uuid))
    .leftJoin(PAddress, eq(POrders.deliveryAddressUuid, PAddress.uuid))
    .where(productionWhere(query));

const SORTS: Record<string, string> = {
  workOrderDate: "work_order_date",
  workOrderNumber: "work_order_number",
  releasedAt: "released_at",
  workOrderStatus: "work_order_status",
};

const combinedRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<CombinedWorkOrderLine[]> => {
    const sortColumn = (query.sort && SORTS[query.sort]) || "work_order_date";
    const direction = query.sort ? (query.dir === "desc" ? "DESC" : "ASC") : "DESC";
    const rows = await warehouseSelect(query)
      .unionAll(productionSelect(query))
      .orderBy(
        sql.raw(
          `${sortColumn} ${direction}, work_order_number DESC, line_number ASC, uuid ASC`,
        ),
      )
      .limit(limit)
      .offset(offset);

    const names = rows.some((row) => row.modifiedByUserId)
      ? await getClerkUserNames()
      : {};

    return rows.map((row) => {
      const kgPlanned = Number(row.kgPlanned ?? 0);
      const kgActual = Number(row.kgActual ?? 0);
      const reported =
        row.workOrderStatus === "approved" || row.workOrderStatus === "ready";
      return {
        ...row,
        workOrderNumber: Number(row.workOrderNumber),
        lineNumber: row.lineNumber === null ? null : Number(row.lineNumber),
        qtyPlanned: Number(row.qtyPlanned ?? 0),
        qtyActual: Number(row.qtyActual ?? 0),
        kgPlanned,
        kgActual,
        orderNumber: row.orderNumber === null ? null : Number(row.orderNumber),
        workOrderDate: row.workOrderDate
          ? String(row.workOrderDate).slice(0, 10)
          : null,
        releasedAt: timestampFromDriver(row.releasedAt),
        reportedAt: timestampFromDriver(row.reportedAt),
        modifiedByName: row.modifiedByUserId
          ? (names[row.modifiedByUserId] ?? null)
          : null,
        // A magnitude, and only once the line has been reported — the
        // reference fills it on 965 of 13 610 lines.
        weightDeviation: reported ? weightDeviationPercent(kgPlanned, kgActual) : 0,
      };
    });
  };

const countCombined = async (query: TableQuery): Promise<number> => {
  const [warehouse] = await db
    .select({ value: count() })
    .from(WarehouseWorkOrderLines)
    .innerJoin(
      WarehouseWorkOrders,
      eq(WarehouseWorkOrderLines.workOrderUuid, WarehouseWorkOrders.uuid),
    )
    .leftJoin(Companies, eq(WarehouseWorkOrderLines.companyUuid, Companies.uuid))
    .where(warehouseWhere(query));
  const [production] = await db
    .select({ value: count() })
    .from(ProductionWorkOrderLines)
    .innerJoin(
      ProductionWorkOrders,
      eq(ProductionWorkOrderLines.workOrderUuid, ProductionWorkOrders.uuid),
    )
    .leftJoin(PCompanies, eq(ProductionWorkOrderLines.companyUuid, PCompanies.uuid))
    .where(productionWhere(query));
  return Number(warehouse?.value ?? 0) + Number(production?.value ?? 0);
};

export const getWarehouseAndProductionWorkOrders = async (
  query: TableQuery,
): Promise<Paged<CombinedWorkOrderLine>> => {
  try {
    const rows = await combinedRows(query)(
      query.pageSize,
      (query.page - 1) * query.pageSize,
    );
    const total = await countCombined(query);
    return { rows, total, page: query.page, pageSize: query.pageSize };
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch warehouse and production workorders"),
    );
  }
};

export const exportWarehouseAndProductionWorkOrders = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Warehouse- and production workorders",
    columns: COMBINED_WORK_ORDER_COLUMNS,
    columnKeys,
    rows: combinedRows(parseTableQuery(params)),
  });
