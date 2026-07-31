"use server";

import { db } from "@/db";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { describeError } from "@/lib/helpers";
import {
  averagePurchasePriceSql,
  lastPurchasePriceSql,
} from "@/lib/server/purchase-pricing";
import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";

export type CdDeliveryRow = {
  key: string;
  orderId: SelectOrders["id"];
  lineNumber: SelectOrderItems["lineNumber"];
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  deliveryDate: SelectOrderItems["deliveryDate"];
  quantity: SelectOrderItems["quantity"];
  unit: SelectOrderItems["unit"];
  weightKg: SelectOrderItems["kgPlanned"];
  stockValue: number;
  purchaseValue: number;
  purchaseValueDifference: number;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
};

// Cross-dock / direct-delivery order lines still in progress: order lines drawn
// from a purchase order (purchaseOrderUuid set) that aren't invoiced or
// cancelled yet. Both values come off the article's purchase invoices, since
// that is where its cost is recorded: stock value is the goods at the price
// last invoiced, purchase value is the goods at the average invoiced price, and
// the difference is the revaluation.
export const getCdDeliveriesInProgress = async (): Promise<CdDeliveryRow[]> => {
  try {
    const rows = await db
      .select({
        key: OrderItems.uuid,
        orderId: Orders.id,
        lineNumber: OrderItems.lineNumber,
        productCode: Products.productCode,
        productName: Products.name,
        deliveryDate: OrderItems.deliveryDate,
        quantity: OrderItems.quantity,
        unit: OrderItems.unit,
        weightKg: OrderItems.kgPlanned,
        replacementPrice: lastPurchasePriceSql(Products.uuid),
        averagePurchasePrice: averagePurchasePriceSql(Products.uuid),
        purchaseOrderId: PurchaseOrders.id,
      })
      .from(OrderItems)
      .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .leftJoin(
        PurchaseOrders,
        eq(OrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .where(
        and(
          isNotNull(OrderItems.purchaseOrderUuid),
          inArray(OrderItems.status, ["reserved", "delivered"]),
        ),
      )
      .orderBy(asc(Orders.id), asc(OrderItems.lineNumber));

    return rows.map((row) => {
      const quantity = Number(row.quantity ?? 0);
      const stockValue = quantity * Number(row.replacementPrice ?? 0);
      const purchaseValue = quantity * Number(row.averagePurchasePrice ?? 0);
      return {
        key: row.key,
        orderId: row.orderId,
        lineNumber: row.lineNumber,
        productCode: row.productCode,
        productName: row.productName,
        deliveryDate: row.deliveryDate,
        quantity: row.quantity,
        unit: row.unit,
        weightKg: row.weightKg,
        stockValue,
        purchaseValue,
        purchaseValueDifference: purchaseValue - stockValue,
        purchaseOrderId: row.purchaseOrderId,
      };
    });
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch CD-deliveries in progress"),
    );
  }
};
