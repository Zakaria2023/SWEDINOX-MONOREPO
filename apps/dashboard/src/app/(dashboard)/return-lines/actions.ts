"use server";

import { db } from "@/db";
import {
  ReturnOrderItems,
  SelectReturnOrderItems,
} from "@/db/schema/return-order-items";
import { ReturnOrders, SelectReturnOrders } from "@/db/schema/return-orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type ReturnLineItem = SelectReturnOrderItems & {
  returnOrderId: SelectReturnOrders["id"] | null;
  customerName: SelectCompanies["companyName"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  // Computed margin figures (no single column backs them).
  profit: number;
  profitMargin: number;
};

export const getReturnLines = async (): Promise<ReturnLineItem[]> => {
  try {
    const rows = await db
      .select({
        ...getTableColumns(ReturnOrderItems),
        returnOrderId: ReturnOrders.id,
        customerName: Companies.companyName,
        productCode: Products.productCode,
        productName: Products.name,
      })
      .from(ReturnOrderItems)
      .leftJoin(
        ReturnOrders,
        eq(ReturnOrderItems.returnOrderUuid, ReturnOrders.uuid),
      )
      .leftJoin(Companies, eq(ReturnOrders.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(ReturnOrderItems.productUuid, Products.uuid))
      .orderBy(desc(ReturnOrderItems.createdAt));

    return rows.map((row) => {
      const amount = Number(row.amount);
      const cost = Number(row.costPrice) * Number(row.quantity);
      const profit = amount - cost;
      return {
        ...row,
        profit,
        profitMargin: amount === 0 ? 0 : (profit / amount) * 100,
      };
    });
  } catch {
    throw new Error("Failed to fetch return lines");
  }
};
