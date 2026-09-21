"use server";

import { Paged, TableQuery } from "@/lib/table-query";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { asc, eq, sql } from "drizzle-orm";

export type OrderLineToCallRow = {
  revenueGroupName: SelectRevenueGroups["name"] | null;
  ourReference: SelectOrders["ourReference"] | null;
  productCode: SelectProducts["productCode"] | null;
  description: SelectProducts["name"] | null;
  lineNumber: SelectOrderItems["lineNumber"];
  orderId: SelectOrders["id"] | null;
  customerCode: SelectCompanies["id"] | null;
  customerName: SelectCompanies["companyName"] | null;
  city: SelectCompanyAddresses["city"] | null;
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
const allOrderLinesStillToBeCalled = async (): Promise<OrderLineToCallRow[]
> => {
  try {
    // The city is the company's visiting address.
    const visiting = companyAddressFor("visit", "visiting_address");

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
        city: visiting.city,
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
      .leftJoin(
        RevenueGroups,
        eq(Products.revenueGroupUuid, RevenueGroups.uuid),
      )
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .where(sql`${OrderItems.qtyPlanned} > ${OrderItems.qtyCallOff}`)
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
        weightToBeCalled:
          Number(row.weightKg ?? 0) - Number(row.kgCallOff ?? 0),
        amountToBeCalled:
          qtyPlanned > 0 ? amount * (qtyNotCalled / qtyPlanned) : 0,
        representative: row.representative,
        consignment: !!row.consignment,
      };
    });
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch order lines still to be called"),
    );
  }
};

/**
 * One page of the list.
 *
 * The rows are read in full and then sliced, because this screen is built from
 * more than one query and the grain is settled in code rather than in SQL.
 * What it stops is the screen rendering every row it has ever had.
 */
export const getOrderLinesStillToBeCalled = async (
  query: TableQuery,
): Promise<Paged<OrderLineToCallRow>> => {
  const rows = await allOrderLinesStillToBeCalled();
  const term = query.q?.toLowerCase() ?? null;
  const matched = term
    ? rows.filter((row) =>
        Object.values(row as Record<string, unknown>).some(
          (value) =>
            typeof value === "string" && value.toLowerCase().includes(term),
        ),
      )
    : rows;
  const start = (query.page - 1) * query.pageSize;

  return {
    rows: matched.slice(start, start + query.pageSize),
    total: matched.length,
    page: query.page,
    pageSize: query.pageSize,
  };
};
