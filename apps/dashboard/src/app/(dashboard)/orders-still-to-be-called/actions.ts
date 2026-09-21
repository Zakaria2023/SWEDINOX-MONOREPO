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
import { Stock } from "@/db/schema/stock";
import { desc, eq, sql } from "drizzle-orm";

export type OrderStillToCallRow = {
  orderId: SelectOrders["id"] | null;
  ourReference: SelectOrders["ourReference"] | null;
  productCode: SelectProducts["productCode"] | null;
  description: SelectProducts["name"] | null;
  lineNumber: SelectOrderItems["lineNumber"];
  customerCode: SelectCompanies["id"] | null;
  customerName: SelectCompanies["companyName"] | null;
  city: SelectCompanyAddresses["city"] | null;
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
const allOrdersStillToBeCalled = async (): Promise<OrderStillToCallRow[]
> => {
  try {
    // The city is the company's visiting address.
    const visiting = companyAddressFor("visit", "visiting_address");

    const rows = await db
      .select({
        orderId: Orders.id,
        ourReference: Orders.ourReference,
        productCode: Products.productCode,
        description: Products.name,
        lineNumber: OrderItems.lineNumber,
        customerCode: Companies.id,
        customerName: Companies.companyName,
        city: visiting.city,
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
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .where(sql`${OrderItems.qtyPlanned} > ${OrderItems.qtyCallOff}`)
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

/**
 * One page of the list.
 *
 * The rows are read in full and then sliced, because this screen is built from
 * more than one query and the grain is settled in code rather than in SQL.
 * What it stops is the screen rendering every row it has ever had.
 */
export const getOrdersStillToBeCalled = async (
  query: TableQuery,
): Promise<Paged<OrderStillToCallRow>> => {
  const rows = await allOrdersStillToBeCalled();
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
