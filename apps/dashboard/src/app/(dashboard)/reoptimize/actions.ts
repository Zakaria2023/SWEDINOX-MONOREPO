"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { Reoptimize, SelectReoptimize } from "@/db/schema/reoptimize";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { desc, eq, getTableColumns, SQL } from "drizzle-orm";

export type ReoptimizeListItem = SelectReoptimize & {
  orderId: SelectOrders["id"] | null;
  orderUuid: SelectOrders["uuid"] | null;
  orderType: SelectOrders["orderType"] | null;
  companyName: SelectCompanies["companyName"] | null;
  companyUuid: SelectCompanies["uuid"] | null;
  productUuid: SelectProducts["uuid"] | null;
  lineNumber: SelectOrderItems["lineNumber"] | null;
  lineType: SelectOrderItems["lineType"] | null;
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
const selectReoptimize = async (where?: SQL): Promise<ReoptimizeListItem[]> => {
  const base = db
    .select({
      ...getTableColumns(Reoptimize),
      orderId: Orders.id,
      orderUuid: Orders.uuid,
      companyName: Companies.companyName,
      companyUuid: Companies.uuid,
      productUuid: Products.uuid,
      lineNumber: OrderItems.lineNumber,
      lineType: OrderItems.lineType,
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
      // The header's own type (Normal / Call-off / Rush), not the pick-up and
      // consignment ticks it used to be composed from.
      orderType: Orders.orderType,
    })
    .from(Reoptimize)
    .leftJoin(OrderItems, eq(Reoptimize.orderItemUuid, OrderItems.uuid))
    .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid));

  const rows = await (where ? base.where(where) : base).orderBy(
    desc(Reoptimize.productionStartingDate),
  );

  return rows;
};

export const getReoptimize = async (): Promise<ReoptimizeListItem[]> => {
  try {
    return await selectReoptimize();
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch (re)optimize rows"));
  }
};

/**
 * One (re)optimize row: the sawing plan and geometry it records, plus the order
 * line, order, customer and product it hangs off.
 */
export const getReoptimizeDetail = async (
  uuid: string,
): Promise<ReoptimizeListItem | null> => {
  try {
    const [row] = await selectReoptimize(eq(Reoptimize.uuid, uuid));
    return row ?? null;
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch (re)optimize row"));
  }
};
