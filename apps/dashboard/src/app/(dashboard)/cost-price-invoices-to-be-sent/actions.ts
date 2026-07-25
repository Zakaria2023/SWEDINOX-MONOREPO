"use server";

import { db } from "@/db";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { Products } from "@/db/schema/products";
import { ReturnOrderItems } from "@/db/schema/return-order-items";
import { ReturnOrders } from "@/db/schema/return-orders";
import { describeError } from "@/lib/helpers";
import { eq } from "drizzle-orm";

export type CostPriceToBeSentRow = {
  key: string;
  account: string;
  amount: number;
  orderReference: string;
  lineNumber: SelectOrderItems["lineNumber"];
  goodsIssueDate: SelectOrderItems["deliveryDate"];
  costCentre: number;
};

// The GL purchases/COGS account and cost centre these postings roll up to. The
// legacy screen varies the account per product ledger mapping (7000/7002/7004);
// this system has no such mapping yet, so a single purchases account is used.
const COGS_ACCOUNT = "7000";
const COST_CENTRE = 0;

// Cost of goods already issued on orders whose invoice has not been sent yet:
// delivered-but-not-invoiced order lines valued at the product's average
// purchase price, plus return lines booked as negatives.
export const getCostPriceInvoicesToBeSent = async (): Promise<
  CostPriceToBeSentRow[]
> => {
  try {
    const orderRows = await db
      .select({
        key: OrderItems.uuid,
        orderId: Orders.id,
        lineNumber: OrderItems.lineNumber,
        goodsIssueDate: OrderItems.deliveryDate,
        quantity: OrderItems.quantity,
        app: Products.averagePurchasePrice,
      })
      .from(OrderItems)
      .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .where(eq(OrderItems.status, "delivered"));

    const returnRows = await db
      .select({
        key: ReturnOrderItems.uuid,
        returnId: ReturnOrders.id,
        lineNumber: ReturnOrderItems.lineNumber,
        goodsIssueDate: ReturnOrderItems.deliveryDate,
        returnQty: ReturnOrderItems.returnQty,
        costPrice: ReturnOrderItems.costPrice,
      })
      .from(ReturnOrderItems)
      .innerJoin(
        ReturnOrders,
        eq(ReturnOrderItems.returnOrderUuid, ReturnOrders.uuid),
      );

    const rows: CostPriceToBeSentRow[] = [
      ...orderRows.map((row) => ({
        key: `order-${row.key}`,
        account: COGS_ACCOUNT,
        amount: Number(row.app ?? 0) * Number(row.quantity ?? 0),
        orderReference: `O${row.orderId}`,
        lineNumber: row.lineNumber,
        goodsIssueDate: row.goodsIssueDate,
        costCentre: COST_CENTRE,
      })),
      ...returnRows.map((row) => ({
        key: `return-${row.key}`,
        account: COGS_ACCOUNT,
        amount: -(Number(row.costPrice ?? 0) * Number(row.returnQty ?? 0)),
        orderReference: `R${row.returnId}`,
        lineNumber: row.lineNumber,
        goodsIssueDate: row.goodsIssueDate,
        costCentre: COST_CENTRE,
      })),
    ];

    return rows.sort((a, b) =>
      (b.goodsIssueDate ?? "").localeCompare(a.goodsIssueDate ?? ""),
    );
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch cost price of invoices to be sent"),
    );
  }
};
