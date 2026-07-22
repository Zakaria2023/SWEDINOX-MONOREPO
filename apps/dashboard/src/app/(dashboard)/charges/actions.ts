"use server";

import { db } from "@/db";
import { Charges, SelectCharges } from "@/db/schema/charges";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { OrderItems } from "@/db/schema/order-items";
import { Orders, OrderSurcharges } from "@/db/schema/orders";
import { Products } from "@/db/schema/products";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { Stock } from "@/db/schema/stock";
import { INVOICE_SURCHARGE_DESCRIPTION_LABELS } from "@/lib/labels";
import { generateUuid, todayDateString } from "@/lib/helpers";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ChargeListItem = SelectCharges & {
  customerName: SelectCompanies["companyName"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
};

export const getCharges = async (): Promise<ChargeListItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(Charges),
        customerName: Companies.companyName,
        revenueGroupName: RevenueGroups.name,
      })
      .from(Charges)
      .leftJoin(Companies, eq(Charges.companyUuid, Companies.uuid))
      .leftJoin(RevenueGroups, eq(Charges.revenueGroupUuid, RevenueGroups.uuid))
      .orderBy(desc(Charges.creationDate));
  } catch {
    throw new Error("Failed to fetch charges");
  }
};

export type GenerateChargesResult = {
  error?: string;
  success?: boolean;
};

// Turns orders into charge records: one "line charge" per order line (valued at
// its amount, cost from the reserved stock lot) plus one charge per order
// surcharge. Orders that already have charges are skipped, so it can be re-run.
export const generateChargesFromOrders =
  async (): Promise<GenerateChargesResult> => {
    try {
      const existing = await db
        .select({ orderUuid: Charges.orderUuid })
        .from(Charges);
      const chargedOrderUuids = new Set(
        existing
          .map((row) => row.orderUuid)
          .filter((uuid): uuid is string => uuid !== null),
      );

      const lines = await db
        .select({
          orderUuid: Orders.uuid,
          orderId: Orders.id,
          companyUuid: Orders.companyUuid,
          deliveryDate: OrderItems.deliveryDate,
          amount: OrderItems.amount,
          quantity: OrderItems.quantity,
          kgPlanned: OrderItems.kgPlanned,
          productName: Products.name,
          revenueGroupUuid: Products.revenueGroupUuid,
          valuationPrice: Stock.valuationPrice,
        })
        .from(OrderItems)
        .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
        .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
        .leftJoin(Stock, eq(OrderItems.stockUuid, Stock.uuid));

      const surcharges = await db
        .select({
          orderUuid: Orders.uuid,
          orderId: Orders.id,
          companyUuid: Orders.companyUuid,
          description: OrderSurcharges.description,
          amount: OrderSurcharges.amount,
          profit: OrderSurcharges.profit,
        })
        .from(OrderSurcharges)
        .innerJoin(Orders, eq(OrderSurcharges.orderUuid, Orders.uuid));

      const newLines = lines.filter(
        (line) => !chargedOrderUuids.has(line.orderUuid),
      );
      const newSurcharges = surcharges.filter(
        (surcharge) => !chargedOrderUuids.has(surcharge.orderUuid),
      );

      if (newLines.length === 0 && newSurcharges.length === 0) {
        return {
          error:
            chargedOrderUuids.size > 0
              ? "Every order already has charges."
              : "No orders to charge. Create an order first.",
        };
      }

      const today = todayDateString();
      const rows: (typeof Charges.$inferInsert)[] = [];

      for (const line of newLines) {
        const amount = Number(line.amount ?? 0);
        const cost =
          Number(line.valuationPrice ?? 0) * Number(line.quantity ?? 0);
        rows.push({
          uuid: generateUuid(),
          companyUuid: line.companyUuid,
          orderUuid: line.orderUuid,
          revenueGroupUuid: line.revenueGroupUuid,
          code: String(line.orderId),
          creationDate: today,
          deliveryDate: line.deliveryDate,
          surcharge: line.productName ?? "Order line",
          amount: amount.toFixed(2),
          cost: cost.toFixed(2),
          profit: (amount - cost).toFixed(2),
          weightKg: line.kgPlanned ?? "0.00",
          status: "open",
        });
      }

      for (const surcharge of newSurcharges) {
        const amount = Number(surcharge.amount ?? 0);
        rows.push({
          uuid: generateUuid(),
          companyUuid: surcharge.companyUuid,
          orderUuid: surcharge.orderUuid,
          code: String(surcharge.orderId),
          creationDate: today,
          surcharge: surcharge.description
            ? INVOICE_SURCHARGE_DESCRIPTION_LABELS[surcharge.description]
            : "Surcharge",
          amount: amount.toFixed(2),
          cost: "0.00",
          profit: (Number(surcharge.profit ?? 0) || amount).toFixed(2),
          status: "open",
        });
      }

      if (rows.length > 0) {
        await db.insert(Charges).values(rows);
      }

      revalidatePath("/charges");
      return { success: true };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to generate charges",
      };
    }
  };
