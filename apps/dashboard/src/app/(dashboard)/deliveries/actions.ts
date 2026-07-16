"use server";

import { db } from "@/db";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { desc, eq, getTableColumns, ne, or } from "drizzle-orm";

export type DeliveryLineItem = SelectOrderItems & {
  orderId: SelectOrders["id"] | null;
  orderCategory: SelectOrders["orderCategory"] | null;
  customerName: SelectCompanies["companyName"] | null;
  customerRef: SelectOrders["customerRef"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

const lineColumns = {
  ...getTableColumns(OrderItems),
  orderId: Orders.id,
  orderCategory: Orders.orderCategory,
  customerName: Companies.companyName,
  customerRef: Orders.customerRef,
  productCode: Products.productCode,
  productName: Products.name,
};

// Deliverable order lines — everything not cancelled, newest first.
export const getDeliveries = async (): Promise<DeliveryLineItem[]> => {
  try {
    return await db
      .select(lineColumns)
      .from(OrderItems)
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .where(ne(OrderItems.status, "cancelled"))
      .orderBy(desc(OrderItems.createdAt));
  } catch {
    throw new Error("Failed to fetch deliveries");
  }
};

// Lines held back by a commercial, financial or transport block.
export const getBlockedDeliveries = async (): Promise<DeliveryLineItem[]> => {
  try {
    return await db
      .select(lineColumns)
      .from(OrderItems)
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .where(
        or(
          eq(OrderItems.commercialBlock, true),
          eq(OrderItems.financialBlock, true),
          eq(OrderItems.transportBlock, true),
        ),
      )
      .orderBy(desc(OrderItems.createdAt));
  } catch {
    throw new Error("Failed to fetch blocked deliveries");
  }
};

// Lines still to be arranged that hold no stock reservation yet.
export const getDeliveriesToArrange = async (): Promise<DeliveryLineItem[]> => {
  try {
    return await db
      .select(lineColumns)
      .from(OrderItems)
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .where(eq(OrderItems.qtyReserved, "0.000"))
      .orderBy(desc(OrderItems.createdAt));
  } catch {
    throw new Error("Failed to fetch deliveries to arrange");
  }
};
