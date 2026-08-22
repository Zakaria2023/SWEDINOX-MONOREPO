import "server-only";

import { and, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { Companies } from "@/db/schema/companies";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import {
  assessCredit,
  CreditAssessment,
  grossUpCommittedOrderValue,
  orderBlockingPolicy,
} from "@/lib/helpers";
import { InvoicePaymentTerm } from "@/lib/enums";

type CreditQuery = Pick<typeof db, "select">;

export type CreditCheckInput = {
  companyUuid: string;
  /** Gross value of the order being placed. */
  orderAmount: number;
  paymentTerms: InvoicePaymentTerm | null | undefined;
  /**
   * The order being assessed. Its lines are already written when the check
   * runs, so they are left out of the committed total and counted once, as
   * `orderAmount`.
   */
  excludeOrderUuid?: string;
};

/**
 * What a debtor still owes us.
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
      outstanding: sql<string>`COALESCE(SUM(${Invoices.outstanding}), 0)`,
    })
    .from(Invoices)
    .where(
      and(eq(Invoices.companyUuid, companyUuid), eq(Invoices.cancelled, false)),
    );

  return Number(row?.outstanding ?? 0);
};

/** Open receivables for every debtor at once, for the overview queries. */
export const getOpenReceivablesByCompany = async (
  tx: CreditQuery,
): Promise<Map<string, number>> => {
  const rows = await tx
    .select({
      companyUuid: Invoices.companyUuid,
      outstanding: sql<string>`COALESCE(SUM(${Invoices.outstanding}), 0)`,
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
 * Line amounts are stored net and are grossed up here, because the receivables
 * they are added to are gross — see `grossUpCommittedOrderValue`.
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
    .select({
      amount: uninvoicedLineAmount,
      calculateVat: Companies.calculateVat,
    })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .innerJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .where(
      and(
        eq(Orders.companyUuid, companyUuid),
        inArray(OrderItems.status, ["reserved", "delivered"]),
        excludeOrderUuid ? ne(Orders.uuid, excludeOrderUuid) : undefined,
      ),
    )
    .groupBy(Companies.calculateVat);

  return grossUpCommittedOrderValue(
    Number(row?.amount ?? 0),
    row?.calculateVat,
  );
};

/** Committed order value for every customer at once, for the overviews. */
export const getCommittedOrderValueByCompany = async (
  tx: CreditQuery,
): Promise<Map<string, number>> => {
  const rows = await tx
    .select({
      companyUuid: Orders.companyUuid,
      amount: uninvoicedLineAmount,
      calculateVat: Companies.calculateVat,
    })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .innerJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .where(inArray(OrderItems.status, ["reserved", "delivered"]))
    .groupBy(Orders.companyUuid, Companies.calculateVat);

  return new Map(
    rows.map((row) => [
      row.companyUuid,
      grossUpCommittedOrderValue(Number(row.amount), row.calculateVat),
    ]),
  );
};

/**
 * Reads the debtor's limit and balance and applies the credit rule to an order
 * about to be placed. Takes the surrounding transaction so the figures it reads
 * are the ones the order is actually being written against.
 */
export const checkCredit = async (
  tx: CreditQuery,
  {
    companyUuid,
    orderAmount,
    paymentTerms,
    excludeOrderUuid,
  }: CreditCheckInput,
): Promise<CreditAssessment> => {
  const [company] = await tx
    .select({
      creditLimit: Companies.creditLimit,
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
  const committedOrders = await getCommittedOrderValue(
    tx,
    companyUuid,
    excludeOrderUuid,
  );

  return assessCredit({
    creditLimit: Number(company?.creditLimit ?? 0),
    openReceivables,
    committedOrders,
    orderAmount,
    paymentTerms,
    companyBlocked: !!company?.blockedByUserId,
    financialBlockingWaived: orderBlockingPolicy(company?.orderSettings)
      .financialBlockingWaived,
  });
};
