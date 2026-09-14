import "server-only";

import { db } from "@/db";
import { Companies } from "@/db/schema/companies";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import {
  assessCredit,
  CreditAssessment,
  orderBlockingPolicy,
} from "@/lib/helpers";
import { and, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";

type CreditQuery = Pick<typeof db, "select">;

export type CreditCheckInput = {
  companyUuid: string;
  /** The order being placed, excluding VAT. */
  orderAmount: number;
  /**
   * The order being assessed. Its lines are already written when the check
   * runs, so they are left out of the committed total and counted once, as
   * `orderAmount`.
   */
  excludeOrderUuid?: string;
};

/**
 * An invoice's outstanding amount with its VAT taken out.
 *
 * `Invoices.outstanding` carries VAT, and the credit rule is excl. VAT (see
 * `assessCredit`). The share still open is assumed to carry VAT in the same
 * proportion as the invoice, so it is scaled by excl ÷ incl. An invoice with no
 * incl. total recorded is taken as it stands.
 */
const netOutstanding = sql<string>`COALESCE(SUM(
  CASE
    WHEN ${Invoices.invoiceAmountInclVat} <> 0
      THEN ${Invoices.outstanding} * ${Invoices.invoiceAmountExclVat} /
           ${Invoices.invoiceAmountInclVat}
    ELSE ${Invoices.outstanding}
  END
), 0)`;

/**
 * What a debtor still owes us, excluding VAT.
 *
 * Cancelled invoices are excluded. A cancelled invoice is void — the customer
 * owes nothing on it — so counting it would hold orders against money that was
 * never really receivable.
 */
export const getOpenReceivables = async (
  tx: CreditQuery,
  companyUuid: string,
): Promise<number> => {
  const [row] = await tx
    .select({
      outstanding: netOutstanding,
    })
    .from(Invoices)
    .where(
      and(eq(Invoices.companyUuid, companyUuid), eq(Invoices.cancelled, false)),
    );

  return Number(row?.outstanding ?? 0);
};

/**
 * The due date of the oldest invoice this debtor still owes money on.
 *
 * `expirationDate` is the due date and is nullable — an invoice on a letter of
 * credit or against documents has no derivable deadline — and those are excluded rather than treated as
 * infinitely overdue: `assessCredit` must not hold an order on a date nobody
 * agreed to. Cancelled invoices are void and excluded for the same reason they
 * are excluded from the balance.
 *
 * Only invoices with something still outstanding count. A paid invoice that was
 * once late is not a reason to hold anything.
 */
export const getOldestOpenDueDate = async (
  tx: CreditQuery,
  companyUuid: string,
): Promise<string | null> => {
  const [row] = await tx
    .select({
      oldestDueDate: sql<string | null>`MIN(${Invoices.expirationDate})`,
    })
    .from(Invoices)
    .where(
      and(
        eq(Invoices.companyUuid, companyUuid),
        eq(Invoices.cancelled, false),
        isNotNull(Invoices.expirationDate),
        sql`${Invoices.outstanding} > 0`,
      ),
    );

  return row?.oldestDueDate ?? null;
};

/**
 * The invoice date of the oldest invoice this debtor still owes money on — the
 * reference Debtor panel's `Oldest invoice date open entrees`, beside the
 * oldest due date.
 */
export const getOldestOpenInvoiceDate = async (
  tx: CreditQuery,
  companyUuid: string,
): Promise<string | null> => {
  const [row] = await tx
    .select({
      oldestInvoiceDate: sql<string | null>`MIN(${Invoices.invoiceDate})`,
    })
    .from(Invoices)
    .where(
      and(
        eq(Invoices.companyUuid, companyUuid),
        eq(Invoices.cancelled, false),
        sql`${Invoices.outstanding} > 0`,
      ),
    );

  return row?.oldestInvoiceDate ?? null;
};

/** Open receivables for every debtor at once, for the overview queries. */
export const getOpenReceivablesByCompany = async (
  tx: CreditQuery,
): Promise<Map<string, number>> => {
  const rows = await tx
    .select({
      companyUuid: Invoices.companyUuid,
      outstanding: netOutstanding,
    })
    .from(Invoices)
    .where(and(isNotNull(Invoices.companyUuid), eq(Invoices.cancelled, false)))
    .groupBy(Invoices.companyUuid);

  return new Map(
    rows.map((row) => [row.companyUuid ?? "", Number(row.outstanding)]),
  );
};

/**
 * The part of an order line that has not been billed yet, in money.
 *
 * A line billed in instalments is half receivable and half invoice, and its full
 * amount must not be counted as committed — the billed half is already sitting
 * in `Invoices.outstanding`, so counting the whole line again would charge the
 * customer's limit twice for the same goods and hold orders that should pass.
 *
 * A line with no quantity can't be apportioned, so it counts in full.
 */
const uninvoicedLineAmount = sql<string>`COALESCE(SUM(
  CASE
    WHEN ${OrderItems.quantity} > 0
      THEN ${OrderItems.amount} *
           (${OrderItems.quantity} - ${OrderItems.invoicedQuantity}) /
           ${OrderItems.quantity}
    ELSE ${OrderItems.amount}
  END
), 0)`;

/**
 * Order lines taken but not yet invoiced — receivables in waiting.
 *
 * Only "reserved" and "delivered" count. A fully invoiced line has already
 * become an invoice and is counted there, so including it would charge the
 * customer's limit twice for the same goods; cancelled and returned lines will
 * never become receivables at all. A part-billed line stays at "delivered" and
 * contributes only its unbilled share.
 *
 * Line amounts are stored excl. VAT, which is what the credit rule weighs, so
 * they are summed as they stand.
 *
 * `excludeOrderUuid` leaves out the order being assessed, whose lines are
 * already written by the time the credit check runs.
 */
export const getCommittedOrderValue = async (
  tx: CreditQuery,
  companyUuid: string,
  excludeOrderUuid?: string,
): Promise<number> => {
  const [row] = await tx
    .select({ amount: uninvoicedLineAmount })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .where(
      and(
        eq(Orders.companyUuid, companyUuid),
        inArray(OrderItems.status, ["reserved", "delivered"]),
        excludeOrderUuid ? ne(Orders.uuid, excludeOrderUuid) : undefined,
      ),
    );

  return Number(row?.amount ?? 0);
};

/** Committed order value for every customer at once, for the overviews. */
export const getCommittedOrderValueByCompany = async (
  tx: CreditQuery,
): Promise<Map<string, number>> => {
  const rows = await tx
    .select({
      companyUuid: Orders.companyUuid,
      amount: uninvoicedLineAmount,
    })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .where(inArray(OrderItems.status, ["reserved", "delivered"]))
    .groupBy(Orders.companyUuid);

  return new Map(
    rows.map((row) => [row.companyUuid, Number(row.amount)]),
  );
};

/**
 * Reads the debtor's limit and balance and applies the credit rule to an order
 * about to be placed. Takes the surrounding transaction so the figures it reads
 * are the ones the order is actually being written against.
 */
export const checkCredit = async (
  tx: CreditQuery,
  { companyUuid, orderAmount, excludeOrderUuid }: CreditCheckInput,
): Promise<CreditAssessment> => {
  const [company] = await tx
    .select({
      creditLimit: Companies.creditLimit,
      // The second limit. A customer's room is the two together — see
      // `assessCredit`, and `docs/reference-system/credit-and-blocking.md` for
      // the 2.593 rows it was proved on.
      creditLimitUninsured: Companies.creditLimitUninsured,
      creditLimitUninsuredDate: Companies.creditLimitUninsuredDate,
      blockedByUserId: Companies.blockedByUserId,
      // "No financial blockage" on the customer's order settings means exactly
      // that: the credit rule may record an overrun against the order but must
      // not hold it.
      orderSettings: Companies.orderSettings,
    })
    .from(Companies)
    .where(eq(Companies.uuid, companyUuid))
    .limit(1);

  const openReceivables = await getOpenReceivables(tx, companyUuid);
  const oldestOpenDueDate = await getOldestOpenDueDate(tx, companyUuid);
  const committedOrders = await getCommittedOrderValue(
    tx,
    companyUuid,
    excludeOrderUuid,
  );

  return assessCredit({
    creditLimit: Number(company?.creditLimit ?? 0),
    creditLimitUninsured: Number(company?.creditLimitUninsured ?? 0),
    creditLimitUninsuredValidUntil: company?.creditLimitUninsuredDate ?? null,
    oldestOpenDueDate,
    openReceivables,
    committedOrders,
    orderAmount,
    companyBlocked: !!company?.blockedByUserId,
    financialBlockingWaived: orderBlockingPolicy(company?.orderSettings)
      .financialBlockingWaived,
  });
};
