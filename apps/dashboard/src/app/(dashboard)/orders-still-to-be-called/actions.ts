"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { Stock } from "@/db/schema/stock";
import { and, desc, eq, min, sql } from "drizzle-orm";

export type PeriodFilter = { year?: number; month?: number };

export type OrderStillToCallRow = {
  orderId: SelectOrders["id"] | null;
  ourReference: SelectOrders["ourReference"] | null;
  productCode: SelectProducts["productCode"] | null;
  description: SelectProducts["name"] | null;
  lineNumber: SelectOrderItems["lineNumber"];
  customerCode: SelectCompanies["id"] | null;
  customerName: SelectCompanies["companyName"] | null;
  city: SelectContacts["city"] | null;
  reference: SelectOrders["customerRef"] | null;
  lineStatus: SelectOrderItems["lineStatus"];
  deliveryDate: SelectOrderItems["deliveryDate"];
  quantity: number;
  unit: SelectOrderItems["unit"];
  weightKg: number;
  amount: number;
  quantityNotCalled: number;
  weightToBeCalled: number;
  amountToBeCalled: number;
  representative: SelectCompanies["representative"] | null;
  consignment: boolean;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  stockKg: number;
  reservedStock: number;
  costPrice: number;
};

// Orders that still have lines to be called off, viewed per line and ordered
// by order, enriched with the reserved stock lot's on-hand figures.
export const getOrdersStillToBeCalled = async (
  filter: PeriodFilter = {},
): Promise<OrderStillToCallRow[]> => {
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
        orderId: Orders.id,
        ourReference: Orders.ourReference,
        productCode: Products.productCode,
        description: Products.name,
        lineNumber: OrderItems.lineNumber,
        customerCode: Companies.id,
        customerName: Companies.companyName,
        city: primaryContact.city,
        reference: Orders.customerRef,
        lineStatus: OrderItems.lineStatus,
        deliveryDate: OrderItems.deliveryDate,
        quantity: OrderItems.qtyPlanned,
        qtyCallOff: OrderItems.qtyCallOff,
        unit: OrderItems.unit,
        weightKg: OrderItems.kgPlanned,
        kgCallOff: OrderItems.kgCallOff,
        amount: OrderItems.amount,
        representative: Companies.representative,
        consignment: Orders.isConsignment,
        revenueGroupName: RevenueGroups.name,
        stockKg: Stock.quantityKg,
        reservedStock: Stock.reservedQuantity,
        costPrice: Stock.valuationPrice,
      })
      .from(OrderItems)
      .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .innerJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .innerJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
      .leftJoin(Stock, eq(OrderItems.stockUuid, Stock.uuid))
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .where(
        and(
          sql`${OrderItems.qtyPlanned} > ${OrderItems.qtyCallOff}`,
          filter.year ? eq(year, filter.year) : undefined,
          filter.month ? eq(month, filter.month) : undefined,
        ),
      )
      .orderBy(desc(Orders.id), OrderItems.lineNumber);

    return rows.map((row) => {
      const qtyPlanned = Number(row.quantity ?? 0);
      const qtyNotCalled = qtyPlanned - Number(row.qtyCallOff ?? 0);
      const amount = Number(row.amount ?? 0);
      return {
        orderId: row.orderId,
        ourReference: row.ourReference,
        productCode: row.productCode,
        description: row.description,
        lineNumber: row.lineNumber,
        customerCode: row.customerCode,
        customerName: row.customerName,
        city: row.city ?? null,
        reference: row.reference,
        lineStatus: row.lineStatus,
        deliveryDate: row.deliveryDate,
        quantity: qtyPlanned,
        unit: row.unit,
        weightKg: Number(row.weightKg ?? 0),
        amount,
        quantityNotCalled: qtyNotCalled,
        weightToBeCalled: Number(row.weightKg ?? 0) - Number(row.kgCallOff ?? 0),
        amountToBeCalled:
          qtyPlanned > 0 ? amount * (qtyNotCalled / qtyPlanned) : 0,
        representative: row.representative,
        consignment: !!row.consignment,
        revenueGroupName: row.revenueGroupName,
        stockKg: Number(row.stockKg ?? 0),
        reservedStock: Number(row.reservedStock ?? 0),
        costPrice: Number(row.costPrice ?? 0),
      };
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch orders still to be called"));
  }
};
