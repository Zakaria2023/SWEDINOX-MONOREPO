"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  CompanyAddresses,
  SelectCompanyAddresses,
} from "@/db/schema/company-addresses";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { PurchaseLineReceivals } from "@/db/schema/purchase-line-receivals";
import { SelectStock, Stock } from "@/db/schema/stock";
import {
  SelectTransportWorkOrderLines,
  SelectTransportWorkOrders,
  TransportWorkOrderLines,
  TransportWorkOrders,
} from "@/db/schema/transport-work-orders";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import {
  SelectWarehouseWorkOrderLines,
  SelectWarehouseWorkOrders,
  WarehouseWorkOrderLines,
  WarehouseWorkOrderPicks,
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import { WAREHOUSE_WORK_ORDER_LINE_COLUMNS } from "@/app/(dashboard)/warehouse-work-order-lines/columns";
import { warehouseWorkOrderTypes, workOrderStatuses } from "@/lib/enums";
import { describeError, timestampFromDriver } from "@/lib/helpers";
import { getClerkUserNames } from "@/lib/server/clerk";
import { exportRows } from "@/lib/server/excel";
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
import { count, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

// A line names two locations and the warehouse its job belongs to, all rows of
// one table.
const FromLocation = alias(Warehouses, "from_location");
const ToLocation = alias(Warehouses, "to_location");
const Section = alias(Warehouses, "section");

/**
 * One row of `Overviews → Logistics → Warehouse workorders`: a work-order
 * **line**, with its job's identity repeated on it — the reference's grain,
 * 11 625 rows over 1-1-2024…8-9-2026 (docs/reference-system/warehouse-workorders.md).
 *
 * The shop floor's own screen (`/warehouse-work-orders`) is a tree of the same
 * lines to be worked; this is the flat list to be read and exported.
 */
export type WarehouseWorkOrderLineRow = SelectWarehouseWorkOrderLines & {
  workOrderNumber: SelectWarehouseWorkOrders["number"];
  workOrderType: SelectWarehouseWorkOrders["type"];
  workOrderDate: SelectWarehouseWorkOrders["plannedDate"];
  workOrderCreatedAt: SelectWarehouseWorkOrders["createdAt"];
  workOrderCreatedByUserId: SelectWarehouseWorkOrders["createdByUserId"];
  sectionName: SelectWarehouses["name"] | null;
  fromLocationName: SelectWarehouses["name"] | null;
  toLocationName: SelectWarehouses["name"] | null;
  productName: SelectProducts["name"] | null;
  stockUnit: SelectProducts["stockUnit"] | null;
  companyName: SelectCompanies["companyName"] | null;
  salesOrderId: SelectOrders["id"] | null;
  salesOrderCreatedAt: SelectOrders["createdAt"] | null;
  salesLineNumber: SelectOrderItems["lineNumber"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  purchaseOrderCreatedAt: SelectPurchaseOrders["createdAt"] | null;
  purchaseLineNumber: SelectPurchaseOrderItems["lineNumber"] | null;
  transportRegion: SelectOrders["transportRegion"] | null;
  maxBundleWeightKg: SelectOrders["maxBundleWeightKg"] | null;
  deliveryCity: SelectCompanyAddresses["city"] | null;
  loadingInstructions: SelectCompanyAddresses["loadingInstructions"] | null;
  vehicle: SelectTransportWorkOrders["vehicle"] | null;
  transportDate: SelectTransportWorkOrders["date"] | null;
  tripNumber: SelectTransportWorkOrders["tripNumber"] | null;
  tripStatus: SelectTransportWorkOrders["status"] | null;
  loadingLocation: SelectTransportWorkOrderLines["fromLocation"] | null;
  stockCategory: SelectStock["stockCategory"] | null;
  // Computed: the latest pick reported, and the receipt's own bill of lading.
  reportedAt: Date | null;
  billOfLading: string | null;
  /** Resolved from Clerk, not columns. */
  createdByName: string | null;
  modifiedByName: string | null;
};

const LINE_SEARCH = [
  WarehouseWorkOrderLines.productCode,
  Products.name,
  WarehouseWorkOrderLines.orderNumber,
  WarehouseWorkOrderLines.internalBatch,
] as const;

const LINE_SORTABLE = {
  workOrderNumber: WarehouseWorkOrders.number,
  workOrderDate: WarehouseWorkOrders.plannedDate,
  type: WarehouseWorkOrders.type,
  status: WarehouseWorkOrderLines.status,
  productCode: WarehouseWorkOrderLines.productCode,
  kgPlanned: WarehouseWorkOrderLines.kgPlanned,
};

// The reference filters on product code and work-order date; type, status and
// section are how the floor narrows the rest.
const LINE_FILTERS = {
  type: enumFilter(WarehouseWorkOrders.type, warehouseWorkOrderTypes),
  status: enumFilter(WarehouseWorkOrderLines.status, workOrderStatuses),
  section: relationFilter(WarehouseWorkOrders.warehouseUuid),
  workOrderDate: dateRangeFilter(WarehouseWorkOrders.plannedDate),
};

/**
 * The trip a line's goods go out on: the latest transport line for the same
 * order line. A line can be planned onto more than one trip as deliveries are
 * split; the reference prints one, so this takes the newest.
 */
const latestTransportLine = sql`(
  SELECT ${sql.raw("`tl`.`uuid`")}
  FROM ${sql.raw("`TransportWorkOrderLines` AS `tl`")}
  WHERE ${sql.raw("`tl`.`order_item_uuid`")} = ${WarehouseWorkOrderLines.orderItemUuid}
  ORDER BY ${sql.raw("`tl`.`id`")} DESC
  LIMIT 1
)`;

const lineRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<WarehouseWorkOrderLineRow[]> => {
    const rows = await db
      .select({
        ...getTableColumns(WarehouseWorkOrderLines),
        workOrderNumber: WarehouseWorkOrders.number,
        workOrderType: WarehouseWorkOrders.type,
        workOrderDate: WarehouseWorkOrders.plannedDate,
        workOrderCreatedAt: WarehouseWorkOrders.createdAt,
        workOrderCreatedByUserId: WarehouseWorkOrders.createdByUserId,
        sectionName: Section.name,
        fromLocationName: FromLocation.name,
        toLocationName: ToLocation.name,
        productName: Products.name,
        stockUnit: Products.stockUnit,
        companyName: Companies.companyName,
        salesOrderId: Orders.id,
        salesOrderCreatedAt: Orders.createdAt,
        salesLineNumber: OrderItems.lineNumber,
        purchaseOrderId: PurchaseOrders.id,
        purchaseOrderCreatedAt: PurchaseOrders.createdAt,
        purchaseLineNumber: PurchaseOrderItems.lineNumber,
        transportRegion: Orders.transportRegion,
        maxBundleWeightKg: Orders.maxBundleWeightKg,
        deliveryCity: CompanyAddresses.city,
        loadingInstructions: CompanyAddresses.loadingInstructions,
        vehicle: TransportWorkOrders.vehicle,
        transportDate: TransportWorkOrders.date,
        tripNumber: TransportWorkOrders.tripNumber,
        tripStatus: TransportWorkOrders.status,
        loadingLocation: TransportWorkOrderLines.fromLocation,
        stockCategory: Stock.stockCategory,
        reportedAt: sql<Date | null>`(
          SELECT MAX(${WarehouseWorkOrderPicks.executedAt})
          FROM ${WarehouseWorkOrderPicks}
          WHERE ${WarehouseWorkOrderPicks.workOrderLineUuid} = ${WarehouseWorkOrderLines.uuid}
        )`,
        // An unloading names no bill of lading of its own; the reception it
        // books in carries the supplier's.
        billOfLading: sql<string | null>`(
          SELECT MAX(${PurchaseLineReceivals.billOfLading})
          FROM ${PurchaseLineReceivals}
          WHERE ${PurchaseLineReceivals.purchaseOrderItemUuid} = ${WarehouseWorkOrderLines.purchaseOrderItemUuid}
        )`,
      })
      .from(WarehouseWorkOrderLines)
      .innerJoin(
        WarehouseWorkOrders,
        eq(WarehouseWorkOrderLines.workOrderUuid, WarehouseWorkOrders.uuid),
      )
      .leftJoin(Section, eq(WarehouseWorkOrders.warehouseUuid, Section.uuid))
      .leftJoin(
        FromLocation,
        eq(WarehouseWorkOrderLines.fromLocationUuid, FromLocation.uuid),
      )
      .leftJoin(
        ToLocation,
        eq(WarehouseWorkOrderLines.toLocationUuid, ToLocation.uuid),
      )
      .leftJoin(Products, eq(WarehouseWorkOrderLines.productUuid, Products.uuid))
      .leftJoin(Companies, eq(WarehouseWorkOrderLines.companyUuid, Companies.uuid))
      .leftJoin(
        OrderItems,
        eq(WarehouseWorkOrderLines.orderItemUuid, OrderItems.uuid),
      )
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(
        CompanyAddresses,
        eq(Orders.deliveryAddressUuid, CompanyAddresses.uuid),
      )
      .leftJoin(
        PurchaseOrderItems,
        eq(WarehouseWorkOrderLines.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
      )
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Stock, eq(WarehouseWorkOrderLines.stockUuid, Stock.uuid))
      .leftJoin(
        TransportWorkOrderLines,
        eq(TransportWorkOrderLines.uuid, latestTransportLine),
      )
      .leftJoin(
        TransportWorkOrders,
        eq(TransportWorkOrderLines.workOrderUuid, TransportWorkOrders.uuid),
      )
      .where(
        tableWhere({ query, search: LINE_SEARCH, filters: LINE_FILTERS }),
      )
      .orderBy(
        ...tableOrderBy(
          LINE_SORTABLE,
          query,
          [desc(WarehouseWorkOrders.plannedDate), desc(WarehouseWorkOrders.number)],
          WarehouseWorkOrderLines.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    const wantsNames = rows.some(
      (row) => row.workOrderCreatedByUserId || row.modifiedByUserId,
    );
    const names = wantsNames ? await getClerkUserNames() : {};
    const nameOf = (id: string | null) => (id ? (names[id] ?? null) : null);
    return rows.map((row) => ({
      ...row,
      reportedAt: timestampFromDriver(row.reportedAt),
      createdByName: nameOf(row.workOrderCreatedByUserId),
      modifiedByName: nameOf(row.modifiedByUserId),
    }));
  };

/** Every line the current view matches, as a workbook. */
export const exportWarehouseWorkOrderLines = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Warehouse workorders",
    columns: WAREHOUSE_WORK_ORDER_LINE_COLUMNS,
    columnKeys,
    rows: lineRows(parseTableQuery(params)),
  });

export const getWarehouseWorkOrderLineOverview = async (
  query: TableQuery,
): Promise<Paged<WarehouseWorkOrderLineRow>> => {
  try {
    const where = tableWhere({
      query,
      search: LINE_SEARCH,
      filters: LINE_FILTERS,
    });
    return await runPaged(query, {
      rows: lineRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(WarehouseWorkOrderLines)
          .innerJoin(
            WarehouseWorkOrders,
            eq(WarehouseWorkOrderLines.workOrderUuid, WarehouseWorkOrders.uuid),
          )
          .leftJoin(
            Products,
            eq(WarehouseWorkOrderLines.productUuid, Products.uuid),
          )
          .where(where);
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch warehouse work order lines"),
    );
  }
};
