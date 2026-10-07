"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { Nesting, SelectNesting } from "@/db/schema/nesting";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { NESTING_COLUMNS } from "@/app/(dashboard)/nesting/columns";
import { exportRows } from "@/lib/server/excel";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { desc, eq, getTableColumns, SQL } from "drizzle-orm";

export type NestingListItem = SelectNesting & {
  orderId: SelectOrders["id"] | null;
  orderUuid: SelectOrders["uuid"] | null;
  orderType: SelectOrders["orderType"] | null;
  companyName: SelectCompanies["companyName"] | null;
  companyUuid: SelectCompanies["uuid"] | null;
  productUuid: SelectProducts["uuid"] | null;
  lineNumber: SelectOrderItems["lineNumber"] | null;
  lineType: SelectOrderItems["lineType"] | null;
  sourceType: SelectOrderItems["sourceType"] | null;
  lineStatus: SelectOrderItems["lineStatus"] | null;
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
const selectNesting = async (where?: SQL): Promise<NestingListItem[]> => {
  const base = db
    .select({
      ...getTableColumns(Nesting),
      orderId: Orders.id,
      orderUuid: Orders.uuid,
      companyName: Companies.companyName,
      companyUuid: Companies.uuid,
      productUuid: Products.uuid,
      lineNumber: OrderItems.lineNumber,
      lineType: OrderItems.lineType,
      sourceType: OrderItems.sourceType,
      orderType: Orders.orderType,
      lineStatus: OrderItems.lineStatus,
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
    .from(Nesting)
    .leftJoin(OrderItems, eq(Nesting.orderItemUuid, OrderItems.uuid))
    .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid));

  const rows = await (where ? base.where(where) : base).orderBy(
    desc(Nesting.productionStartingDate),
  );

  // The header's own type — Normal on all ten reference rows — not the
  // pick-up and consignment ticks it used to be composed from.
  return rows;
};

const nestingRows = async (query: TableQuery): Promise<NestingListItem[]> => {
  const rows = await selectNesting();
  const term = query.q?.toLowerCase() ?? null;

  return term
    ? rows.filter((row) =>
        [row.orderId, row.companyName, row.productCode, row.nest]
          .map((value) => String(value ?? "").toLowerCase())
          .some((value) => value.includes(term)),
      )
    : rows;
};

export const getNesting = async (
  query: TableQuery,
): Promise<Paged<NestingListItem>> => {
  try {
    const rows = await nestingRows(query);
    const start = (query.page - 1) * query.pageSize;

    return {
      rows: rows.slice(start, start + query.pageSize),
      total: rows.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch nesting"));
  }
};

export const exportNesting = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> => {
  const rows = await nestingRows(parseTableQuery(params));

  return exportRows({
    name: "Nesting",
    columns: NESTING_COLUMNS,
    columnKeys,
    rows: (limit, offset) =>
      Promise.resolve(rows.slice(offset, offset + limit)),
  });
};

/**
 * One nesting row: the nesting/sawing plan it records, plus the order line,
 * order, customer and product it hangs off.
 */
export const getNestingDetail = async (
  uuid: string,
): Promise<NestingListItem | null> => {
  try {
    const [row] = await selectNesting(eq(Nesting.uuid, uuid));
    return row ?? null;
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch nesting row"));
  }
};
