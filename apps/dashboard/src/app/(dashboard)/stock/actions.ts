"use server";

import { db } from "@/db";
import { SelectStock, Stock } from "@/db/schema/stock";
import { Products, SelectProducts } from "@/db/schema/products";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { PurchaseOrders, SelectPurchaseOrders } from "@/db/schema/purchase-orders";
import { and, desc, eq, getTableColumns, gt } from "drizzle-orm";

export type StockListItem = SelectStock & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  companyName: SelectCompanies["companyName"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
};

export type PendingStockOption = Pick<SelectStock, "uuid" | "quantity"> & {
  productUuid: SelectProducts["uuid"];
  productCode: SelectProducts["productCode"];
  productName: SelectProducts["name"];
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

export const getPendingStockForCompany = async (
  companyUuid: string,
): Promise<PendingStockOption[]> =>
  db
    .select({
      uuid: Stock.uuid,
      quantity: Stock.quantity,
      productUuid: Products.uuid,
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(Stock)
    .innerJoin(Products, eq(Stock.productUuid, Products.uuid))
    .where(
      and(
        eq(Products.companyUuid, companyUuid),
        eq(Stock.status, "pending"),
        gt(Stock.quantity, "0"),
      ),
    )
    .orderBy(desc(Stock.createdAt));
