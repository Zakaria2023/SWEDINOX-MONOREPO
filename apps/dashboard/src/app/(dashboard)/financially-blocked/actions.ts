"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { OrderDeblocks } from "@/db/schema/order-deblocks";
import { OrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Quotes, SelectQuotes } from "@/db/schema/quotes";
import {
  currentUserHasRole,
  FINANCIAL_RELEASE_ROLES,
  requireAuth,
} from "@/lib/auth";
import {
  describeError,
  effectiveCreditLimit,
  generateUuid,
} from "@/lib/helpers";
import {
  getCommittedOrderValueByCompany,
  getOpenReceivablesByCompany,
} from "@/lib/server/credit-control";
import { writeSystemLog } from "@/lib/server/system-log";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type UnblockOrderResult = { success?: boolean; error?: string };

export type FinanciallyBlockedRow = {
  kind: "Order" | "Quote";
  /** Unique per row: an order appears once per planned delivery date. */
  key: string;
  uuid: string;
  code: SelectOrders["ourReference"];
  debtor: SelectCompanies["companyName"];
  debtorNumber: SelectCompanies["debtorNumber"];
  deliveryDate: SelectOrders["deliveryDate"];
  blockingReason: SelectOrders["blockingReason"];
  paymentTerms: SelectOrders["paymentTerms"];
  /** Held by hand on the order form rather than by the credit rule. */
  financialBlockManual: NonNullable<SelectOrders["financialBlockManual"]>;
  amount: number;
  creditLimit: number;
  openEntrees: number;
  creditSpace: number;
  companyBlocked: boolean;
};

// Release an order's financial block and record the event in the deblock audit
// trail (which block, when, and by which user).
//
// Only Finance or an administrator may: the reference hides both the queue and
// its `Deblokkeren` from its sales and logistics profiles.
export const unblockOrder = async (
  orderUuid: string,
): Promise<UnblockOrderResult> => {
  const userId = await requireAuth();
  if (!(await currentUserHasRole(FINANCIAL_RELEASE_ROLES))) {
    return {
      error: "Only Finance or an administrator can release a financial block.",
    };
  }
  try {
    await db.transaction(async (tx) => {
      const [order] = await tx
        .select({ id: Orders.id })
        .from(Orders)
        .where(
          and(eq(Orders.uuid, orderUuid), eq(Orders.financialBlockage, true)),
        )
        .limit(1);

      if (!order) {
        throw new Error("This order is not financially blocked.");
      }

      // A release covers the order as it stands now, so the "changed since"
      // flag starts over with it.
      await tx
        .update(Orders)
        .set({
          financialBlockage: false,
          financialBlockManual: false,
          changedAfterFinancialDeblock: false,
        })
        .where(eq(Orders.uuid, orderUuid));

      await tx.insert(OrderDeblocks).values({
        uuid: generateUuid(),
        orderUuid,
        deblockType: "financial",
        deblockedByUserId: userId,
      });

      await writeSystemLog(tx, {
        category: "financial_unblock",
        message: `Order ${order.id} released from its financial block`,
        orderUuid,
        userId,
      });
    });
    revalidatePath("/financially-blocked");
    revalidatePath("/unblocked-orders");
    // Delivery is gated on the block, so releasing it changes what can ship.
    revalidatePath("/deliveries");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to unblock order",
    };
  }
};

// Quotes and orders held on a financial block, enriched with the debtor's open
// receivables (Σ invoice outstanding), credit limit and remaining credit space.
export const getFinanciallyBlocked = async (): Promise<
  FinanciallyBlockedRow[]
> => {
  try {
    // Open receivables per debtor, read through the same helper the blocking
    // rule uses, so the credit space shown here can never disagree with the
    // figure an order was actually held against.
    const [openByCompany, committedByCompany] = await Promise.all([
      getOpenReceivablesByCompany(db),
      getCommittedOrderValueByCompany(db),
    ]);

    // One row per order per planned delivery date. The reference's queue is
    // worked by delivery: `O102167` and `O102168` each appear twice, with
    // `Delivery date 1st delivery` 26-6-2026 and 14-8-2026 — the same order,
    // held once per delivery. A line with no date of its own falls back to the
    // order's.
    const lineDeliveryDate = sql<
      SelectOrders["deliveryDate"]
    >`COALESCE(${OrderItems.deliveryDate}, ${Orders.deliveryDate})`;

    const orderRows = await db
      .select({
        uuid: Orders.uuid,
        companyUuid: Orders.companyUuid,
        code: Orders.ourReference,
        debtor: Companies.companyName,
        debtorNumber: Companies.debtorNumber,
        deliveryDate: lineDeliveryDate,
        blockingReason: Orders.blockingReason,
        paymentTerms: Orders.paymentTerms,
        financialBlockManual: Orders.financialBlockManual,
        creditLimit: Companies.creditLimit,
        creditLimitUninsured: Companies.creditLimitUninsured,
        creditLimitUninsuredDate: Companies.creditLimitUninsuredDate,
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
        Companies.debtorNumber,
        lineDeliveryDate,
        Orders.blockingReason,
        Orders.paymentTerms,
        Orders.financialBlockManual,
        Companies.creditLimit,
        Companies.creditLimitUninsured,
        Companies.creditLimitUninsuredDate,
        Companies.blockedByUserId,
      );

    const quoteRows = await db
      .select({
        uuid: Quotes.uuid,
        companyUuid: Quotes.companyUuid,
        code: Quotes.ourReference,
        debtor: Companies.companyName,
        debtorNumber: Companies.debtorNumber,
        deliveryDate: Quotes.deliveryDate,
        blockingReason: Quotes.blockingReason,
        paymentTerms: Quotes.paymentTerms,
        creditLimit: Companies.creditLimit,
        creditLimitUninsured: Companies.creditLimitUninsured,
        creditLimitUninsuredDate: Companies.creditLimitUninsuredDate,
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
        debtorNumber: SelectCompanies["debtorNumber"];
        deliveryDate: SelectOrders["deliveryDate"];
        blockingReason: SelectOrders["blockingReason"];
        paymentTerms: SelectOrders["paymentTerms"];
        financialBlockManual: SelectOrders["financialBlockManual"];
        creditLimit: SelectCompanies["creditLimit"];
        creditLimitUninsured: SelectCompanies["creditLimitUninsured"];
        creditLimitUninsuredDate: SelectCompanies["creditLimitUninsuredDate"];
        blockedByUserId: SelectCompanies["blockedByUserId"];
        amount: string | null;
      },
    ): FinanciallyBlockedRow => {
      const openEntrees = openByCompany.get(row.companyUuid) ?? 0;
      const committed = committedByCompany.get(row.companyUuid) ?? 0;
      // Both limits, and the uninsured one only while it is still valid.
      // 187 of the reference's 2.593 customers have no insured limit at all
      // and trade entirely on the uninsured one.
      const creditLimit = effectiveCreditLimit(
        Number(row.creditLimit ?? 0),
        Number(row.creditLimitUninsured ?? 0),
        row.creditLimitUninsuredDate ?? null,
      );
      return {
        kind,
        key: `${kind}-${row.uuid}-${row.deliveryDate ?? ""}`,
        uuid: row.uuid,
        code: row.code,
        debtor: row.debtor,
        debtorNumber: row.debtorNumber,
        deliveryDate: row.deliveryDate,
        blockingReason: row.blockingReason,
        paymentTerms: row.paymentTerms,
        financialBlockManual: row.financialBlockManual ?? false,
        amount: Number(row.amount ?? 0),
        creditLimit,
        openEntrees,
        // Counts what is promised as well as what is billed, matching the rule
        // that put these documents here in the first place.
        creditSpace: creditLimit - openEntrees - committed,
        companyBlocked: row.blockedByUserId !== null,
      };
    };

    return [
      ...orderRows.map((row) => build("Order", row)),
      // A quote carries no manual flag; its hold is the credit rule's.
      ...quoteRows.map((row) =>
        build("Quote", { ...row, financialBlockManual: false }),
      ),
    ].sort((a, b) => a.debtor.localeCompare(b.debtor));
  } catch (error) {
    throw new Error(
      describeError(
        error,
        "Failed to fetch financially blocked quotes and orders",
      ),
    );
  }
};
