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
import { desc, eq, getTableColumns } from "drizzle-orm";

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
