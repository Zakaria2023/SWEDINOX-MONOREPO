"use server";

import { describeError, roundToOrderQty } from "@/lib/helpers";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { ProductGroupSuppliers } from "@/db/schema/product-group-suppliers";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { Products, SelectProducts } from "@/db/schema/products";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { Stock } from "@/db/schema/stock";
import { LeadTimeMethod } from "@/lib/enums";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";

export type StockOnAdviceRow = {
  productUuid: SelectProducts["uuid"];
  productCode: SelectProducts["productCode"];
  productName: SelectProducts["name"];
  stockUnit: SelectProducts["stockUnit"];
  mainGroup: SelectProductGroups["name"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  technicalStock: number;
  reserved: number;
  available: number;
  toBeReceived: number;
  economicStock: number;
  avgMonthlyConsumption: number;
  leadTimeDays: number;
  reviewPeriodDays: number;
  leadTimeMethod: NonNullable<SelectProductGroups["leadTimeMethod"]>;
  orderLevel: number;
  toOrder: number;
  stockMinusOrderLevel: number;
  pctDifference: number | null;
  evaluateToday: boolean;
  orderNow: boolean;
};

// Maps a JS weekday (0 = Sunday) onto the product group's ordering-day flags.
const isEvaluationDay = (
  weekday: number,
  group: {
    orderOnMonday: boolean | null;
    orderOnTuesday: boolean | null;
    orderOnWednesday: boolean | null;
    orderOnThursday: boolean | null;
    orderOnFriday: boolean | null;
  },
): boolean => {
  switch (weekday) {
    case 1:
      return Boolean(group.orderOnMonday);
    case 2:
      return Boolean(group.orderOnTuesday);
    case 3:
      return Boolean(group.orderOnWednesday);
    case 4:
      return Boolean(group.orderOnThursday);
    case 5:
      return Boolean(group.orderOnFriday);
    default:
      return false;
  }
};

// StockOn advice: a periodic-review (R,S) reorder for products whose group has
// StockOp enabled. The order-up-to level is the expected demand over the
// protection interval (lead time + review period); an order is advised when the
// economic stock has fallen below it and today is an evaluation day.
export const getStockOnAdvice = async (): Promise<StockOnAdviceRow[]> => {
  try {
    const base = await db
      .select({
        productUuid: Products.uuid,
        productCode: Products.productCode,
        productName: Products.name,
        stockUnit: Products.stockUnit,
        mainGroup: ProductGroups.name,
        leadTime: ProductGroups.leadTime,
        reviewPeriod: ProductGroups.reviewPeriod,
        leadTimeMethod: ProductGroups.leadTimeMethod,
        orderOnMonday: ProductGroups.orderOnMonday,
        orderOnTuesday: ProductGroups.orderOnTuesday,
        orderOnWednesday: ProductGroups.orderOnWednesday,
        orderOnThursday: ProductGroups.orderOnThursday,
        orderOnFriday: ProductGroups.orderOnFriday,
        supplierName: Companies.companyName,
        supplierDeliveryTime: ProductGroupSuppliers.deliveryTime,
        supplierOrderSeries: ProductGroupSuppliers.orderSeries,
        supplierMoq: ProductGroupSuppliers.moq,
      })
      .from(Products)
      .innerJoin(
        ProductGroups,
        eq(Products.productGroupUuid, ProductGroups.uuid),
      )
      .leftJoin(
        ProductGroupSuppliers,
        and(
          eq(ProductGroupSuppliers.productGroupUuid, ProductGroups.uuid),
          eq(ProductGroupSuppliers.preferred, true),
        ),
      )
      .leftJoin(
        Companies,
        eq(ProductGroupSuppliers.supplierCompanyUuid, Companies.uuid),
      )
      .where(
        and(
          eq(Products.stockProduct, true),
          eq(ProductGroups.useStockOpForThisProduct, true),
        ),
      )
      .orderBy(Products.productCode);

    if (base.length === 0) {
      return [];
    }

    const productUuids = base.map((row) => row.productUuid);

    const stockRows = await db
      .select({
        productUuid: Stock.productUuid,
        technical: sql<string>`COALESCE(SUM(${Stock.quantity}), 0)`,
        reserved: sql<string>`COALESCE(SUM(${Stock.reservedQuantity}), 0)`,
      })
      .from(Stock)
      .where(
        and(
          inArray(Stock.productUuid, productUuids),
          eq(Stock.status, "pending"),
          eq(Stock.blocked, false),
          isNull(Stock.ownerCompanyUuid),
        ),
      )
      .groupBy(Stock.productUuid);

    const stockByProduct = new Map(
      stockRows.map((row) => [
        row.productUuid,
        { technical: Number(row.technical), reserved: Number(row.reserved) },
      ]),
    );

    const onOrderRows = await db
      .select({
        productUuid: PurchaseOrderItems.productUuid,
        toBeReceived: sql<string>`COALESCE(SUM(GREATEST(${PurchaseOrderItems.quantity} - ${PurchaseOrderItems.qtyReceived}, 0)), 0)`,
      })
      .from(PurchaseOrderItems)
      .innerJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .where(
        and(
          inArray(PurchaseOrderItems.productUuid, productUuids),
          inArray(PurchaseOrders.status, ["open", "confirmed", "pre_notified"]),
        ),
      )
      .groupBy(PurchaseOrderItems.productUuid);

    const onOrderByProduct = new Map(
      onOrderRows.map((row) => [row.productUuid, Number(row.toBeReceived)]),
    );

    const consumptionRows = await db
      .select({
        productUuid: InvoiceItems.productUuid,
        last12Months: sql<string>`COALESCE(SUM(CASE WHEN ${Invoices.invoiceDate} >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) THEN ${InvoiceItems.quantity} ELSE 0 END), 0)`,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .where(inArray(InvoiceItems.productUuid, productUuids))
      .groupBy(InvoiceItems.productUuid);

    const consumptionByProduct = new Map(
      consumptionRows.map((row) => [row.productUuid, Number(row.last12Months)]),
    );

    const weekday = new Date().getDay();

    const rows: StockOnAdviceRow[] = base.map((row) => {
      const stock = stockByProduct.get(row.productUuid);
      const technicalStock = stock?.technical ?? 0;
      const reserved = stock?.reserved ?? 0;
      const available = technicalStock - reserved;
      const toBeReceived = onOrderByProduct.get(row.productUuid) ?? 0;
      const economicStock = available + toBeReceived;

      const annualConsumption = consumptionByProduct.get(row.productUuid) ?? 0;
      const avgMonthlyConsumption = annualConsumption / 12;
      const avgDailyConsumption = annualConsumption / 365;

      const leadTimeDays =
        Number(row.leadTime ?? 0) || Number(row.supplierDeliveryTime ?? 0);
      const reviewPeriodDays = Number(row.reviewPeriod ?? 0);
      const protectionDays = leadTimeDays + reviewPeriodDays;

      // Order-up-to level: expected demand across the protection interval.
      const orderLevel = avgDailyConsumption * protectionDays;
      const stockMinusOrderLevel = economicStock - orderLevel;

      const orderSeries = Number(row.supplierOrderSeries ?? 0);
      const minOrderQty = Number(row.supplierMoq ?? 0);
      const toOrder =
        economicStock < orderLevel
          ? roundToOrderQty(
              orderLevel - economicStock,
              orderSeries,
              minOrderQty,
            )
          : 0;

      const evaluateToday = isEvaluationDay(weekday, row);

      return {
        productUuid: row.productUuid,
        productCode: row.productCode,
        productName: row.productName,
        stockUnit: row.stockUnit,
        mainGroup: row.mainGroup,
        supplierName: row.supplierName,
        technicalStock,
        reserved,
        available,
        toBeReceived,
        economicStock,
        avgMonthlyConsumption,
        leadTimeDays,
        reviewPeriodDays,
        leadTimeMethod: (row.leadTimeMethod ?? "manually") as LeadTimeMethod,
        orderLevel,
        toOrder,
        stockMinusOrderLevel,
        pctDifference:
          orderLevel > 0 ? (stockMinusOrderLevel / orderLevel) * 100 : null,
        evaluateToday,
        orderNow: evaluateToday && toOrder > 0,
      };
    });

    return rows;
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch StockOn advice"));
  }
};
