import "server-only";

import { and, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { Companies } from "@/db/schema/companies";
import { Invoices } from "@/db/schema/invoices";
import { assessCredit, CreditAssessment } from "@/lib/helpers";
import { InvoicePaymentTerm } from "@/lib/enums";

type CreditQuery = Pick<typeof db, "select">;

export type CreditCheckInput = {
  companyUuid: string;
  /** Gross value of the order being placed. */
  orderAmount: number;
  paymentTerms: InvoicePaymentTerm | null | undefined;
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
 * Reads the debtor's limit and balance and applies the credit rule to an order
 * about to be placed. Takes the surrounding transaction so the figures it reads
 * are the ones the order is actually being written against.
 */
export const checkCredit = async (
  tx: CreditQuery,
  { companyUuid, orderAmount, paymentTerms }: CreditCheckInput,
): Promise<CreditAssessment> => {
  const [company] = await tx
    .select({
      creditLimit: Companies.creditLimit,
      blockedByUserId: Companies.blockedByUserId,
    })
    .from(Companies)
    .where(eq(Companies.uuid, companyUuid))
    .limit(1);

  const openReceivables = await getOpenReceivables(tx, companyUuid);

  return assessCredit({
    creditLimit: Number(company?.creditLimit ?? 0),
    openReceivables,
    orderAmount,
    paymentTerms,
    companyBlocked: !!company?.blockedByUserId,
  });
};
