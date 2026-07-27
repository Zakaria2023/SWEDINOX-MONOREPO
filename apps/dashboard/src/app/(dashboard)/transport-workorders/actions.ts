"use server";

import { db } from "@/db";
import {
  SelectTransportWorkOrderLines,
  SelectTransportWorkOrders,
  TransportWorkOrderLines,
  TransportWorkOrders,
} from "@/db/schema/transport-work-orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { describeError, generateUuid, todayDateString } from "@/lib/helpers";
import { and, desc, eq, getTableColumns, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type WorkOrderActionResult = {
  error?: string;
  success?: boolean;
};

export type TransportWorkOrderLineItem = SelectTransportWorkOrderLines & {
  tripNumber: SelectTransportWorkOrders["tripNumber"] | null;
  workOrderDate: SelectTransportWorkOrders["date"] | null;
  vehicle: SelectTransportWorkOrders["vehicle"] | null;
  destinationName: SelectCompanies["companyName"] | null;
  productName: SelectProducts["name"] | null;
};

export const getTransportWorkOrderLines = async (): Promise<
  TransportWorkOrderLineItem[]
> => {
  try {
    return await db
      .select({
        ...getTableColumns(TransportWorkOrderLines),
        tripNumber: TransportWorkOrders.tripNumber,
        workOrderDate: TransportWorkOrders.date,
        vehicle: TransportWorkOrders.vehicle,
        destinationName: Companies.companyName,
        productName: Products.name,
      })
      .from(TransportWorkOrderLines)
      .innerJoin(
        TransportWorkOrders,
        eq(TransportWorkOrderLines.workOrderUuid, TransportWorkOrders.uuid),
      )
      .leftJoin(
        Companies,
        eq(TransportWorkOrderLines.destinationCompanyUuid, Companies.uuid),
      )
      .leftJoin(
        Products,
        eq(TransportWorkOrderLines.productUuid, Products.uuid),
      )
      .orderBy(desc(TransportWorkOrderLines.createdAt));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch transport work orders"));
  }
};

// Turns the order lines into transport work-order lines — one line per order
// item on a new trip, delivered to the order's company. Order lines already on
// a trip are skipped, so it can be re-run as new orders come in.
export const generateTransportWorkOrders =
  async (): Promise<WorkOrderActionResult> => {
    try {
      const items = await db
        .select({
          productUuid: OrderItems.productUuid,
          productCode: Products.productCode,
          quantity: OrderItems.quantity,
          qtyPlanned: OrderItems.qtyPlanned,
          kgPlanned: OrderItems.kgPlanned,
          lengthMm: OrderItems.lengthMm,
          widthMm: OrderItems.widthMm,
          thicknessMm: OrderItems.thicknessMm,
          orderId: Orders.id,
          companyUuid: Orders.companyUuid,
        })
        .from(OrderItems)
        .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
        .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid));

      if (items.length === 0) {
        return { error: "No order lines to plan. Create an order first." };
      }

      const existing = await db
        .select({
          orderNumber: TransportWorkOrderLines.orderNumber,
          productUuid: TransportWorkOrderLines.productUuid,
        })
        .from(TransportWorkOrderLines);
      const existingKeys = new Set(
        existing.map((line) => `${line.orderNumber}|${line.productUuid}`),
      );

      const newItems = items.filter(
        (item) => !existingKeys.has(`${item.orderId}|${item.productUuid}`),
      );
      if (newItems.length === 0) {
        return { error: "All order lines are already on a trip." };
      }

      const [tripRow] = await db
        .select({ maxTrip: max(TransportWorkOrders.tripNumber) })
        .from(TransportWorkOrders);
      const tripNumber = (Number(tripRow?.maxTrip ?? 0) || 0) + 1;

      const workOrderUuid = generateUuid();

      await db.transaction(async (tx) => {
        await tx.insert(TransportWorkOrders).values({
          uuid: workOrderUuid,
          tripNumber,
          date: todayDateString(),
          status: "new",
        });

        for (const item of newItems) {
          await tx.insert(TransportWorkOrderLines).values({
            uuid: generateUuid(),
            workOrderUuid,
            destinationCompanyUuid: item.companyUuid,
            productUuid: item.productUuid,
            productCode: item.productCode,
            orderNumber: String(item.orderId),
            status: "new",
            lengthMm: item.lengthMm,
            widthMm: item.widthMm,
            thicknessMm: item.thicknessMm,
            qtyPlanned: item.qtyPlanned ?? item.quantity,
            kgPlanned: item.kgPlanned,
          });
        }
      });

      revalidatePath("/transport-workorders");
      return { success: true };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate transport work orders",
      };
    }
  };

// Completing a transport line confirms dispatch. It writes no stock movement:
// the stock already left the warehouse at delivery (see the Deliver action),
// so this only marks the line shipped to avoid double-counting.
export const completeTransportWorkOrderLine = async (
  lineUuid: string,
): Promise<WorkOrderActionResult> => {
  try {
    const [line] = await db
      .select()
      .from(TransportWorkOrderLines)
      .where(eq(TransportWorkOrderLines.uuid, lineUuid))
      .limit(1);

    if (!line) {
      return { error: "Transport line not found." };
    }
    if (line.status === "completed") {
      return { error: "This line is already completed." };
    }

    const [update] = await db
      .update(TransportWorkOrderLines)
      .set({ status: "completed" })
      .where(
        and(
          eq(TransportWorkOrderLines.uuid, lineUuid),
          eq(TransportWorkOrderLines.status, line.status),
        ),
      );

    if (update.affectedRows === 0) {
      return {
        error:
          "This line changed while completing — please refresh and try again.",
      };
    }

    revalidatePath("/transport-workorders");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete transport line",
    };
  }
};
