"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import { Nesting, SelectNesting } from "@/db/schema/nesting";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type NestingListItem = SelectNesting & {
  orderId: SelectOrders["id"] | null;
  orderUuid: SelectOrders["uuid"] | null;
  orderType: string; // composed from the order's type flags
  companyName: SelectCompanies["companyName"] | null;
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

export const getNesting = async (): Promise<NestingListItem[]> => {
  try {
    const rows = await db
      .select({
        ...getTableColumns(Nesting),
        orderId: Orders.id,
        orderUuid: Orders.uuid,
        companyName: Companies.companyName,
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
        // Raw order-type flags — composed into `orderType` below.
        orderIsPickup: Orders.isPickup,
        orderIsIncidental: Orders.isIncidental,
        orderIsConsignment: Orders.isConsignment,
        orderIsInternalProduction: Orders.isInternalProduction,
        orderIsCustomerMaterial: Orders.isCustomerMaterial,
        orderIsOverlength: Orders.isOverlength,
      })
      .from(Nesting)
      .leftJoin(OrderItems, eq(Nesting.orderItemUuid, OrderItems.uuid))
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .orderBy(desc(Nesting.productionStartingDate));

    return rows.map((row) => {
      const {
        orderIsPickup,
        orderIsIncidental,
        orderIsConsignment,
        orderIsInternalProduction,
        orderIsCustomerMaterial,
        orderIsOverlength,
        ...rest
      } = row;

      const flags: Array<[boolean | null, string]> = [
        [orderIsPickup, "Pickup"],
        [orderIsIncidental, "Incidental"],
        [orderIsConsignment, "Consignment"],
        [orderIsInternalProduction, "Internal production"],
        [orderIsCustomerMaterial, "Customer material"],
        [orderIsOverlength, "Overlength"],
      ];
      const active = flags.filter(([on]) => on).map(([, label]) => label);

      return {
        ...rest,
        orderType: active.length ? active.join(", ") : "Standard",
      };
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch nesting"));
  }
};
