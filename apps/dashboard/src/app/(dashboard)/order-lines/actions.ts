"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { Stock } from "@/db/schema/stock";
import { and, desc, eq, sql } from "drizzle-orm";

export type PeriodFilter = { year?: number; month?: number };

export type OrderLineRow = {
  createdAt: string | null;
  deliveryDate: SelectOrderItems["deliveryDate"];
  customerName: SelectCompanies["companyName"] | null;
  reference: SelectOrders["customerRef"] | null;
  orderId: SelectOrders["id"] | null;
  lineNumber: SelectOrderItems["lineNumber"];
  lineStatus: SelectOrderItems["lineStatus"];
  productCode: SelectProducts["productCode"] | null;
  description: SelectProducts["name"] | null;
  options: SelectOrderItems["options"];
  lengthMm: SelectOrderItems["lengthMm"];
  widthMm: SelectOrderItems["widthMm"];
  thicknessMm: SelectOrderItems["thicknessMm"];
  quantity: number;
  unit: SelectOrderItems["unit"];
  weightKg: number;
  price: number;
  priceUnit: SelectOrderItems["priceUnit"];
  costPrice: number;
  amount: number;
  profit: number;
  profitMargin: number;
  seller: SelectOrderItems["seller"];
};

// Every order line, joined to its order, customer and product. Cost is the
// stock lot valuation; profit/margin are derived from the line amount.
export const getOrderLines = async (
  filter: PeriodFilter = {},
): Promise<OrderLineRow[]> => {
  try {
    const year = sql<number>`YEAR(${OrderItems.createdAt})`;
    const month = sql<number>`MONTH(${OrderItems.createdAt})`;

    const rows = await db
      .select({
        createdAt: OrderItems.createdAt,
        deliveryDate: OrderItems.deliveryDate,
        customerName: Companies.companyName,
        reference: Orders.customerRef,
        orderId: Orders.id,
        lineNumber: OrderItems.lineNumber,
        lineStatus: OrderItems.lineStatus,
        productCode: Products.productCode,
        description: Products.name,
        options: OrderItems.options,
        lengthMm: OrderItems.lengthMm,
        widthMm: OrderItems.widthMm,
        thicknessMm: OrderItems.thicknessMm,
        quantity: OrderItems.quantity,
        unit: OrderItems.unit,
        weightKg: OrderItems.kgPlanned,
        price: OrderItems.grossPrice,
        priceUnit: OrderItems.priceUnit,
        costPrice: Stock.valuationPrice,
        amount: OrderItems.amount,
        seller: OrderItems.seller,
      })
      .from(OrderItems)
      .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .innerJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .innerJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .leftJoin(Stock, eq(OrderItems.stockUuid, Stock.uuid))
      .where(
        and(
          filter.year ? eq(year, filter.year) : undefined,
          filter.month ? eq(month, filter.month) : undefined,
        ),
      )
      .orderBy(desc(OrderItems.createdAt));

    return rows.map((row) => {
      const amount = Number(row.amount ?? 0);
      const quantity = Number(row.quantity ?? 0);
      const costPrice = Number(row.costPrice ?? 0);
      const profit = amount - costPrice * quantity;
      return {
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
        deliveryDate: row.deliveryDate,
        customerName: row.customerName,
        reference: row.reference,
        orderId: row.orderId,
        lineNumber: row.lineNumber,
        lineStatus: row.lineStatus,
        productCode: row.productCode,
        description: row.description,
        options: row.options,
        lengthMm: row.lengthMm,
        widthMm: row.widthMm,
        thicknessMm: row.thicknessMm,
        quantity,
        unit: row.unit,
        weightKg: Number(row.weightKg ?? 0),
        price: Number(row.price ?? 0),
        priceUnit: row.priceUnit,
        costPrice,
        amount,
        profit,
        profitMargin: amount === 0 ? 0 : (profit / amount) * 100,
        seller: row.seller,
      };
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch order lines"));
  }
};
