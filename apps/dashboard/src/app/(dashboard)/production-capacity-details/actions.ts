"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import {
  ProductionCapacityDetails,
  SelectProductionCapacityDetails,
} from "@/db/schema/production-capacity-details";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  TransportWorkOrderLines,
  TransportWorkOrders,
} from "@/db/schema/transport-work-orders";
import { PRODUCTION_CAPACITY_DETAIL_COLUMNS } from "@/app/(dashboard)/production-capacity-details/columns";
import { exportRows } from "@/lib/server/excel";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { desc, eq, getTableColumns, SQL, sql } from "drizzle-orm";

export type ProductionCapacityDetailListItem =
  SelectProductionCapacityDetails & {
    orderId: SelectOrders["id"] | null;
    orderUuid: SelectOrders["uuid"] | null;
    orderType: SelectOrders["orderType"] | null;
    companyName: SelectCompanies["companyName"] | null;
    companyUuid: SelectCompanies["uuid"] | null;
    productUuid: SelectProducts["uuid"] | null;
    lineNumber: SelectOrderItems["lineNumber"] | null;
    lineType: SelectOrderItems["lineType"] | null;
    sourceType: SelectOrderItems["sourceType"] | null;
    /** `Planned Delivery` · `Delivered`: on a lorry, and gone. */
    plannedDeliveryQty: number;
    deliveredQty: number;
    /** `Delivery date (a)`: the day the trip carrying it was completed. */
    deliveredOn: string | null;
    lineStatus: SelectOrderItems["lineStatus"] | null;
    deliveryStatus: SelectOrderItems["deliveryStatus"] | null;
    orderLineDeliveryDate: SelectOrderItems["deliveryDate"] | null;
    isPickup: SelectOrderItems["isPickup"] | null;
    unit: SelectOrderItems["unit"] | null;
    lengthMm: SelectOrderItems["lengthMm"] | null;
    widthMm: SelectOrderItems["widthMm"] | null;
    thicknessMm: SelectOrderItems["thicknessMm"] | null;
    qtyPlanned: SelectOrderItems["qtyPlanned"] | null;
    qtyActual: SelectOrderItems["qtyActual"] | null;
    kgPlanned: SelectOrderItems["kgPlanned"] | null;
    kgActual: SelectOrderItems["kgActual"] | null;
    productCode: SelectProducts["productCode"] | null;
    productName: SelectProducts["name"] | null;
    theoreticalWeight: SelectProducts["theoreticalWeight"] | null;
    theoreticalWeightUnit: SelectProducts["weightUnit"] | null;
  };

// The overview and the detail screen show the same row, so they share one query
// and differ only in the filter applied. `where` is left off for the overview.
const selectProductionCapacityDetails = async (
  where?: SQL,
): Promise<ProductionCapacityDetailListItem[]> => {
  const base = db
    .select({
      ...getTableColumns(ProductionCapacityDetails),
      orderId: Orders.id,
      orderUuid: Orders.uuid,
      companyName: Companies.companyName,
      companyUuid: Companies.uuid,
      productUuid: Products.uuid,
      lineNumber: OrderItems.lineNumber,
      lineType: OrderItems.lineType,
      sourceType: OrderItems.sourceType,
      orderType: Orders.orderType,
      plannedDeliveryQty: sql<number>`(
        SELECT COALESCE(SUM(twl.qty_planned), 0) FROM ${TransportWorkOrderLines} twl
        WHERE twl.order_item_uuid = ${OrderItems.uuid}
      )`.mapWith(Number),
      deliveredQty: sql<number>`(
        SELECT COALESCE(SUM(twl.qty_actual), 0) FROM ${TransportWorkOrderLines} twl
        WHERE twl.order_item_uuid = ${OrderItems.uuid}
      )`.mapWith(Number),
      deliveredOn: sql<string | null>`(
        SELECT MAX(two.date) FROM ${TransportWorkOrderLines} twl
        JOIN ${TransportWorkOrders} two ON two.uuid = twl.work_order_uuid
        WHERE twl.order_item_uuid = ${OrderItems.uuid} AND two.status = 'completed'
      )`,
      lineStatus: OrderItems.lineStatus,
      deliveryStatus: OrderItems.deliveryStatus,
      orderLineDeliveryDate: OrderItems.deliveryDate,
      isPickup: OrderItems.isPickup,
      unit: OrderItems.unit,
      lengthMm: OrderItems.lengthMm,
      widthMm: OrderItems.widthMm,
      thicknessMm: OrderItems.thicknessMm,
      qtyPlanned: OrderItems.qtyPlanned,
      qtyActual: OrderItems.qtyActual,
      kgPlanned: OrderItems.kgPlanned,
      kgActual: OrderItems.kgActual,
      productCode: Products.productCode,
      productName: Products.name,
      theoreticalWeight: Products.theoreticalWeight,
      theoreticalWeightUnit: Products.weightUnit,
    })
    .from(ProductionCapacityDetails)
    .leftJoin(
      OrderItems,
      eq(ProductionCapacityDetails.orderItemUuid, OrderItems.uuid),
    )
    .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid));

  const rows = await (where ? base.where(where) : base).orderBy(
    desc(ProductionCapacityDetails.productionStartingDate),
  );

  // The header's own type — Normal 1 933, Call-off 29, Rush 8 on the
  // reference's 1 970 rows — not the pick-up and consignment ticks.
  return rows;
};

const capacityDetailRows = async (
  query: TableQuery,
): Promise<ProductionCapacityDetailListItem[]> => {
  const rows = await selectProductionCapacityDetails();
  const term = query.q?.toLowerCase() ?? null;

  return term
    ? rows.filter((row) =>
        [row.orderId, row.companyName, row.productCode]
          .map((value) => String(value ?? "").toLowerCase())
          .some((value) => value.includes(term)),
      )
    : rows;
};

export const getProductionCapacityDetails = async (
  query: TableQuery,
): Promise<Paged<ProductionCapacityDetailListItem>> => {
  try {
    const rows = await capacityDetailRows(query);
    const start = (query.page - 1) * query.pageSize;

    return {
      rows: rows.slice(start, start + query.pageSize),
      total: rows.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch production capacity details"),
    );
  }
};

/**
 * One production-capacity detail row: the sawing and production attributes it
 * records, plus the order line, order, customer and product they hang off.
 */
export const getProductionCapacityDetail = async (
  uuid: string,
): Promise<ProductionCapacityDetailListItem | null> => {
  try {
    const [row] = await selectProductionCapacityDetails(
      eq(ProductionCapacityDetails.uuid, uuid),
    );
    return row ?? null;
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch production capacity detail"),
    );
  }
};

export const exportProductionCapacityDetails = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> => {
  const rows = await capacityDetailRows(parseTableQuery(params));

  return exportRows({
    name: "Production capacity details",
    columns: PRODUCTION_CAPACITY_DETAIL_COLUMNS,
    columnKeys,
    rows: (limit, offset) =>
      Promise.resolve(rows.slice(offset, offset + limit)),
  });
};
