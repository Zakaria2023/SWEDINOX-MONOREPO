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
import { JournalEntries } from "@/db/schema/journal-entries";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Payments, SelectPayments } from "@/db/schema/payments";
import { Orders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { mailDocument, sendInvoiceEmail } from "@/emails/documents";
import { INVOICE_SURCHARGE_DESCRIPTION_LABELS } from "@/lib/labels";
import { buildSalesJournalEntry } from "@/lib/server/ledger";
import {
  computeQuoteSummary,
  creditRestrictionOn,
  generateUuid,
  getInvoiceVatRatePercent,
  getPaymentTermDueDate,
  moneyString,
  QUANTITY_EPSILON,
  remainingToInvoice,
  resolveSurchargeAmounts,
  sliceOrderLineAmounts,
  surchargeAllowedOnSales,
  toDateString,
} from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import {
  booleanFilter,
  dateRangeFilter,
  enumFilter,
  numberRangeFilter,
  relationFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { exportRows } from "@/lib/server/excel";
import { INVOICE_COLUMNS } from "@/app/(dashboard)/invoices/columns";
import { invoiceDocumentTypes, invoicePaymentTerms } from "@/lib/enums";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  sql,
} from "drizzle-orm";
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
  /** What is left to bill on the line — never the full ordered quantity. */
  quantity: string;
  /** The line's whole quantity, so the screen can show "3 of 10 left". */
  orderedQuantity: SelectOrderItems["quantity"];
  invoicedQuantity: SelectOrderItems["invoicedQuantity"];
  unit: SelectOrderItems["unit"];
  netPrice: SelectOrderItems["netPrice"];
  productCode: string | null;
  productName: string | null;
  orderId: number;
};

/**
 * One order line an invoice is billing, and how much of it.
 *
 * `quantity` left out bills whatever is left on the line, which is both the
 * common case and what the system did before it could do anything else.
 */
export type InvoiceLineSelection = {
  orderItemUuid: string;
  quantity?: string;
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

const INVOICE_SEARCH = [
  Invoices.debtorNo,
  Invoices.explanation,
  Companies.companyName,
] as const;

const INVOICE_SORTABLE = {
  invoiceDate: Invoices.invoiceDate,
  expirationDate: Invoices.expirationDate,
  customer: Companies.companyName,
  documentType: Invoices.documentType,
  invoiceTotal: Invoices.invoiceTotal,
  outstanding: Invoices.outstanding,
  createdAt: Invoices.createdAt,
};

// An invoice is looked for by who owes it, when it was raised, when it fell
// due, and whether it is still owed. `cancelled` is offered because a void
// invoice is hidden from every other screen's reasoning and someone
// occasionally has to find one.
const INVOICE_FILTERS = {
  documentType: enumFilter(Invoices.documentType, invoiceDocumentTypes),
  company: relationFilter(Invoices.companyUuid),
  paymentTerms: enumFilter(Invoices.paymentTerms, invoicePaymentTerms),
  invoiceDate: dateRangeFilter(Invoices.invoiceDate),
  dueDate: dateRangeFilter(Invoices.expirationDate),
  outstanding: numberRangeFilter(Invoices.outstanding),
  cancelled: booleanFilter(Invoices.cancelled),
};

/**
 * The rows one view of the invoices overview selects, as a window onto them.
 * Shared by the page and the export.
 */
const invoiceRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<InvoiceWithCompany[]> =>
    db
      .select({
        ...getTableColumns(Invoices),
        companyName: Companies.companyName,
        companyCode: Companies.id,
      })
      .from(Invoices)
      .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
      .where(
        tableWhere({ query, search: INVOICE_SEARCH, filters: INVOICE_FILTERS }),
      )
      .orderBy(
        ...tableOrderBy(
          INVOICE_SORTABLE,
          query,
          [desc(Invoices.createdAt)],
          Invoices.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/** Every invoice the current view matches, as a workbook. */
export const exportInvoices = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Invoices",
    columns: INVOICE_COLUMNS,
    columnKeys,
    rows: invoiceRows(parseTableQuery(params)),
  });

export const getInvoices = async (
  query: TableQuery,
): Promise<Paged<InvoiceWithCompany>> => {
  const where = tableWhere({
    query,
    search: INVOICE_SEARCH,
    filters: INVOICE_FILTERS,
  });

  return runPaged(query, {
    rows: invoiceRows(query),

    count: async () => {
      const [row] = await db
        .select({ value: count() })
        .from(Invoices)
        .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
        .where(where);
      return Number(row?.value ?? 0);
    },
  });
};

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
//
// The quantity offered is what is left to bill, not what was ordered: a line
// already part-billed appears again for its remainder, and a line billed out is
// at status "invoiced" and gone from the list.
export const getReservedOrderItemsForCompany = async (
  companyUuid: string,
): Promise<ReservedOrderItemOption[]> => {
  const rows = await db
    .select({
      uuid: OrderItems.uuid,
      quantity: OrderItems.quantity,
      invoicedQuantity: OrderItems.invoicedQuantity,
      unit: OrderItems.unit,
      netPrice: OrderItems.netPrice,
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
        sql`${OrderItems.quantity} - ${OrderItems.invoicedQuantity} > 0`,
      ),
    )
    .orderBy(desc(OrderItems.createdAt));

  return rows.map((row) => ({
    uuid: row.uuid,
    quantity: remainingToInvoice(row.quantity, row.invoicedQuantity).toFixed(3),
    orderedQuantity: row.quantity,
    invoicedQuantity: row.invoicedQuantity,
    unit: row.unit,
    netPrice: row.netPrice,
    productCode: row.productCode,
    productName: row.productName,
    orderId: row.orderId,
  }));
};

export const createInvoice = async (
  fields: InvoiceFields,
  surcharges: InvoiceSurchargeInput[] = [],
  selections: InvoiceLineSelection[] = [],
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
    const orderItemUuids = selections.map(
      (selection) => selection.orderItemUuid,
    );
    // The same line twice would be sliced twice from the same starting point and
    // bill more than is left. One line, one instalment per invoice.
    if (new Set(orderItemUuids).size !== orderItemUuids.length) {
      return {
        error:
          "The same order line was selected more than once on this invoice.",
      };
    }

    // The reconciliation surcharges exist to explain what a supplier billed.
    // Charging one to a customer would bill them for our own bookkeeping.
    const purchaseOnly = surcharges.find(
      (surcharge) => !surchargeAllowedOnSales(surcharge.description),
    )?.description;
    if (purchaseOnly) {
      return {
        error: `"${INVOICE_SURCHARGE_DESCRIPTION_LABELS[purchaseOnly]}" belongs on a purchase invoice, not on a customer invoice.`,
      };
    }
    const orderItemRows =
      orderItemUuids.length > 0
        ? await db
            .select()
            .from(OrderItems)
            .where(inArray(OrderItems.uuid, orderItemUuids))
        : [];
    const orderItemByUuid = new Map(
      orderItemRows.map((row) => [row.uuid, row]),
    );

    // An invoice line carries the order line's already-resolved per-unit price
    // and cost verbatim rather than pricing anything a second time. The order
    // line resolved both at reservation — the price from the customer's
    // contract, the cost from the stock lot it was allocated — and that
    // resolution is precisely what is being billed.
    //
    // What does change with a part-bill is the extended money: the amount, the
    // cost, the weight and the margin are the share belonging to the quantity on
    // this invoice. Per-unit figures are carried untouched, because they don't
    // scale.
    const billableLines: InvoiceLineSnapshot[] = [];
    // What each line's invoiced quantity was when it was read, so the update can
    // refuse to apply if anything billed against it in the meantime.
    const claims: {
      orderItemUuid: string;
      previousInvoiced: string;
      nextInvoiced: number;
      fullyBilled: boolean;
    }[] = [];

    for (const selection of selections) {
      const row = orderItemByUuid.get(selection.orderItemUuid);
      if (!row) {
        return {
          error: "One or more selected reservations could not be found.",
        };
      }
      if (row.status !== "delivered") {
        return {
          error:
            "One or more selected lines are not delivered (or were already billed).",
        };
      }

      const alreadyBilled = Number(row.invoicedQuantity ?? 0);
      const remaining = remainingToInvoice(row.quantity, row.invoicedQuantity);
      // No quantity given means bill the rest of the line, which is both the
      // common case and what this action did before it could do anything else.
      const billing =
        selection.quantity === undefined || selection.quantity === ""
          ? remaining
          : Number(selection.quantity);

      if (!Number.isFinite(billing) || billing <= 0) {
        return {
          error: "Every line being billed needs a quantity above zero.",
        };
      }
      if (billing > remaining + QUANTITY_EPSILON) {
        return {
          error: `Cannot bill more than is left on the line (${remaining.toFixed(3)}).`,
        };
      }

      const slice = { quantity: Number(row.quantity), alreadyBilled, billing };
      const sliced = sliceOrderLineAmounts(
        {
          amount: Number(row.amount ?? 0),
          costAmount: Number(row.costAmount ?? 0),
          // What actually shipped is what gets billed by weight; the planned
          // figure stands in for a line delivered before actuals were recorded.
          weightKg:
            Number(row.kgActual ?? 0) > 0
              ? Number(row.kgActual ?? 0)
              : Number(row.kgPlanned ?? 0),
          profit: Number(row.profit ?? 0),
          profitReplPrice: Number(row.profitReplPrice ?? 0),
        },
        slice,
      );

      billableLines.push({
        orderItemUuid: selection.orderItemUuid,
        productUuid: row.productUuid,
        quantity: billing.toFixed(3),
        netPrice: row.netPrice,
        amount: moneyString(sliced.amount),
        costPrice: row.costPrice,
        costAmount: moneyString(sliced.costAmount),
        replacementPrice: row.replacementPrice,
        profit: moneyString(sliced.profit),
        // A percentage of a slice is the percentage of the whole — nothing to
        // apportion.
        profitMargin: row.profitMargin,
        profitReplPrice: moneyString(sliced.profitReplPrice),
        weightKg: sliced.weightKg.toFixed(2),
      });

      claims.push({
        orderItemUuid: selection.orderItemUuid,
        previousInvoiced: row.invoicedQuantity,
        nextInvoiced: alreadyBilled + billing,
        fullyBilled:
          Number(row.quantity) - (alreadyBilled + billing) <= QUANTITY_EPSILON,
      });
    }

    // A surcharge charges its rate on the basis its description implies — a
    // decoil surcharge per kilo, a project discount as a percentage, an order
    // surcharge once — so the amount is resolved here against what this invoice
    // actually bills rather than taken from the form, which only knows the rate.
    const billedGoodsValue = billableLines.reduce(
      (sum, line) => sum + Number(line.amount ?? 0),
      0,
    );
    const billedWeightKg = billableLines.reduce(
      (sum, line) => sum + Number(line.weightKg ?? 0),
      0,
    );
    const pricedSurcharges = resolveSurchargeAmounts(surcharges, {
      goodsValue: billedGoodsValue,
      weightKg: billedWeightKg,
      lineCount: billableLines.length,
    });

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
      surcharges: pricedSurcharges.map((surcharge) => ({
        amount: Number(surcharge.amount ?? 0),
        profit: Number(surcharge.profit ?? 0),
      })),
      // VAT follows the invoice's VAT scenario: reverse-charge scenarios charge
      // 0%, everything else the standard rate.
      vatRatePercent: getInvoiceVatRatePercent(fields.vatScenario),
    });

    const exclVat = summary.total.revenue;

    // What the goods being billed cost us. The cost has been sitting on the
    // balance sheet since the goods were delivered; billing them is the moment
    // it becomes a cost of this sale.
    const costOfSales = billableLines.reduce(
      (sum, line) => sum + Number(line.costAmount ?? 0),
      0,
    );

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
        invoiceAmountExclVat: moneyString(exclVat),
        invoiceAmountInclVat: moneyString(inclVat),
        creditRestriction: moneyString(creditRestriction),
        invoiceTotal: moneyString(invoiceTotal),
        outstanding: moneyString(outstanding),
        materialsRevenue: moneyString(summary.materials.revenue),
        materialsProfit: moneyString(summary.materials.profit),
        materialsProfitReplPrice: moneyString(
          summary.materials.profitReplPrice,
        ),
        surchargesRevenue: moneyString(summary.surcharges.revenue),
        surchargesProfit: moneyString(summary.surcharges.profit),
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
        buildSalesJournalEntry({
          invoiceUuid: uuid,
          invoiceId: insertedInvoice?.id ?? null,
          companyUuid: fields.companyUuid ?? null,
          debCreditor: fields.debtorNo ?? null,
          invoiceDate: fields.invoiceDate ?? null,
          amountExclVat: exclVat,
          vatAmount,
          creditRestriction,
          costOfSales,
          userId: userId ?? null,
        }),
      );

      for (const surcharge of pricedSurcharges) {
        await tx.insert(InvoiceSurcharges).values({
          ...surcharge,
          uuid: generateUuid(),
          invoiceUuid: uuid,
        });
      }

      for (const claim of claims) {
        // Guard: the line must still be "delivered" and still have billed
        // exactly what it had billed when we read it. Matching on the invoiced
        // quantity is what makes part-billing safe — two invoices raised at once
        // would otherwise each bill the same remainder, and the second loses
        // here instead.
        //
        // Stock already left at delivery, so billing is purely financial: no
        // stock change, no movement — just the invoice line (the journal posting
        // is booked once for the whole invoice above).
        const [itemUpdateResult] = await tx
          .update(OrderItems)
          .set({
            invoicedQuantity: claim.nextInvoiced.toFixed(3),
            // A line only leaves the billable list once all of it is billed;
            // until then it stays "delivered" and offers its remainder.
            status: claim.fullyBilled ? "invoiced" : "delivered",
            lineStatus: claim.fullyBilled ? "invoiced" : "partially_invoiced",
          })
          .where(
            and(
              eq(OrderItems.uuid, claim.orderItemUuid),
              eq(OrderItems.status, "delivered"),
              eq(OrderItems.invoicedQuantity, claim.previousInvoiced),
            ),
          );

        if (itemUpdateResult.affectedRows === 0) {
          throw new Error(
            "One of the selected lines was billed or cancelled while this invoice was being raised — please refresh and try again.",
          );
        }
      }

      for (const line of billableLines) {
        await tx.insert(InvoiceItems).values({
          ...line,
          uuid: generateUuid(),
          invoiceUuid: uuid,
        });
      }
    });

    // Only once the transaction has committed: a rolled back invoice must never
    // leave a sent invoice email behind, and an email that fails to send must
    // never roll a raised invoice back — mail can't be undone anyway.
    await mailDocument(() => sendInvoiceEmail(uuid), `Invoice ${uuid}`);

    revalidatePath("/invoices");
    revalidatePath("/orders");
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

    const isCreditNote = invoice.documentType === "credit_note";

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
      // A cancelled invoice is void, so nothing is owed on it. Leaving
      // `outstanding` at the full amount would keep the debt alive for good:
      // it would go on consuming the customer's credit space and show up in
      // their receivables long after the invoice stopped existing.
      await tx
        .update(Invoices)
        .set({ cancelled: true, outstanding: "0.00" })
        .where(eq(Invoices.uuid, uuid));

      // Reverse the sales invoice's ledger posting.
      await tx.insert(JournalEntries).values(
        buildSalesJournalEntry({
          invoiceUuid: uuid,
          invoiceId: invoice.id,
          companyUuid: invoice.companyUuid,
          debCreditor: invoice.debtorNo,
          invoiceDate: invoice.invoiceDate,
          amountExclVat: Number(invoice.invoiceAmountExclVat),
          vatAmount:
            Number(invoice.invoiceAmountInclVat) -
            Number(invoice.invoiceAmountExclVat),
          creditRestriction: Number(invoice.creditRestriction),
          // The margin is given back with the revenue: the goods go back to
          // being an unbilled asset, which is what they were before this
          // document existed.
          costOfSales: items.reduce(
            (sum, item) => sum + Number(item.costAmount ?? 0),
            0,
          ),
          userId: userId ?? null,
          reversal: true,
        }),
      );

      // Cancelling reverses only the money; stock is never restored here —
      // recovering shipped goods is a return, not a cancellation.
      //
      // Where the line lands depends on which document was cancelled. An
      // invoice pulled back leaves its lines billable again. A credit note
      // pulled back means the customer owes for them once more, so they return
      // to "invoiced" — sending them to "delivered" would offer goods that are
      // physically back in the warehouse for delivery a second time.
      const revertedStatus = isCreditNote ? "invoiced" : "delivered";

      for (const item of items) {
        const [orderItem] = await tx
          .select({
            quantity: OrderItems.quantity,
            invoicedQuantity: OrderItems.invoicedQuantity,
          })
          .from(OrderItems)
          .where(eq(OrderItems.uuid, item.orderItemUuid))
          .limit(1);

        if (!orderItem) {
          continue;
        }

        // Unbill what this document billed. A credit note's own line quantity is
        // already negative, so subtracting it adds the quantity back — the
        // customer owes for those goods again, which is exactly what pulling a
        // credit note back means.
        //
        // Clamped at zero and at the line quantity: neither end is reachable by
        // the normal path, and letting a stray figure out of that range would
        // leave the line either permanently unbillable or offering quantity it
        // never had.
        const unbilled = Math.min(
          Math.max(
            Number(orderItem.invoicedQuantity ?? 0) -
              Number(item.quantity ?? 0),
            0,
          ),
          Number(orderItem.quantity ?? 0),
        );
        const fullyBilled =
          Number(orderItem.quantity ?? 0) - unbilled <= QUANTITY_EPSILON;

        await tx
          .update(OrderItems)
          .set({
            status: revertedStatus,
            invoicedQuantity: unbilled.toFixed(3),
            lineStatus:
              unbilled <= QUANTITY_EPSILON
                ? "delivered"
                : fullyBilled
                  ? "invoiced"
                  : "partially_invoiced",
          })
          .where(eq(OrderItems.uuid, item.orderItemUuid));
      }
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${uuid}`);
    revalidatePath("/orders");
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

    if (
      exclVatOverride === undefined &&
      creditRestrictionOverride === undefined
    ) {
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
            invoiceAmountExclVat: moneyString(exclVat),
            invoiceAmountInclVat: moneyString(inclVat),
            creditRestriction: moneyString(creditRestriction),
            invoiceTotal: moneyString(invoiceTotal),
            outstanding: moneyString(outstanding),
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
            buildSalesJournalEntry({
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
