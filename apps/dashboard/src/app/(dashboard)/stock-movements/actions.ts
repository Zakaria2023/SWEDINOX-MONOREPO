"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import {
  SelectStockMovements,
  StockMovements,
} from "@/db/schema/stock-movements";
import { Products, SelectProducts } from "@/db/schema/products";
import { PurchaseOrders, SelectPurchaseOrders } from "@/db/schema/purchase-orders";
import {
  PurchaseInvoices,
  SelectPurchaseInvoices,
} from "@/db/schema/purchase-invoices";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Invoices, SelectInvoices } from "@/db/schema/invoices";
import { SelectStock, Stock } from "@/db/schema/stock";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type StockMovementListItem = SelectStockMovements & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  purchaseInvoiceId: SelectPurchaseInvoices["id"] | null;
  orderId: SelectOrders["id"] | null;
  invoiceId: SelectInvoices["id"] | null;
};

export type StockMovementDetail = SelectStockMovements & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  purchaseInvoiceId: SelectPurchaseInvoices["id"] | null;
  orderId: SelectOrders["id"] | null;
  invoiceId: SelectInvoices["id"] | null;
  stock: SelectStock | null;
};

export const getStockMovements = async (): Promise<
  StockMovementListItem[]
> => {
  try {
    return await db
      .select({
        ...getTableColumns(StockMovements),
        productCode: Products.productCode,
        productName: Products.name,
        purchaseOrderId: PurchaseOrders.id,
        purchaseInvoiceId: PurchaseInvoices.id,
        orderId: Orders.id,
        invoiceId: Invoices.id,
      })
      .from(StockMovements)
      .leftJoin(Products, eq(StockMovements.productUuid, Products.uuid))
      .leftJoin(
        PurchaseOrders,
        eq(StockMovements.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(
        PurchaseInvoices,
        eq(StockMovements.purchaseInvoiceUuid, PurchaseInvoices.uuid),
      )
      .leftJoin(Orders, eq(StockMovements.orderUuid, Orders.uuid))
      .leftJoin(Invoices, eq(StockMovements.invoiceUuid, Invoices.uuid))
      .orderBy(desc(StockMovements.createdAt));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch stock movements"));
  }
};

export const getStockMovementDetail = async (
  uuid: string,
): Promise<StockMovementDetail | null> => {
  const [movement] = await db
    .select({
      ...getTableColumns(StockMovements),
      productCode: Products.productCode,
      productName: Products.name,
      purchaseOrderId: PurchaseOrders.id,
      purchaseInvoiceId: PurchaseInvoices.id,
      orderId: Orders.id,
      invoiceId: Invoices.id,
    })
    .from(StockMovements)
    .leftJoin(Products, eq(StockMovements.productUuid, Products.uuid))
    .leftJoin(
      PurchaseOrders,
      eq(StockMovements.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .leftJoin(
      PurchaseInvoices,
      eq(StockMovements.purchaseInvoiceUuid, PurchaseInvoices.uuid),
    )
    .leftJoin(Orders, eq(StockMovements.orderUuid, Orders.uuid))
    .leftJoin(Invoices, eq(StockMovements.invoiceUuid, Invoices.uuid))
    .where(eq(StockMovements.uuid, uuid))
    .limit(1);

  if (!movement) {
    return null;
  }

  const [stock] = await db
    .select()
    .from(Stock)
    .where(eq(Stock.uuid, movement.stockUuid))
    .limit(1);

  return { ...movement, stock: stock ?? null };
};
