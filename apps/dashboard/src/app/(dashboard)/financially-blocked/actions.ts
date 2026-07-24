"use server";

import { requireAuth } from "@/lib/auth";
import { describeError, generateUuid } from "@/lib/helpers";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { db } from "@/db";
import { Invoices } from "@/db/schema/invoices";
import { OrderDeblocks } from "@/db/schema/order-deblocks";
import { OrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Quotes, SelectQuotes } from "@/db/schema/quotes";
import { eq, isNotNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type UnblockOrderResult = { success?: boolean; error?: string };

// Release an order's financial block and record the event in the deblock audit
// trail (which block, when, and by which user).
export const unblockOrder = async (
  orderUuid: string,
): Promise<UnblockOrderResult> => {
  const userId = await requireAuth();
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(Orders)
        .set({ financialBlockage: false })
        .where(eq(Orders.uuid, orderUuid));

      await tx.insert(OrderDeblocks).values({
        uuid: generateUuid(),
        orderUuid,
        deblockType: "financial",
        deblockedByUserId: userId,
      });
    });
    revalidatePath("/financially-blocked");
    revalidatePath("/unblocked-orders");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to unblock order",
    };
  }
};

export type FinanciallyBlockedRow = {
  kind: "Order" | "Quote";
  uuid: string;
  code: SelectOrders["ourReference"];
  debtor: SelectCompanies["companyName"];
  debtorNumber: SelectCompanies["id"];
  deliveryDate: SelectOrders["deliveryDate"];
  blockingReason: SelectOrders["blockingReason"];
  paymentTerms: SelectOrders["paymentTerms"];
  amount: number;
  creditLimit: number;
  openEntrees: number;
  creditSpace: number;
  companyBlocked: boolean;
};

// Quotes and orders held on a financial block, enriched with the debtor's open
// receivables (Σ invoice outstanding), credit limit and remaining credit space.
export const getFinanciallyBlocked = async (): Promise<
  FinanciallyBlockedRow[]
> => {
  try {
    // Open receivables per debtor.
    const arRows = await db
      .select({
        companyUuid: Invoices.companyUuid,
        outstanding: sql<string>`COALESCE(SUM(${Invoices.outstanding}), 0)`,
      })
      .from(Invoices)
      .where(isNotNull(Invoices.companyUuid))
      .groupBy(Invoices.companyUuid);

    const openByCompany = new Map(
      arRows.map((row) => [row.companyUuid, Number(row.outstanding)]),
    );

    const orderRows = await db
      .select({
        uuid: Orders.uuid,
        companyUuid: Orders.companyUuid,
        code: Orders.ourReference,
        debtor: Companies.companyName,
        debtorNumber: Companies.id,
        deliveryDate: Orders.deliveryDate,
        blockingReason: Orders.blockingReason,
        paymentTerms: Orders.paymentTerms,
        creditLimit: Companies.creditLimit,
        blockedByUserId: Companies.blockedByUserId,
        amount: sql<string>`COALESCE(SUM(${OrderItems.amount}), 0)`,
      })
      .from(Orders)
      .innerJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(OrderItems, eq(OrderItems.orderUuid, Orders.uuid))
      .where(eq(Orders.financialBlockage, true))
      .groupBy(
        Orders.uuid,
        Orders.companyUuid,
        Orders.ourReference,
        Companies.companyName,
        Companies.id,
        Orders.deliveryDate,
        Orders.blockingReason,
        Orders.paymentTerms,
        Companies.creditLimit,
        Companies.blockedByUserId,
      );

    const quoteRows = await db
      .select({
        uuid: Quotes.uuid,
        companyUuid: Quotes.companyUuid,
        code: Quotes.ourReference,
        debtor: Companies.companyName,
        debtorNumber: Companies.id,
        deliveryDate: Quotes.deliveryDate,
        blockingReason: Quotes.blockingReason,
        paymentTerms: Quotes.paymentTerms,
        creditLimit: Companies.creditLimit,
        blockedByUserId: Companies.blockedByUserId,
        amount: Quotes.totalExclVat,
      })
      .from(Quotes)
      .innerJoin(Companies, eq(Quotes.companyUuid, Companies.uuid))
      .where(eq(Quotes.financialBlockage, true));

    const build = (
      kind: "Order" | "Quote",
      row: {
        uuid: string;
        companyUuid: string;
        code: SelectOrders["ourReference"] | SelectQuotes["ourReference"];
        debtor: SelectCompanies["companyName"];
        debtorNumber: SelectCompanies["id"];
        deliveryDate: SelectOrders["deliveryDate"];
        blockingReason: SelectOrders["blockingReason"];
        paymentTerms: SelectOrders["paymentTerms"];
        creditLimit: SelectCompanies["creditLimit"];
        blockedByUserId: SelectCompanies["blockedByUserId"];
        amount: string | null;
      },
    ): FinanciallyBlockedRow => {
      const openEntrees = openByCompany.get(row.companyUuid) ?? 0;
      const creditLimit = Number(row.creditLimit ?? 0);
      return {
        kind,
        uuid: row.uuid,
        code: row.code,
        debtor: row.debtor,
        debtorNumber: row.debtorNumber,
        deliveryDate: row.deliveryDate,
        blockingReason: row.blockingReason,
        paymentTerms: row.paymentTerms,
        amount: Number(row.amount ?? 0),
        creditLimit,
        openEntrees,
        creditSpace: creditLimit - openEntrees,
        companyBlocked: row.blockedByUserId !== null,
      };
    };

    return [
      ...orderRows.map((row) => build("Order", row)),
      ...quoteRows.map((row) => build("Quote", row)),
    ].sort((a, b) => a.debtor.localeCompare(b.debtor));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch financially blocked quotes and orders"));
  }
};
