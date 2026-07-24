"use server";

import { db } from "@/db";
import {
  OrderItemOptions,
  SelectOrderItemOptions,
} from "@/db/schema/order-item-options";
import { OrderItems } from "@/db/schema/order-items";
import { Products } from "@/db/schema/products";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import {
  ProductOptionPrices,
  SalesOptions,
  SelectSalesOptions,
} from "@/db/schema/sales-options";
import { describeError,
  generateUuid,
  profitMarginPercent,
  todayDateString,
} from "@/lib/helpers";
import { and, asc, desc, eq, gte, lte, or, sql, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// One row per option, revenue group and line status — the "invoiced per option"
// view of the legacy overview, which groups by option code.
export type OptionRevenueRow = {
  optionCode: SelectSalesOptions["code"];
  optionName: SelectSalesOptions["name"];
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  lineStatus: SelectOrderItemOptions["lineStatus"];
  weightKg: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  lineCount: number;
};

export const getOptionRevenue = async (): Promise<OptionRevenueRow[]> => {
  try {
    const rows = await db
      .select({
        optionCode: SalesOptions.code,
        optionName: SalesOptions.name,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        lineStatus: OrderItemOptions.lineStatus,
        weightKg: sql<string>`COALESCE(SUM(${OrderItemOptions.weightKg}), 0)`,
        revenue: sql<string>`COALESCE(SUM(${OrderItemOptions.amount}), 0)`,
        profit: sql<string>`COALESCE(SUM(${OrderItemOptions.profit}), 0)`,
        lineCount: sql<number>`COUNT(${OrderItemOptions.uuid})`,
      })
      .from(OrderItemOptions)
      .innerJoin(
        SalesOptions,
        eq(OrderItemOptions.optionUuid, SalesOptions.uuid),
      )
      .leftJoin(
        RevenueGroups,
        eq(OrderItemOptions.revenueGroupUuid, RevenueGroups.uuid),
      )
      .groupBy(
        SalesOptions.code,
        SalesOptions.name,
        RevenueGroups.number,
        RevenueGroups.name,
        OrderItemOptions.lineStatus,
      )
      .orderBy(
        asc(SalesOptions.code),
        desc(sql`SUM(${OrderItemOptions.amount})`),
      );

    return rows.map((row) => {
      const revenue = Number(row.revenue ?? 0);
      const profit = Number(row.profit ?? 0);
      return {
        optionCode: row.optionCode,
        optionName: row.optionName,
        revenueGroupNumber: row.revenueGroupNumber,
        revenueGroupName: row.revenueGroupName,
        lineStatus: row.lineStatus,
        weightKg: Number(row.weightKg ?? 0),
        revenue,
        profit,
        profitMargin: profitMarginPercent(revenue, profit),
        lineCount: Number(row.lineCount ?? 0),
      };
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch option revenue"));
  }
};

export type GenerateOptionChargesResult = {
  error?: string;
  success?: boolean;
  createdCharges?: number;
};

// Books the priced options onto the order lines that don't carry them yet.
//
// For every order line, each option that has a price for that product and is
// valid today is charged at that price times the line quantity; the option's
// cost price gives the cost, and the difference is the profit the Options
// overview reports. The price is copied onto the charge, so changing the option
// price later does not rewrite revenue that was already booked.
//
// Order lines that already carry option charges are skipped, so it can be
// re-run after adding orders.
export const generateOptionCharges =
  async (): Promise<GenerateOptionChargesResult> => {
    try {
      const today = todayDateString();

      const lines = await db
        .select({
          uuid: OrderItems.uuid,
          orderUuid: OrderItems.orderUuid,
          productUuid: OrderItems.productUuid,
          quantity: OrderItems.quantity,
          unit: OrderItems.unit,
          weightKg: OrderItems.kgPlanned,
          lineStatus: OrderItems.lineStatus,
          productRevenueGroupUuid: Products.revenueGroupUuid,
        })
        .from(OrderItems)
        .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid));

      if (lines.length === 0) {
        return { error: "No order lines yet. Create an order first." };
      }

      const charged = new Set(
        (
          await db
            .select({ orderItemUuid: OrderItemOptions.orderItemUuid })
            .from(OrderItemOptions)
        ).map((row) => row.orderItemUuid),
      );

      const openLines = lines.filter((line) => !charged.has(line.uuid));
      if (openLines.length === 0) {
        return {
          error: "Every order line already carries its option charges.",
        };
      }

      // Every option price in force today, keyed by product.
      const prices = await db
        .select({
          productUuid: ProductOptionPrices.productUuid,
          optionUuid: ProductOptionPrices.optionUuid,
          basePrice: ProductOptionPrices.basePrice,
          costPrice: ProductOptionPrices.costPrice,
          priceUnit: ProductOptionPrices.priceUnit,
          optionRevenueGroupUuid: SalesOptions.revenueGroupUuid,
        })
        .from(ProductOptionPrices)
        .innerJoin(
          SalesOptions,
          eq(ProductOptionPrices.optionUuid, SalesOptions.uuid),
        )
        .where(
          and(
            eq(SalesOptions.isActive, true),
            or(
              isNull(ProductOptionPrices.validFrom),
              lte(ProductOptionPrices.validFrom, today),
            ),
            or(
              isNull(ProductOptionPrices.validUntil),
              gte(ProductOptionPrices.validUntil, today),
            ),
          ),
        );

      if (prices.length === 0) {
        return {
          error:
            "No option prices in force. Price the options on /option-prices-per-product first.",
        };
      }

      const pricesByProduct = new Map<string, typeof prices>();
      for (const price of prices) {
        const existing = pricesByProduct.get(price.productUuid) ?? [];
        existing.push(price);
        pricesByProduct.set(price.productUuid, existing);
      }

      const rows: (typeof OrderItemOptions.$inferInsert)[] = [];

      for (const line of openLines) {
        const linePrices = pricesByProduct.get(line.productUuid) ?? [];
        const quantity = Number(line.quantity ?? 0);

        for (const price of linePrices) {
          const unitPrice = Number(price.basePrice ?? 0);
          const unitCost = Number(price.costPrice ?? 0);
          const amount = unitPrice * quantity;
          const cost = unitCost * quantity;

          rows.push({
            uuid: generateUuid(),
            orderUuid: line.orderUuid,
            orderItemUuid: line.uuid,
            optionUuid: price.optionUuid,
            revenueGroupUuid:
              price.optionRevenueGroupUuid ?? line.productRevenueGroupUuid,
            lineStatus: line.lineStatus,
            quantity: quantity.toFixed(3),
            unit: line.unit,
            weightKg: line.weightKg ?? "0.00",
            price: unitPrice.toFixed(2),
            priceUnit: price.priceUnit,
            costPrice: unitCost.toFixed(2),
            amount: amount.toFixed(2),
            cost: cost.toFixed(2),
            profit: (amount - cost).toFixed(2),
          });
        }
      }

      if (rows.length === 0) {
        return {
          error:
            "None of the ordered products have an option price in force today.",
        };
      }

      await db.insert(OrderItemOptions).values(rows);

      revalidatePath("/options");
      return { success: true, createdCharges: rows.length };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate option charges",
      };
    }
  };
