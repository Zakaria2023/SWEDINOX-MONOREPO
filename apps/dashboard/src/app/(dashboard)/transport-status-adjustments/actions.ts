"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import {
  SelectTransportStatusAdjustments,
  TransportStatusAdjustments,
} from "@/db/schema/transport-status-adjustments";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Products, SelectProducts } from "@/db/schema/products";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type TransportStatusAdjustmentListItem =
  SelectTransportStatusAdjustments & {
    orderId: SelectOrders["id"] | null;
    orderLineNumber: SelectOrderItems["lineNumber"] | null;
  };

export type TransportStatusAdjustmentDetail =
  TransportStatusAdjustmentListItem & {
    companyName: SelectCompanies["companyName"] | null;
    companyUuid: SelectCompanies["uuid"] | null;
    orderLineProductCode: SelectProducts["productCode"] | null;
    orderLineProductName: SelectProducts["name"] | null;
  };

export const getTransportStatusAdjustments = async (): Promise<
  TransportStatusAdjustmentListItem[]
> => {
  try {
    return await db
      .select({
        ...getTableColumns(TransportStatusAdjustments),
        orderId: Orders.id,
        orderLineNumber: OrderItems.lineNumber,
      })
      .from(TransportStatusAdjustments)
      .leftJoin(Orders, eq(TransportStatusAdjustments.orderUuid, Orders.uuid))
      .leftJoin(
        OrderItems,
        eq(TransportStatusAdjustments.orderItemUuid, OrderItems.uuid),
      )
      .orderBy(desc(TransportStatusAdjustments.timeModified));
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch transport status adjustments"),
    );
  }
};

/**
 * One trip-status change, with the order, order line, customer and product the
 * change applies to.
 */
export const getTransportStatusAdjustmentDetail = async (
  uuid: string,
): Promise<TransportStatusAdjustmentDetail | null> => {
  const [row] = await db
    .select({
      ...getTableColumns(TransportStatusAdjustments),
      orderId: Orders.id,
      orderLineNumber: OrderItems.lineNumber,
      companyName: Companies.companyName,
      companyUuid: Companies.uuid,
      orderLineProductCode: Products.productCode,
      orderLineProductName: Products.name,
    })
    .from(TransportStatusAdjustments)
    .leftJoin(Orders, eq(TransportStatusAdjustments.orderUuid, Orders.uuid))
    .leftJoin(
      OrderItems,
      eq(TransportStatusAdjustments.orderItemUuid, OrderItems.uuid),
    )
    .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
    .where(eq(TransportStatusAdjustments.uuid, uuid))
    .limit(1);

  return row ?? null;
};
