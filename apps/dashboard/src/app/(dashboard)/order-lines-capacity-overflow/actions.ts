"use server";

import { db } from "@/db";
import { CapacityChecks, SelectCapacityChecks } from "@/db/schema/capacity-checks";
import {
  OrderLineCapacityOverflows,
  SelectOrderLineCapacityOverflows,
} from "@/db/schema/capacity-overflows";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Nesting, SelectNesting } from "@/db/schema/nesting";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { describeError, resolveOrderTypeLabel } from "@/lib/helpers";
import { desc, eq, getTableColumns, SQL } from "drizzle-orm";

// An order line that pushes a capacity check past its ceiling. The row pulls
// from four places at once, which is exactly why the reference grid is so wide:
// the line itself, the sawing/nesting plan hanging off it, the capacity check
// it broke, and the action somebody recorded in response.
export type CapacityOverflowRow = SelectOrderLineCapacityOverflows & {
  orderId: SelectOrders["id"] | null;
  orderUuid: SelectOrderItems["orderUuid"];
  orderItemUuid: SelectOrderItems["uuid"];
  lineNumber: SelectOrderItems["lineNumber"];
  orderType: string;
  companyName: SelectCompanies["companyName"] | null;

  capacityDate: SelectCapacityChecks["checkDate"] | null;
  capacityName: SelectCapacityChecks["checkName"] | null;

  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  lengthMm: SelectOrderItems["lengthMm"];
  widthMm: SelectOrderItems["widthMm"];
  thicknessMm: SelectOrderItems["thicknessMm"];
  lineStatus: SelectOrderItems["status"];
  lineType: SelectOrderItems["lineType"];
  qtyPlanned: SelectOrderItems["qtyPlanned"];
  qtyActual: SelectOrderItems["qtyActual"];
  unit: SelectOrderItems["unit"];
  kgPlanned: SelectOrderItems["kgPlanned"];
  kgActual: SelectOrderItems["kgActual"];
  orderLineDeliveryDate: SelectOrderItems["deliveryDate"];
  isPickup: SelectOrders["isPickup"];

  // Nesting/sawing plan — absent for a line that is not cut or nested.
  quality: SelectNesting["quality"] | null;
  category: SelectNesting["category"] | null;
  sawingSpec: SelectNesting["sawingSpec"] | null;
  fixedDimension: SelectNesting["fixedDimension"] | null;
  toSaw: SelectNesting["toSaw"] | null;
  sawingWorkOrder: SelectNesting["sawingWorkOrder"] | null;
  sawingWorkOrderLine: SelectNesting["sawingWorkOrderLine"] | null;
  sawingMachine: SelectNesting["sawingMachine"] | null;
  sawingType: SelectNesting["sawingType"] | null;
  sawingAngles: SelectNesting["sawingAngles"] | null;
  leftSawAngle: SelectNesting["leftSawAngle"] | null;
  rightSawAngle: SelectNesting["rightSawAngle"] | null;
  drillingHoles: SelectNesting["drillingHoles"] | null;
  bundles: SelectNesting["bundles"] | null;
  standing: SelectNesting["standing"] | null;
  productionStartingDate: SelectNesting["productionStartingDate"] | null;
  plannedDeliveredQty: SelectNesting["plannedDeliveredQty"] | null;
  deliveredQty: SelectNesting["deliveredQty"] | null;
  deliveryUnit: SelectNesting["deliveryUnit"] | null;
  deliveryDatePlanned: SelectNesting["deliveryDatePlanned"] | null;
  deliveryDateActual: SelectNesting["deliveryDateActual"] | null;
  deliveryStatus: SelectNesting["deliveryStatus"] | null;
  optionQty: SelectNesting["optionQty"] | null;
  transportDate: SelectNesting["transportDate"] | null;
};

// The overview and the detail screen show the same row, so they share one query
// and differ only in the filter applied. `where` is left off for the overview.
const selectCapacityOverflows = async (
  where?: SQL,
): Promise<CapacityOverflowRow[]> => {
  const base = db
    .select({
        ...getTableColumns(OrderLineCapacityOverflows),
        orderId: Orders.id,
        orderUuid: OrderItems.orderUuid,
        lineNumber: OrderItems.lineNumber,
        companyName: Companies.companyName,
        isPickup: Orders.isPickup,
        isIncidental: Orders.isIncidental,
        isConsignment: Orders.isConsignment,
        isInternalProduction: Orders.isInternalProduction,
        isCustomerMaterial: Orders.isCustomerMaterial,

        capacityDate: CapacityChecks.checkDate,
        capacityName: CapacityChecks.checkName,

        productCode: Products.productCode,
        productName: Products.name,
        lengthMm: OrderItems.lengthMm,
        widthMm: OrderItems.widthMm,
        thicknessMm: OrderItems.thicknessMm,
        lineStatus: OrderItems.status,
        lineType: OrderItems.lineType,
        qtyPlanned: OrderItems.qtyPlanned,
        qtyActual: OrderItems.qtyActual,
        unit: OrderItems.unit,
        kgPlanned: OrderItems.kgPlanned,
        kgActual: OrderItems.kgActual,
        orderLineDeliveryDate: OrderItems.deliveryDate,

        quality: Nesting.quality,
        category: Nesting.category,
        sawingSpec: Nesting.sawingSpec,
        fixedDimension: Nesting.fixedDimension,
        toSaw: Nesting.toSaw,
        sawingWorkOrder: Nesting.sawingWorkOrder,
        sawingWorkOrderLine: Nesting.sawingWorkOrderLine,
        sawingMachine: Nesting.sawingMachine,
        sawingType: Nesting.sawingType,
        sawingAngles: Nesting.sawingAngles,
        leftSawAngle: Nesting.leftSawAngle,
        rightSawAngle: Nesting.rightSawAngle,
        drillingHoles: Nesting.drillingHoles,
        bundles: Nesting.bundles,
        standing: Nesting.standing,
        productionStartingDate: Nesting.productionStartingDate,
        plannedDeliveredQty: Nesting.plannedDeliveredQty,
        deliveredQty: Nesting.deliveredQty,
        deliveryUnit: Nesting.deliveryUnit,
        deliveryDatePlanned: Nesting.deliveryDatePlanned,
        deliveryDateActual: Nesting.deliveryDateActual,
        deliveryStatus: Nesting.deliveryStatus,
        optionQty: Nesting.optionQty,
        transportDate: Nesting.transportDate,
    })
    .from(OrderLineCapacityOverflows)
    .innerJoin(
      OrderItems,
      eq(OrderLineCapacityOverflows.orderItemUuid, OrderItems.uuid),
    )
    .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
    .leftJoin(
      CapacityChecks,
      eq(OrderLineCapacityOverflows.capacityCheckUuid, CapacityChecks.uuid),
    )
    .leftJoin(Nesting, eq(Nesting.orderItemUuid, OrderItems.uuid));

  const rows = await (where ? base.where(where) : base).orderBy(
    desc(CapacityChecks.checkDate),
  );

  return rows.map((row) => ({
    ...row,
    orderType: resolveOrderTypeLabel({
      isPickup: row.isPickup,
      isIncidental: row.isIncidental,
      isConsignment: row.isConsignment,
      isInternalProduction: row.isInternalProduction,
      isCustomerMaterial: row.isCustomerMaterial,
    }),
  }));
};

export const getOrderLinesCapacityOverflow = async (): Promise<
  CapacityOverflowRow[]
> => {
  try {
    return await selectCapacityOverflows();
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch order lines capacity overflow"),
    );
  }
};

/**
 * One recorded capacity overflow: the decision taken, plus the order line, the
 * capacity check it broke and the sawing plan behind it.
 */
export const getCapacityOverflowDetail = async (
  uuid: string,
): Promise<CapacityOverflowRow | null> => {
  try {
    const [row] = await selectCapacityOverflows(
      eq(OrderLineCapacityOverflows.uuid, uuid),
    );
    return row ?? null;
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch capacity overflow"),
    );
  }
};
