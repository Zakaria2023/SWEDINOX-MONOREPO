"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { and, asc, eq, min, sql } from "drizzle-orm";

export type PeriodFilter = { year?: number; month?: number };

export type OrderLineToCallRow = {
  revenueGroupName: SelectRevenueGroups["name"] | null;
  ourReference: SelectOrders["ourReference"] | null;
  productCode: SelectProducts["productCode"] | null;
  description: SelectProducts["name"] | null;
  lineNumber: SelectOrderItems["lineNumber"];
  orderId: SelectOrders["id"] | null;
  customerCode: SelectCompanies["id"] | null;
  customerName: SelectCompanies["companyName"] | null;
  city: SelectContacts["city"] | null;
  reference: SelectOrders["customerRef"] | null;
  lineStatus: SelectOrderItems["lineStatus"];
  deliveryDate: SelectOrderItems["deliveryDate"];
  quantity: number;
  unit: SelectOrderItems["unit"];
  lengthMm: SelectOrderItems["lengthMm"];
  widthMm: SelectOrderItems["widthMm"];
  weightKg: number;
  amount: number;
  quantityNotCalled: number;
  weightToBeCalled: number;
  amountToBeCalled: number;
  representative: SelectCompanies["representative"] | null;
  consignment: boolean;
};

// Order lines that still have quantity to be called off (planned quantity not
// yet fully called). The "to be called" figures are the remaining balance.
export const getOrderLinesStillToBeCalled = async (
  filter: PeriodFilter = {},
): Promise<OrderLineToCallRow[]> => {
  try {
    const year = sql<number>`YEAR(${OrderItems.createdAt})`;
    const month = sql<number>`MONTH(${OrderItems.createdAt})`;

    const primaryContactId = db
      .select({
        companyUuid: Contacts.companyUuid,
        minId: min(Contacts.id).as("min_id"),
      })
      .from(Contacts)
      .groupBy(Contacts.companyUuid)
      .as("primary_contact_id");

    const primaryContact = db
      .select({
        companyUuid: Contacts.companyUuid,
        city: Contacts.city,
      })
      .from(Contacts)
      .innerJoin(primaryContactId, eq(Contacts.id, primaryContactId.minId))
      .as("primary_contact");

    const rows = await db
      .select({
        revenueGroupName: RevenueGroups.name,
        ourReference: Orders.ourReference,
        productCode: Products.productCode,
        description: Products.name,
        lineNumber: OrderItems.lineNumber,
        orderId: Orders.id,
        customerCode: Companies.id,
        customerName: Companies.companyName,
        city: primaryContact.city,
        reference: Orders.customerRef,
        lineStatus: OrderItems.lineStatus,
        deliveryDate: OrderItems.deliveryDate,
        quantity: OrderItems.qtyPlanned,
        qtyCallOff: OrderItems.qtyCallOff,
        unit: OrderItems.unit,
        lengthMm: OrderItems.lengthMm,
        widthMm: OrderItems.widthMm,
        weightKg: OrderItems.kgPlanned,
        kgCallOff: OrderItems.kgCallOff,
        amount: OrderItems.amount,
        representative: Companies.representative,
        consignment: Orders.isConsignment,
      })
      .from(OrderItems)
      .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .innerJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .innerJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .where(
        and(
          sql`${OrderItems.qtyPlanned} > ${OrderItems.qtyCallOff}`,
          filter.year ? eq(year, filter.year) : undefined,
          filter.month ? eq(month, filter.month) : undefined,
        ),
      )
      .orderBy(asc(OrderItems.deliveryDate));

    return rows.map((row) => {
      const qtyPlanned = Number(row.quantity ?? 0);
      const qtyNotCalled = qtyPlanned - Number(row.qtyCallOff ?? 0);
      const amount = Number(row.amount ?? 0);
      return {
        revenueGroupName: row.revenueGroupName,
        ourReference: row.ourReference,
        productCode: row.productCode,
        description: row.description,
        lineNumber: row.lineNumber,
        orderId: row.orderId,
        customerCode: row.customerCode,
        customerName: row.customerName,
        city: row.city ?? null,
        reference: row.reference,
        lineStatus: row.lineStatus,
        deliveryDate: row.deliveryDate,
        quantity: qtyPlanned,
        unit: row.unit,
        lengthMm: row.lengthMm,
        widthMm: row.widthMm,
        weightKg: Number(row.weightKg ?? 0),
        amount,
        quantityNotCalled: qtyNotCalled,
        weightToBeCalled: Number(row.weightKg ?? 0) - Number(row.kgCallOff ?? 0),
        amountToBeCalled:
          qtyPlanned > 0 ? amount * (qtyNotCalled / qtyPlanned) : 0,
        representative: row.representative,
        consignment: !!row.consignment,
      };
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch order lines still to be called"));
  }
};
