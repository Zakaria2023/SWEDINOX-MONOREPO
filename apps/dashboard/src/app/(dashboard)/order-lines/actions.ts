"use server";
import { describeError, remainingToInvoice } from "@/lib/helpers";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { SelectStock, Stock } from "@/db/schema/stock";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type OrderLineRow = {
  uuid: SelectOrderItems["uuid"];
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

export type OrderLineDetail = SelectOrderItems & {
  orderId: SelectOrders["id"] | null;
  orderCategory: SelectOrders["orderCategory"] | null;
  customerRef: SelectOrders["customerRef"] | null;
  customerName: SelectCompanies["companyName"] | null;
  companyUuid: SelectCompanies["uuid"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  /** The lot the line is allocated to, for the stock block on the screen. */
  stock: OrderLineStockRow | null;
  /** How much of the line is still to be billed. */
  remainingToInvoice: number;
};

export type OrderLineStockRow = Pick<
  SelectStock,
  | "uuid"
  | "status"
  | "quantity"
  | "reservedQuantity"
  | "unit"
  | "charge"
  | "internalCharge"
  | "valuationPrice"
>;

// Every order line, joined to its order, customer and product. Cost is the
// stock lot valuation; profit/margin are derived from the line amount.
export const getOrderLines = async (): Promise<OrderLineRow[]> => {
  try {
    const rows = await db
      .select({
        uuid: OrderItems.uuid,
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
      .orderBy(desc(OrderItems.createdAt));

    return rows.map((row) => {
      const amount = Number(row.amount ?? 0);
      const quantity = Number(row.quantity ?? 0);
      const costPrice = Number(row.costPrice ?? 0);
      const profit = amount - costPrice * quantity;
      return {
        uuid: row.uuid,
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

/**
 * One order line in full: everything the line records, the order and customer it
 * belongs to, the product, the purchase order it was drawn from, and the stock
 * lot it is allocated to.
 *
 * This is the canonical order-line screen. The deliveries, blocked-deliveries,
 * deliveries-to-arrange and reservation overviews all list `OrderItems` rows, so
 * they link here rather than each carrying a near-identical screen of their own.
 */
export const getOrderLineDetail = async (
  uuid: string,
): Promise<OrderLineDetail | null> => {
  try {
    const [line] = await db
      .select({
        ...getTableColumns(OrderItems),
        orderId: Orders.id,
        orderCategory: Orders.orderCategory,
        customerRef: Orders.customerRef,
        customerName: Companies.companyName,
        companyUuid: Companies.uuid,
        productCode: Products.productCode,
        productName: Products.name,
        purchaseOrderId: PurchaseOrders.id,
      })
      .from(OrderItems)
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .leftJoin(
        PurchaseOrders,
        eq(OrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .where(eq(OrderItems.uuid, uuid))
      .limit(1);

    if (!line) {
      return null;
    }

    const [stock] = await db
      .select({
        uuid: Stock.uuid,
        status: Stock.status,
        quantity: Stock.quantity,
        reservedQuantity: Stock.reservedQuantity,
        unit: Stock.unit,
        charge: Stock.charge,
        internalCharge: Stock.internalCharge,
        valuationPrice: Stock.valuationPrice,
      })
      .from(Stock)
      .where(eq(Stock.uuid, line.stockUuid))
      .limit(1);

    return {
      ...line,
      stock: stock ?? null,
      remainingToInvoice: remainingToInvoice(
        line.quantity,
        line.invoicedQuantity,
      ),
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch order line"));
  }
};
