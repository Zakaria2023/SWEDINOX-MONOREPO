"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import {
  SelectTransportStatusAdjustments,
  TransportStatusAdjustments,
} from "@/db/schema/transport-status-adjustments";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type TransportStatusAdjustmentListItem =
  SelectTransportStatusAdjustments & {
    orderId: SelectOrders["id"] | null;
    orderLineNumber: SelectOrderItems["lineNumber"] | null;
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
