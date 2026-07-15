"use server";

import { db } from "@/db";
import { SelectStock, Stock } from "@/db/schema/stock";
import { Products, SelectProducts } from "@/db/schema/products";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { PurchaseOrders, SelectPurchaseOrders } from "@/db/schema/purchase-orders";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type StockListItem = SelectStock & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  companyName: SelectCompanies["companyName"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
};

export const getStock = async (): Promise<StockListItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(Stock),
        productCode: Products.productCode,
        productName: Products.name,
        companyName: Companies.companyName,
        purchaseOrderId: PurchaseOrders.id,
      })
      .from(Stock)
      .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
      .leftJoin(Companies, eq(Products.companyUuid, Companies.uuid))
      .leftJoin(
        PurchaseOrders,
        eq(Stock.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .orderBy(desc(Stock.createdAt));
  } catch {
    throw new Error("Failed to fetch stock");
  }
};
