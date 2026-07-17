"use server";

import { db } from "@/db";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type PurchaseLineItem = SelectPurchaseOrderItems & {
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  orderDate: SelectPurchaseOrders["orderDate"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export const getPurchaseLines = async (): Promise<PurchaseLineItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(PurchaseOrderItems),
        purchaseOrderId: PurchaseOrders.id,
        orderDate: PurchaseOrders.orderDate,
        supplierName: Companies.companyName,
        productCode: Products.productCode,
        productName: Products.name,
      })
      .from(PurchaseOrderItems)
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .leftJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
      .orderBy(desc(PurchaseOrderItems.createdAt));
  } catch {
    throw new Error("Failed to fetch purchase lines");
  }
};
