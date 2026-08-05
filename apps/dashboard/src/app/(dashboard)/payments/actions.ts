"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Invoices, SelectInvoices } from "@/db/schema/invoices";
import { JournalEntries } from "@/db/schema/journal-entries";
import { Payments, SelectPayments } from "@/db/schema/payments";
import { PurchaseInvoices } from "@/db/schema/purchase-invoices";
import { PaymentMethod } from "@/lib/enums";
import {
  buildSettlementEntry,
  LEDGER_ACCOUNTS,
} from "@/lib/server/ledger";
import {
  allowedCreditRestrictionDeduction,
  allowedEarlyPaymentDiscount,
  describeError,
  generateUuid,
  toDateString,
  todayDateString,
} from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type PaymentActionResult = {
  paymentUuid?: string;
  error?: string;
  success?: boolean;
};

export type PaymentListItem = SelectPayments & {
  companyName: SelectCompanies["companyName"] | null;
  invoiceId: number | null;
  purchaseInvoiceId: number | null;
};

export type PaymentDetail = PaymentListItem & {
  invoiceDocumentType: SelectInvoices["documentType"] | null;
  invoiceDate: SelectInvoices["invoiceDate"] | null;
  invoiceOutstanding: SelectInvoices["outstanding"] | null;
  invoicePaymentTerms: SelectInvoices["paymentTerms"] | null;
  /** Cash plus the discount taken — what the payment settled in total. */
  settledAmount: number;
};

export type RegisterPaymentInput = {
  invoiceUuid?: string;
  purchaseInvoiceUuid?: string;
  paymentDate: string;
  amount: string;
  method: PaymentMethod;
  reference?: string;
  /**
   * Take the deductions the term allows on this payment date — the
   * early-payment discount and the credit restriction earned back.
   */
  claimDiscount?: boolean;
};

// What an invoice would settle for if paid on a given date: the cash due, and
// what the payer is entitled to keep back. Drives the register-payment form so
// the figure is filled in rather than worked out by hand.
export type PaymentPreview = {
  outstanding: number;
  /** Early-settlement discount the term grants. */
  discountAvailable: number;
  /** Credit restriction earned back by settling within the term. */
  creditRestrictionAvailable: number;
  /** The two above, capped at what is actually outstanding. */
  deductionAvailable: number;
  cashDue: number;
};

// The deductions a payer may keep back on a given date. Both are deadlines
// rather than sliding scales, and together they can never exceed the balance.
const settlementDeductions = (
  invoice: {
    paymentTerms: SelectInvoices["paymentTerms"];
    invoiceDate: SelectInvoices["invoiceDate"];
    invoiceAmountExclVat: string;
    creditRestriction: string;
  },
  outstanding: number,
  paymentDate: string,
) => {
  const invoiceDate = invoice.invoiceDate
    ? toDateString(invoice.invoiceDate)
    : null;

  const discountAvailable = allowedEarlyPaymentDiscount({
    term: invoice.paymentTerms,
    invoiceDate,
    paymentDate,
    baseAmount: Number(invoice.invoiceAmountExclVat),
  });

  const creditRestrictionAvailable = allowedCreditRestrictionDeduction({
    term: invoice.paymentTerms,
    invoiceDate,
    paymentDate,
    creditRestriction: Number(invoice.creditRestriction),
  });

  const deductionAvailable = Math.min(
    discountAvailable + creditRestrictionAvailable,
    Math.max(outstanding, 0),
  );

  return {
    discountAvailable,
    creditRestrictionAvailable,
    deductionAvailable,
  };
};

// The cash and discount accounts these settlements post to, from the chart of
// accounts rather than from a local guess. The discount account moved from 8600
// to 4700: a discount granted is a cost of collecting early, not negative
// revenue, and 8xxx is the revenue range.
const BANK_ACCOUNT = LEDGER_ACCOUNTS.bank;
const DISCOUNT_GRANTED_ACCOUNT = LEDGER_ACCOUNTS.discountGranted;

export const getPayments = async (): Promise<PaymentListItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(Payments),
        companyName: Companies.companyName,
        invoiceId: Invoices.id,
        purchaseInvoiceId: PurchaseInvoices.id,
      })
      .from(Payments)
      .leftJoin(Companies, eq(Payments.companyUuid, Companies.uuid))
      .leftJoin(Invoices, eq(Payments.invoiceUuid, Invoices.uuid))
      .leftJoin(
        PurchaseInvoices,
        eq(Payments.purchaseInvoiceUuid, PurchaseInvoices.uuid),
      )
      .orderBy(desc(Payments.paymentDate), desc(Payments.id));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch payments"));
  }
};

/**
 * One payment with the counterparty and the invoice it settled.
 *
 * `settledAmount` is the cash plus the early-payment discount taken: an invoice
 * can close in full even though less money arrived than was billed, and the
 * cash figure alone does not show that.
 */
export const getPaymentDetail = async (
  uuid: string,
): Promise<PaymentDetail | null> => {
  try {
    const [row] = await db
      .select({
        ...getTableColumns(Payments),
        companyName: Companies.companyName,
        invoiceId: Invoices.id,
        invoiceDocumentType: Invoices.documentType,
        invoiceDate: Invoices.invoiceDate,
        invoiceOutstanding: Invoices.outstanding,
        invoicePaymentTerms: Invoices.paymentTerms,
        purchaseInvoiceId: PurchaseInvoices.id,
      })
      .from(Payments)
      .leftJoin(Companies, eq(Payments.companyUuid, Companies.uuid))
      .leftJoin(Invoices, eq(Payments.invoiceUuid, Invoices.uuid))
      .leftJoin(
        PurchaseInvoices,
        eq(Payments.purchaseInvoiceUuid, PurchaseInvoices.uuid),
      )
      .where(eq(Payments.uuid, uuid))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      ...row,
      settledAmount: Number(row.amount) + Number(row.discountAmount),
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch payment"));
  }
};

export const getPaymentsForInvoice = async (
  invoiceUuid: string,
): Promise<SelectPayments[]> =>
  db
    .select()
    .from(Payments)
    .where(eq(Payments.invoiceUuid, invoiceUuid))
    .orderBy(desc(Payments.paymentDate));

export const getInvoicePaymentPreview = async (
  invoiceUuid: string,
  paymentDate: string = todayDateString(),
): Promise<PaymentPreview | null> => {
  const [invoice] = await db
    .select()
    .from(Invoices)
    .where(eq(Invoices.uuid, invoiceUuid))
    .limit(1);

  if (!invoice) {
    return null;
  }

  const outstanding = Number(invoice.outstanding);
  const deductions = settlementDeductions(invoice, outstanding, paymentDate);

  return {
    outstanding,
    ...deductions,
    cashDue: outstanding - deductions.deductionAvailable,
  };
};

export const registerPayment = async (
  input: RegisterPaymentInput,
): Promise<PaymentActionResult> => {
  try {
    const isSales = Boolean(input.invoiceUuid);
    const isPurchase = Boolean(input.purchaseInvoiceUuid);

    if (isSales === isPurchase) {
      return {
        error: "A payment settles either a sales invoice or a purchase invoice.",
      };
    }

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: "Enter an amount greater than zero." };
    }

    const user = await currentUser();
    const userId = user?.id ?? null;
    const uuid = generateUuid();
    const paymentDate = input.paymentDate || todayDateString();

    if (input.invoiceUuid) {
      const invoiceUuid = input.invoiceUuid;
      const [invoice] = await db
        .select()
        .from(Invoices)
        .where(eq(Invoices.uuid, invoiceUuid))
        .limit(1);

      if (!invoice) {
        return { error: "Invoice not found." };
      }
      if (invoice.cancelled) {
        return { error: "This invoice is cancelled." };
      }

      const outstanding = Number(invoice.outstanding);
      if (outstanding <= 0) {
        return { error: "This invoice is already settled." };
      }

      // Deductions are only ever offered, never forced — a customer who pays
      // early without keeping anything back has simply paid more.
      const discountAmount = input.claimDiscount
        ? settlementDeductions(invoice, outstanding, paymentDate)
            .deductionAvailable
        : 0;

      const settled = amount + discountAmount;
      if (settled - outstanding > 0.005) {
        return {
          error: `That settles more than is outstanding (€${outstanding.toFixed(2)} remaining).`,
        };
      }

      await db.transaction(async (tx) => {
        await tx.insert(Payments).values({
          uuid,
          invoiceUuid,
          companyUuid: invoice.companyUuid,
          paymentDate,
          amount: amount.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          method: input.method,
          reference: input.reference ?? null,
          createdByUserId: userId,
        });

        await tx
          .update(Invoices)
          .set({ outstanding: (outstanding - settled).toFixed(2) })
          .where(eq(Invoices.uuid, invoiceUuid));

        await tx.insert(JournalEntries).values(
          buildSettlementEntry({
            invoiceUuid,
            purchaseInvoiceUuid: null,
            documentNo: String(invoice.id),
            companyUuid: invoice.companyUuid,
            debCreditor: invoice.debtorNo,
            paymentDate,
            amount,
            account: BANK_ACCOUNT,
            description: "Customer payment received",
            userId,
          }),
        );

        // The discount granted is a real cost, so it gets its own entry rather
        // than quietly vanishing into the difference between billed and banked.
        if (discountAmount > 0) {
          await tx.insert(JournalEntries).values(
            buildSettlementEntry({
              invoiceUuid,
              purchaseInvoiceUuid: null,
              documentNo: String(invoice.id),
              companyUuid: invoice.companyUuid,
              debCreditor: invoice.debtorNo,
              paymentDate,
              amount: discountAmount,
              account: DISCOUNT_GRANTED_ACCOUNT,
              description: "Early payment discount granted",
              userId,
            }),
          );
        }
      });

      revalidatePath("/invoices");
      revalidatePath(`/invoices/${invoiceUuid}`);
    } else if (input.purchaseInvoiceUuid) {
      const purchaseInvoiceUuid = input.purchaseInvoiceUuid;
      const [purchaseInvoice] = await db
        .select()
        .from(PurchaseInvoices)
        .where(eq(PurchaseInvoices.uuid, purchaseInvoiceUuid))
        .limit(1);

      if (!purchaseInvoice) {
        return { error: "Purchase invoice not found." };
      }
      if (purchaseInvoice.cancelled) {
        return { error: "This purchase invoice is cancelled." };
      }

      const outstanding = Number(purchaseInvoice.outstanding);
      if (outstanding <= 0) {
        return { error: "This purchase invoice is already settled." };
      }
      if (amount - outstanding > 0.005) {
        return {
          error: `That pays more than is outstanding (€${outstanding.toFixed(2)} remaining).`,
        };
      }

      await db.transaction(async (tx) => {
        await tx.insert(Payments).values({
          uuid,
          purchaseInvoiceUuid,
          companyUuid: purchaseInvoice.companyUuid,
          paymentDate,
          amount: amount.toFixed(2),
          method: input.method,
          reference: input.reference ?? null,
          createdByUserId: userId,
        });

        await tx
          .update(PurchaseInvoices)
          .set({ outstanding: (outstanding - amount).toFixed(2) })
          .where(eq(PurchaseInvoices.uuid, purchaseInvoiceUuid));

        await tx.insert(JournalEntries).values(
          buildSettlementEntry({
            invoiceUuid: null,
            purchaseInvoiceUuid,
            documentNo: String(purchaseInvoice.id),
            companyUuid: purchaseInvoice.companyUuid,
            debCreditor: purchaseInvoice.creditorNo,
            paymentDate,
            // Paying a supplier moves cash out.
            amount: -amount,
            account: BANK_ACCOUNT,
            description: "Supplier payment made",
            userId,
          }),
        );
      });

      revalidatePath("/purchase-invoices");
    }

    revalidatePath("/payments");
    revalidatePath("/credit-information-customers");
    return { success: true, paymentUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to register payment",
    };
  }
};

// Puts the money back on the invoice and negates the ledger entries. Used when
// a payment was booked against the wrong invoice or never cleared the bank.
export const reversePayment = async (
  paymentUuid: string,
): Promise<PaymentActionResult> => {
  try {
    const [payment] = await db
      .select()
      .from(Payments)
      .where(eq(Payments.uuid, paymentUuid))
      .limit(1);

    if (!payment) {
      return { error: "Payment not found." };
    }
    if (payment.reversed) {
      return { error: "This payment is already reversed." };
    }

    const user = await currentUser();
    const userId = user?.id ?? null;
    const amount = Number(payment.amount);
    const discountAmount = Number(payment.discountAmount);
    const settled = amount + discountAmount;

    await db.transaction(async (tx) => {
      const [claimed] = await tx
        .update(Payments)
        .set({ reversed: true, reversedAt: new Date() })
        .where(eq(Payments.uuid, paymentUuid));

      if (claimed.affectedRows === 0) {
        throw new Error(
          "This payment changed while reversing it — please refresh and try again.",
        );
      }

      if (payment.invoiceUuid) {
        const [invoice] = await tx
          .select()
          .from(Invoices)
          .where(eq(Invoices.uuid, payment.invoiceUuid))
          .limit(1);

        if (invoice) {
          await tx
            .update(Invoices)
            .set({
              outstanding: (Number(invoice.outstanding) + settled).toFixed(2),
            })
            .where(eq(Invoices.uuid, payment.invoiceUuid));

          await tx.insert(JournalEntries).values(
            buildSettlementEntry({
              invoiceUuid: payment.invoiceUuid,
              purchaseInvoiceUuid: null,
              documentNo: String(invoice.id),
              companyUuid: invoice.companyUuid,
              debCreditor: invoice.debtorNo,
              paymentDate: payment.paymentDate,
              amount: -amount,
              account: BANK_ACCOUNT,
              description: "Customer payment reversed",
              userId,
            }),
          );

          if (discountAmount > 0) {
            await tx.insert(JournalEntries).values(
              buildSettlementEntry({
                invoiceUuid: payment.invoiceUuid,
                purchaseInvoiceUuid: null,
                documentNo: String(invoice.id),
                companyUuid: invoice.companyUuid,
                debCreditor: invoice.debtorNo,
                paymentDate: payment.paymentDate,
                amount: -discountAmount,
                account: DISCOUNT_GRANTED_ACCOUNT,
                description: "Early payment discount reversed",
                userId,
              }),
            );
          }
        }
      }

      if (payment.purchaseInvoiceUuid) {
        const [purchaseInvoice] = await tx
          .select()
          .from(PurchaseInvoices)
          .where(eq(PurchaseInvoices.uuid, payment.purchaseInvoiceUuid))
          .limit(1);

        if (purchaseInvoice) {
          await tx
            .update(PurchaseInvoices)
            .set({
              outstanding: (
                Number(purchaseInvoice.outstanding) + amount
              ).toFixed(2),
            })
            .where(eq(PurchaseInvoices.uuid, payment.purchaseInvoiceUuid));

          await tx.insert(JournalEntries).values(
            buildSettlementEntry({
              invoiceUuid: null,
              purchaseInvoiceUuid: payment.purchaseInvoiceUuid,
              documentNo: String(purchaseInvoice.id),
              companyUuid: purchaseInvoice.companyUuid,
              debCreditor: purchaseInvoice.creditorNo,
              paymentDate: payment.paymentDate,
              amount,
              account: BANK_ACCOUNT,
              description: "Supplier payment reversed",
              userId,
            }),
          );
        }
      }
    });

    revalidatePath("/payments");
    revalidatePath("/invoices");
    revalidatePath("/purchase-invoices");
    revalidatePath("/credit-information-customers");
    return { success: true, paymentUuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to reverse payment",
    };
  }
};
