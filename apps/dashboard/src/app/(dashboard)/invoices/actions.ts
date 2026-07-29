"use server";

import {
  Companies,
  db,
  InsertInvoices,
  InsertInvoiceSurcharges,
  Invoices,
  InvoiceSurcharges,
  SelectCompanies,
  SelectInvoices,
  SelectInvoiceSurcharges,
} from "@/db";
import {
  InsertInvoiceItems,
  InvoiceItems,
  SelectInvoiceItems,
} from "@/db/schema/invoice-items";
import {
  InsertJournalEntries,
  JournalEntries,
} from "@/db/schema/journal-entries";
import { OrderItems } from "@/db/schema/order-items";
import { Payments, SelectPayments } from "@/db/schema/payments";
import { Orders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  computeQuoteSummary,
  creditRestrictionOn,
  generateUuid,
  getInvoiceVatRatePercent,
  getPaymentTermDueDate,
  toDateString,
} from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq, getTableColumns, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type InvoiceActionResult = {
  invoiceUuid?: string;
  error?: string;
  success?: boolean;
};

export type InvoiceFields = Omit<
  InsertInvoices,
  | "id"
  | "uuid"
  | "invoiceAmountExclVat"
  | "invoiceAmountInclVat"
  | "creditRestriction"
  | "invoiceTotal"
  | "outstanding"
  | "materialsRevenue"
  | "materialsProfit"
  | "materialsProfitReplPrice"
  | "surchargesRevenue"
  | "surchargesProfit"
  | "avgKiloPrice"
  | "totalWeightKg"
  | "createdAt"
  | "updatedAt"
>;

export type InvoiceSurchargeInput = Omit<
  InsertInvoiceSurcharges,
  "id" | "uuid" | "invoiceUuid" | "createdAt" | "updatedAt"
>;

export type InvoiceWithCompany = SelectInvoices & {
  companyName: SelectCompanies["companyName"] | null;
  companyCode: SelectCompanies["id"] | null;
};

export type ReservedOrderItemOption = {
  uuid: string;
  quantity: string;
  productCode: string | null;
  productName: string | null;
  orderId: number;
};

export type InvoiceItemDetail = SelectInvoiceItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type InvoiceDetail = SelectInvoices & {
  companyName: SelectCompanies["companyName"] | null;
  companyCode: SelectCompanies["id"] | null;
  surcharges: SelectInvoiceSurcharges[];
  items: InvoiceItemDetail[];
  payments: SelectPayments[];
};

export type InvoiceHeaderEdit = Pick<
  InvoiceFields,
  "debtorNo" | "invoiceDate" | "expirationDate" | "paymentTerms" | "explanation"
> & {
  // Amounts are computed from the lines when the invoice is raised, but stay
  // correctable afterwards — a credit restriction, an agreed goodwill
  // adjustment or a rounding fix has to be bookable without re-cutting the
  // invoice. Left undefined, the stored amounts are kept as they are.
  invoiceAmountExclVat?: string;
  creditRestriction?: string;
};

// The columns an invoice line copies from the order line it bills.
type InvoiceLineSnapshot = Omit<
  InsertInvoiceItems,
  "id" | "uuid" | "invoiceUuid" | "createdAt" | "updatedAt"
>;

type SalesInvoicePosting = {
  invoiceUuid: string;
  invoiceId: number | null;
  companyUuid: string | null;
  debCreditor: string | null;
  invoiceDate: Date | string | null;
  amountExclVat: number;
  vatAmount: number;
  userId: string | null;
  // When cancelling, the entry is booked with the opposite sign.
  reversal?: boolean;
  // Overrides the default narration — used when booking a correction.
  description?: string;
};

// Placeholder GL account code for sales revenue; swap for the real chart of
// accounts later.
const SALES_REVENUE_ACCOUNT = "8000";

// A sales invoice posts one row to the sales journal — revenue net of VAT, with
// the VAT shown separately and the debtor as the counter-account. A
// cancellation books the same row negated.
const buildSalesInvoiceJournalEntry = (
  posting: SalesInvoicePosting,
): InsertJournalEntries => {
  const sign = posting.reversal ? -1 : 1;
  const bookingDate = posting.invoiceDate
    ? new Date(posting.invoiceDate).toISOString().split("T")[0]
    : null;
  return {
    uuid: generateUuid(),
    bookingDate,
    documentDate: bookingDate,
    documentNo: posting.invoiceId != null ? String(posting.invoiceId) : null,
    journal: "sales",
    account: SALES_REVENUE_ACCOUNT,
    debCreditor: posting.debCreditor,
    description:
      posting.description ??
      (posting.reversal ? "Sales invoice cancelled" : "Sales invoice"),
    amount: (sign * posting.amountExclVat).toFixed(2),
    vat: (sign * posting.vatAmount).toFixed(2),
    companyUuid: posting.companyUuid,
    invoiceUuid: posting.invoiceUuid,
    createdByUserId: posting.userId,
  };
};

export const getInvoices = async (): Promise<InvoiceWithCompany[]> =>
  db
    .select({
      ...getTableColumns(Invoices),
      companyName: Companies.companyName,
      companyCode: Companies.id,
    })
    .from(Invoices)
    .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
    .orderBy(desc(Invoices.createdAt));

export const getInvoicesByCompanyUuid = async (
  companyUuid: string,
): Promise<SelectInvoices[]> =>
  db
    .select()
    .from(Invoices)
    .where(eq(Invoices.companyUuid, companyUuid))
    .orderBy(desc(Invoices.createdAt));

// Delivered order lines for a customer, ready to be billed on an invoice.
// Stock already left at delivery, so invoicing these is purely financial.
export const getReservedOrderItemsForCompany = async (
  companyUuid: string,
): Promise<ReservedOrderItemOption[]> =>
  db
    .select({
      uuid: OrderItems.uuid,
      quantity: OrderItems.quantity,
      productCode: Products.productCode,
      productName: Products.name,
      orderId: Orders.id,
    })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
    .where(
      and(
        eq(Orders.companyUuid, companyUuid),
        eq(OrderItems.status, "delivered"),
      ),
    )
    .orderBy(desc(OrderItems.createdAt));

export const createInvoice = async (
  fields: InvoiceFields,
  surcharges: InvoiceSurchargeInput[] = [],
  orderItemUuids: string[] = [],
): Promise<InvoiceActionResult> => {
  const uuid = generateUuid();

  // Derive the due date from the payment term when one isn't supplied and the
  // term pins a date to the invoice date (e.g. "within 30 days").
  const derivedExpiration =
    fields.expirationDate ??
    (() => {
      const due = getPaymentTermDueDate(
        fields.paymentTerms ?? null,
        fields.invoiceDate ? toDateString(fields.invoiceDate) : null,
      );
      return due ? new Date(`${due}T00:00:00`) : null;
    })();

  try {
    const orderItemRows =
      orderItemUuids.length > 0
        ? await db
            .select()
            .from(OrderItems)
            .where(inArray(OrderItems.uuid, orderItemUuids))
        : [];
    const orderItemByUuid = new Map(orderItemRows.map((row) => [row.uuid, row]));

    // An invoice bills each reservation in full, so its line carries the order
    // line's already-resolved price and cost verbatim rather than pricing
    // anything a second time. The order line resolved both at reservation —
    // the price from the customer's contract, the cost from the stock lot it
    // was allocated — and that resolution is precisely what is being billed.
    const billableLines: InvoiceLineSnapshot[] = [];

    for (const id of orderItemUuids) {
      const row = orderItemByUuid.get(id);
      if (!row) {
        return { error: "One or more selected reservations could not be found." };
      }
      if (row.status !== "delivered") {
        return {
          error:
            "One or more selected lines are not delivered (or were already billed).",
        };
      }

      billableLines.push({
        orderItemUuid: id,
        productUuid: row.productUuid,
        quantity: row.quantity,
        netPrice: row.netPrice,
        amount: row.amount,
        costPrice: row.costPrice,
        costAmount: row.costAmount,
        replacementPrice: row.replacementPrice,
        profit: row.profit,
        profitMargin: row.profitMargin,
        profitReplPrice: row.profitReplPrice,
        // What actually shipped is what gets billed by weight; the planned
        // figure stands in for a line delivered before actuals were recorded.
        weightKg:
          Number(row.kgActual ?? 0) > 0 ? row.kgActual : row.kgPlanned,
      });
    }

    // The invoice's worth, rolled up from those lines and its own surcharges.
    // Materials were previously left out of the header entirely — an invoice
    // reported only its surcharges as revenue, so the goods it billed showed as
    // nothing.
    const summary = computeQuoteSummary({
      lines: billableLines.map((line) => ({
        amount: Number(line.amount ?? 0),
        costAmount: Number(line.costAmount ?? 0),
        replacementCost:
          Number(line.replacementPrice ?? 0) * Number(line.quantity ?? 0),
        weightKg: Number(line.weightKg ?? 0),
        theoreticalWeightKg: Number(line.weightKg ?? 0),
      })),
      surcharges: surcharges.map((surcharge) => ({
        amount: Number(surcharge.amount ?? 0),
        profit: Number(surcharge.profit ?? 0),
      })),
      // VAT follows the invoice's VAT scenario: reverse-charge scenarios charge
      // 0%, everything else the standard rate.
      vatRatePercent: getInvoiceVatRatePercent(fields.vatScenario),
    });

    const exclVat = summary.total.revenue;

    // The surcharge for the credit this payment term extends. The customer
    // earns it back by settling within the term — see registerPayment.
    const creditRestriction = creditRestrictionOn(fields.paymentTerms, exclVat);

    // VAT is charged on the surcharge too, which is why the system carries a
    // dedicated `vat_credit_restriction_creditor` code. So the taxable base is
    // the goods plus the surcharge, not the goods alone — which is also why
    // this can't just use summary.vatAmount.
    const vatRate = getInvoiceVatRatePercent(fields.vatScenario);
    const vatAmount = (exclVat + creditRestriction) * (vatRate / 100);
    const inclVat = exclVat + vatAmount;
    const invoiceTotal = inclVat + creditRestriction;
    // Outstanding in full until payments are registered against it.
    const outstanding = invoiceTotal;

    const user = await currentUser();
    const userId = user?.id;
    if (orderItemUuids.length > 0 && !userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      await tx.insert(Invoices).values({
        ...fields,
        expirationDate: derivedExpiration,
        uuid,
        invoiceAmountExclVat: exclVat.toFixed(2),
        invoiceAmountInclVat: inclVat.toFixed(2),
        creditRestriction: creditRestriction.toFixed(2),
        invoiceTotal: invoiceTotal.toFixed(2),
        outstanding: outstanding.toFixed(2),
        materialsRevenue: summary.materials.revenue.toFixed(2),
        materialsProfit: summary.materials.profit.toFixed(2),
        materialsProfitReplPrice: summary.materials.profitReplPrice.toFixed(2),
        surchargesRevenue: summary.surcharges.revenue.toFixed(2),
        surchargesProfit: summary.surcharges.profit.toFixed(2),
        avgKiloPrice: summary.avgKiloPrice.toFixed(4),
        totalWeightKg: summary.totalWeightKg.toFixed(2),
      });

      // Post the sales invoice to the general ledger.
      const [insertedInvoice] = await tx
        .select({ id: Invoices.id })
        .from(Invoices)
        .where(eq(Invoices.uuid, uuid))
        .limit(1);

      await tx.insert(JournalEntries).values(
        buildSalesInvoiceJournalEntry({
          invoiceUuid: uuid,
          invoiceId: insertedInvoice?.id ?? null,
          companyUuid: fields.companyUuid ?? null,
          debCreditor: fields.debtorNo ?? null,
          invoiceDate: fields.invoiceDate ?? null,
          amountExclVat: exclVat,
          vatAmount,
          userId: userId ?? null,
        }),
      );

      for (const surcharge of surcharges) {
        await tx.insert(InvoiceSurcharges).values({
          ...surcharge,
          uuid: generateUuid(),
          invoiceUuid: uuid,
        });
      }

      for (const line of billableLines) {
        // Guard: only bill a line that's still "delivered" — a concurrent
        // invoice or cancellation can't double-bill it. Stock already left at
        // delivery, so billing is purely financial: no stock change, no
        // movement — just the invoice line (the journal posting is booked
        // once for the whole invoice above).
        const [itemUpdateResult] = await tx
          .update(OrderItems)
          .set({ status: "invoiced" })
          .where(
            and(
              eq(OrderItems.uuid, line.orderItemUuid),
              eq(OrderItems.status, "delivered"),
            ),
          );

        if (itemUpdateResult.affectedRows === 0) {
          throw new Error(
            "One of the selected lines was already billed or cancelled — please refresh and try again.",
          );
        }

        await tx.insert(InvoiceItems).values({
          ...line,
          uuid: generateUuid(),
          invoiceUuid: uuid,
        });
      }
    });

    revalidatePath("/invoices");
    revalidatePath("/orders");
    revalidatePath("/stock");
    revalidatePath("/stock-movements");
    return { success: true, invoiceUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create invoice",
    };
  }
};

export const getInvoiceDetail = async (
  uuid: string,
): Promise<InvoiceDetail | null> => {
  const [invoice] = await db
    .select({
      ...getTableColumns(Invoices),
      companyName: Companies.companyName,
      companyCode: Companies.id,
    })
    .from(Invoices)
    .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
    .where(eq(Invoices.uuid, uuid))
    .limit(1);

  if (!invoice) {
    return null;
  }

  const surcharges = await db
    .select()
    .from(InvoiceSurcharges)
    .where(eq(InvoiceSurcharges.invoiceUuid, uuid));

  const items = await db
    .select({
      ...getTableColumns(InvoiceItems),
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(InvoiceItems)
    .leftJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
    .where(eq(InvoiceItems.invoiceUuid, uuid));

  const payments = await db
    .select()
    .from(Payments)
    .where(eq(Payments.invoiceUuid, uuid))
    .orderBy(desc(Payments.paymentDate));

  return { ...invoice, surcharges, items, payments };
};

export const cancelInvoice = async (
  uuid: string,
): Promise<InvoiceActionResult> => {
  try {
    const [invoice] = await db
      .select()
      .from(Invoices)
      .where(eq(Invoices.uuid, uuid))
      .limit(1);

    if (!invoice) {
      return { error: "Invoice not found." };
    }
    if (invoice.cancelled) {
      return { error: "This invoice is already cancelled." };
    }

    const items = await db
      .select()
      .from(InvoiceItems)
      .where(eq(InvoiceItems.invoiceUuid, uuid));

    const user = await currentUser();
    const userId = user?.id;
    if (items.length > 0 && !userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(Invoices)
        .set({ cancelled: true })
        .where(eq(Invoices.uuid, uuid));

      // Reverse the sales invoice's ledger posting.
      await tx.insert(JournalEntries).values(
        buildSalesInvoiceJournalEntry({
          invoiceUuid: uuid,
          invoiceId: invoice.id,
          companyUuid: invoice.companyUuid,
          debCreditor: invoice.debtorNo,
          invoiceDate: invoice.invoiceDate,
          amountExclVat: Number(invoice.invoiceAmountExclVat),
          vatAmount:
            Number(invoice.invoiceAmountInclVat) -
            Number(invoice.invoiceAmountExclVat),
          userId: userId ?? null,
          reversal: true,
        }),
      );

      // Cancelling an invoice reverses only the money. The stock left at
      // delivery, so the lines go back to "delivered" (billable again) and
      // stock is NOT restored — recovering shipped goods is a return, not an
      // invoice cancellation.
      for (const item of items) {
        await tx
          .update(OrderItems)
          .set({ status: "delivered" })
          .where(eq(OrderItems.uuid, item.orderItemUuid));
      }
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${uuid}`);
    revalidatePath("/orders");
    revalidatePath("/stock");
    revalidatePath("/stock-movements");
    return { success: true, invoiceUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to cancel invoice",
    };
  }
};

export const updateInvoice = async (
  uuid: string,
  fields: InvoiceHeaderEdit,
): Promise<InvoiceActionResult> => {
  try {
    const [invoice] = await db
      .select()
      .from(Invoices)
      .where(eq(Invoices.uuid, uuid))
      .limit(1);

    if (!invoice) {
      return { error: "Invoice not found." };
    }
    if (invoice.cancelled) {
      return { error: "Cannot edit a cancelled invoice." };
    }

    const {
      invoiceAmountExclVat: exclVatOverride,
      creditRestriction: creditRestrictionOverride,
      ...headerFields
    } = fields;

    // Fill in the due date from the payment term when it wasn't set explicitly.
    const expirationDate =
      headerFields.expirationDate ??
      (() => {
        const due = getPaymentTermDueDate(
          headerFields.paymentTerms ?? null,
          headerFields.invoiceDate
            ? toDateString(headerFields.invoiceDate)
            : null,
        );
        return due ? new Date(`${due}T00:00:00`) : null;
      })();

    if (exclVatOverride === undefined && creditRestrictionOverride === undefined) {
      await db
        .update(Invoices)
        .set({ ...headerFields, expirationDate })
        .where(eq(Invoices.uuid, uuid));
    } else {
      const previousExclVat = Number(invoice.invoiceAmountExclVat);
      const previousVat =
        Number(invoice.invoiceAmountInclVat) - previousExclVat;

      const exclVat =
        exclVatOverride === undefined
          ? previousExclVat
          : Number(exclVatOverride);
      const creditRestriction =
        creditRestrictionOverride === undefined
          ? Number(invoice.creditRestriction)
          : Number(creditRestrictionOverride);

      if (!Number.isFinite(exclVat) || !Number.isFinite(creditRestriction)) {
        return { error: "Enter a valid amount." };
      }

      // VAT is charged on the credit restriction too — see createInvoice.
      const vatRate = getInvoiceVatRatePercent(invoice.vatScenario);
      const vatAmount = (exclVat + creditRestriction) * (vatRate / 100);
      const inclVat = exclVat + vatAmount;
      const invoiceTotal = inclVat + creditRestriction;

      // Move the balance by the correction rather than resetting it to the new
      // total: payments may already have been registered against this invoice,
      // and overwriting outstanding would silently un-receive that money.
      const outstanding =
        Number(invoice.outstanding) +
        (invoiceTotal - Number(invoice.invoiceTotal));

      const user = await currentUser();
      const userId = user?.id ?? null;

      await db.transaction(async (tx) => {
        await tx
          .update(Invoices)
          .set({
            ...headerFields,
            expirationDate,
            invoiceAmountExclVat: exclVat.toFixed(2),
            invoiceAmountInclVat: inclVat.toFixed(2),
            creditRestriction: creditRestriction.toFixed(2),
            invoiceTotal: invoiceTotal.toFixed(2),
            outstanding: outstanding.toFixed(2),
          })
          .where(eq(Invoices.uuid, uuid));

        // Correcting an amount has to move the ledger with it, or the sales
        // journal and the invoice stop agreeing. The correction is booked as
        // its own entry for the difference rather than by rewriting the
        // original posting, so the trail keeps both the figure first issued and
        // the adjustment made to it.
        //
        // The line-level split is deliberately left alone: it remains the
        // record of what was actually billed, and a header correction is by
        // definition something the lines don't account for.
        const exclVatDelta = exclVat - previousExclVat;
        const vatDelta = vatAmount - previousVat;

        if (exclVatDelta !== 0 || vatDelta !== 0) {
          await tx.insert(JournalEntries).values(
            buildSalesInvoiceJournalEntry({
              invoiceUuid: uuid,
              invoiceId: invoice.id,
              companyUuid: invoice.companyUuid,
              debCreditor:
                headerFields.debtorNo === undefined
                  ? invoice.debtorNo
                  : headerFields.debtorNo,
              invoiceDate:
                headerFields.invoiceDate === undefined
                  ? invoice.invoiceDate
                  : headerFields.invoiceDate,
              amountExclVat: exclVatDelta,
              vatAmount: vatDelta,
              userId,
              description: "Sales invoice corrected",
            }),
          );
        }
      });
    }
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update invoice",
    };
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${uuid}`);
  redirect(`/invoices/${uuid}`);
};
