"use server";

import { db } from "@/db";
import {
  SelectTransportWorkOrderLines,
  SelectTransportWorkOrders,
  TransportWorkOrderLines,
  TransportWorkOrders,
} from "@/db/schema/transport-work-orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { and, desc, eq, getTableColumns } from "drizzle-orm";
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
      .leftJoin(Products, eq(TransportWorkOrderLines.productUuid, Products.uuid))
      .orderBy(desc(TransportWorkOrderLines.createdAt));
  } catch {
    throw new Error("Failed to fetch transport work orders");
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
