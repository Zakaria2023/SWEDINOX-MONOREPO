import "server-only";

import { createElement } from "react";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { Communications } from "@/db/schema/communications";
import { Companies } from "@/db/schema/companies";
import { Contacts } from "@/db/schema/contacts";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices, InvoiceSurcharges } from "@/db/schema/invoices";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { Products } from "@/db/schema/products";
import { PurchaseInvoiceItems } from "@/db/schema/purchase-invoice-items";
import { PurchaseInvoices } from "@/db/schema/purchase-invoices";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { selectRecipientAddresses } from "@/emails/recipients";
import { sendEmail } from "@/emails/resend";
import { generateUuid } from "@/lib/helpers";
import DocumentEmail, {
  DocumentEmailField,
  DocumentEmailProps,
} from "@/emails/templates/document-email";
import {
  daysOverdue,
  DocumentPrintPolicy,
  documentPrintPolicy,
  formatDateValue,
  formatMoney,
  formatNumber,
  invoiceReference,
  orderDocumentLines,
} from "@/lib/helpers";
import {
  INVOICE_DOCUMENT_TYPE_LABELS,
  DELIVERY_TERM_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  ORDER_WEIGHT_TYPE_LABELS,
  INVOICE_SURCHARGE_DESCRIPTION_LABELS,
  INVOICE_VAT_SCENARIO_LABELS,
  REMINDER_STAGE_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";
import { InvoicePaymentTerm, ReminderStage } from "@/lib/enums";

export type EmailDeliveryResult = {
  sent: number;
  failed: number;
};

type RecipientLookup = {
  companyUuid: string | null;
  /** The contact the document itself names, preferred over the company's rest. */
  contactUuid?: string | null;
  /** An address the company configured for this kind of document. */
  routedTo?: string | null;
};

type FieldEntry = [string, string | null | undefined];

const NOTHING_SENT: EmailDeliveryResult = { sent: 0, failed: 0 };

/** Loads the company's contacts, then applies the addressing rules to them. */
const resolveRecipients = async ({
  companyUuid,
  contactUuid,
  routedTo,
}: RecipientLookup): Promise<string[]> => {
  const contacts = companyUuid
    ? await db
        .select({
          uuid: Contacts.uuid,
          email: Contacts.email,
          addressEmail: Contacts.addressEmail,
        })
        .from(Contacts)
        .where(eq(Contacts.companyUuid, companyUuid))
    : [];

  return selectRecipientAddresses({ contacts, contactUuid, routedTo });
};

/**
 * Mails one document to each recipient separately, so they never see each
 * other's addresses. Failures are counted rather than thrown — the document
 * itself is already committed, and mail can't be rolled back with it.
 */
const deliver = async (
  to: string[],
  subject: string,
  props: DocumentEmailProps,
): Promise<EmailDeliveryResult> => {
  if (to.length === 0) {
    console.warn(`No recipient address for "${subject}" — nothing sent.`);
    return NOTHING_SENT;
  }

  const results = await Promise.allSettled(
    to.map((email) =>
      sendEmail({
        to: email,
        subject,
        react: createElement(DocumentEmail, props),
      }),
    ),
  );

  const failed = results.filter(
    (result) => result.status === "rejected",
  ).length;
  return { sent: results.length - failed, failed };
};

/**
 * Runs a document send without letting a mail failure surface as a document
 * failure. By the time this runs the document is already committed, and mail
 * can't be rolled back with it — so a failed send is recorded, never thrown.
 *
 * 🔴 It used to be recorded to `console.error` and nowhere else, which meant a
 * confirmation that never reached the customer left no trace anybody would ever
 * look at, and "did we send it?" had no answer. Every send now writes a row to
 * `Communications`, successful or not.
 *
 * The record is best-effort on purpose. A document that went out and a log that
 * failed to write is a smaller problem than a send aborted because its log
 * could not be written, so the write is caught and swallowed in its turn.
 */
export const mailDocument = async (
  send: () => Promise<EmailDeliveryResult>,
  describe: string,
  about?: CommunicationSubject,
): Promise<void> => {
  const record = async (
    delivered: number,
    failed: number,
    failureReason: string | null,
  ) => {
    if (!about) {
      return;
    }
    try {
      await db.insert(Communications).values({
        uuid: generateUuid(),
        documentType: about.documentType,
        documentUuid: about.documentUuid ?? null,
        documentLabel: about.documentLabel ?? describe,
        companyUuid: about.companyUuid ?? null,
        channel: "email",
        recipient: about.recipient ?? null,
        subject: describe,
        deliveredCount: delivered,
        failedCount: failed,
        failureReason,
        sentByUserId: about.userId ?? null,
      });
    } catch (error) {
      console.error(`${describe}: could not be recorded as sent.`, error);
    }
  };

  try {
    const { sent, failed } = await send();
    if (failed > 0) {
      console.error(
        `${describe}: ${failed} of ${sent + failed} email(s) failed to send.`,
      );
    }
    await record(
      sent,
      failed,
      failed > 0 ? `${failed} of ${sent + failed} recipients refused it` : null,
    );
  } catch (error) {
    console.error(`${describe}: could not be emailed.`, error);
    await record(
      0,
      1,
      error instanceof Error ? error.message : "The send threw",
    );
  }
};

/**
 * What a send was about, so the record can be found again from the document it
 * belongs to. Optional on `mailDocument`: a caller that cannot say is still
 * allowed to send, it simply leaves no trail.
 */
export type CommunicationSubject = {
  /** `order`, `invoice`, `delivery`, `purchase_order`, … */
  documentType: string;
  documentUuid?: string | null;
  documentLabel?: string | null;
  companyUuid?: string | null;
  recipient?: string | null;
  userId?: string | null;
};

/** Header rows, with anything the document left blank dropped rather than shown empty. */
const fieldsOf = (entries: FieldEntry[]): DocumentEmailField[] =>
  entries
    .filter((entry): entry is [string, string] => !!entry[1])
    .map(([label, value]) => ({ label, value }));

const paymentTermLabel = (term: InvoicePaymentTerm | null): string | null =>
  term ? INVOICE_PAYMENT_TERM_LABELS[term] : null;

const productLabel = (
  code: string | null,
  name: string | null,
): [string, string] => [code ?? "—", name ?? "—"];

/**
 * The product code a document leads with: the customer's own catalogue code
 * where they asked for it, ours otherwise, and nothing at all where they asked
 * for no code. A customer whose external code we do not hold still gets ours —
 * a blank column identifies nothing.
 */
const printedProductCode = (
  item: { productCode: string | null; externalProductCode: string | null },
  policy: DocumentPrintPolicy,
): string | null => {
  if (policy.productCode === "none") {
    return null;
  }
  if (policy.productCode === "external") {
    return item.externalProductCode ?? item.productCode;
  }
  return item.productCode;
};

const money = (value: string | number | null): string =>
  formatMoney(Number(value ?? 0));

const quantity = (value: string | number | null): string =>
  formatNumber(Number(value ?? 0));

/**
 * The purchase order as sent to the supplier: what we are ordering, at what
 * price, and when we expect it.
 */
export const sendPurchaseOrderEmail = async (
  purchaseOrderUuid: string,
): Promise<EmailDeliveryResult> => {
  const [order] = await db
    .select({
      id: PurchaseOrders.id,
      supplierUuid: PurchaseOrders.supplierUuid,
      contactUuid: PurchaseOrders.contactUuid,
      reference: PurchaseOrders.reference,
      ourReference: PurchaseOrders.ourReference,
      orderCategory: PurchaseOrders.orderCategory,
      orderDate: PurchaseOrders.orderDate,
      deliveryDate: PurchaseOrders.deliveryDate,
      deliveryRemark: PurchaseOrders.deliveryRemark,
      paymentTerms: PurchaseOrders.paymentTerms,
      remarks: PurchaseOrders.remarks,
      supplierName: Companies.companyName,
    })
    .from(PurchaseOrders)
    .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
    .where(eq(PurchaseOrders.uuid, purchaseOrderUuid))
    .limit(1);

  if (!order) {
    return NOTHING_SENT;
  }

  const items = await db
    .select({
      lineNumber: PurchaseOrderItems.lineNumber,
      quantity: PurchaseOrderItems.quantity,
      unit: PurchaseOrderItems.unit,
      netPrice: PurchaseOrderItems.netPrice,
      amount: PurchaseOrderItems.amount,
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(PurchaseOrderItems)
    .leftJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
    .where(eq(PurchaseOrderItems.purchaseOrderUuid, purchaseOrderUuid))
    .orderBy(asc(PurchaseOrderItems.lineNumber));

  const total = items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const reference = `PO-${order.id}`;
  const recipients = await resolveRecipients({
    companyUuid: order.supplierUuid,
    contactUuid: order.contactUuid,
  });

  const result = await deliver(recipients, `Purchase order ${reference}`, {
    documentLabel: "Purchase order",
    reference,
    companyName: order.supplierName ?? "Supplier",
    intro:
      "We have placed the following purchase order with you. Please confirm the prices and the delivery date below.",
    fields: fieldsOf([
      ["Order date", formatDateValue(order.orderDate, "")],
      ["Your reference", order.reference],
      ["Our reference", order.ourReference],
      ["Order category", order.orderCategory],
      ["Requested delivery date", formatDateValue(order.deliveryDate, "")],
      ["Delivery remark", order.deliveryRemark],
      ["Payment terms", paymentTermLabel(order.paymentTerms)],
    ]),
    tables: [
      {
        caption: "Ordered",
        columns: [
          "Line",
          "Product",
          "Description",
          "Quantity",
          "Unit",
          "Unit price",
          "Amount",
        ],
        alignRightFrom: 3,
        rows: items.map((item, index) => [
          String(item.lineNumber ?? index + 1),
          ...productLabel(item.productCode, item.productName),
          quantity(item.quantity),
          item.unit ? STOCK_UNIT_LABELS[item.unit] : "—",
          money(item.netPrice),
          money(item.amount),
        ]),
        emptyNote: "This order carries no lines.",
      },
    ],
    totals: [
      { label: "Order total", value: formatMoney(total), emphasis: true },
    ],
    remark: order.remarks ?? undefined,
  });

  if (result.sent > 0) {
    await db
      .update(PurchaseOrders)
      .set({ isMailed: true })
      .where(eq(PurchaseOrders.uuid, purchaseOrderUuid));
  }

  return result;
};

/**
 * Confirmation to the supplier that their invoice has been booked and the goods
 * on it received into stock — the point at which we owe them money.
 */
export const sendPurchaseInvoiceEmail = async (
  purchaseInvoiceUuid: string,
): Promise<EmailDeliveryResult> => {
  const [invoice] = await db
    .select({
      id: PurchaseInvoices.id,
      companyUuid: PurchaseInvoices.companyUuid,
      contactUuid: PurchaseInvoices.invoiceSentByContactUuid,
      invoiceNumberSupplier: PurchaseInvoices.invoiceNumberSupplier,
      creditorNo: PurchaseInvoices.creditorNo,
      bookingDate: PurchaseInvoices.bookingDate,
      invoiceDate: PurchaseInvoices.invoiceDate,
      expirationDate: PurchaseInvoices.expirationDate,
      paymentTerms: PurchaseInvoices.paymentTerms,
      purchaseOrderNumber: PurchaseInvoices.purchaseOrderNumber,
      materials: PurchaseInvoices.materials,
      optionsAmount: PurchaseInvoices.optionsAmount,
      surcharges: PurchaseInvoices.surcharges,
      vatHigh: PurchaseInvoices.vatHigh,
      vatMiddle: PurchaseInvoices.vatMiddle,
      vatLow: PurchaseInvoices.vatLow,
      creditRestriction: PurchaseInvoices.creditRestriction,
      invoiceTotal: PurchaseInvoices.invoiceTotal,
      remarks: PurchaseInvoices.remarks,
      supplierName: Companies.companyName,
    })
    .from(PurchaseInvoices)
    .leftJoin(Companies, eq(PurchaseInvoices.companyUuid, Companies.uuid))
    .where(eq(PurchaseInvoices.uuid, purchaseInvoiceUuid))
    .limit(1);

  if (!invoice) {
    return NOTHING_SENT;
  }

  const items = await db
    .select({
      quantity: PurchaseInvoiceItems.quantity,
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(PurchaseInvoiceItems)
    .leftJoin(Products, eq(PurchaseInvoiceItems.productUuid, Products.uuid))
    .where(eq(PurchaseInvoiceItems.purchaseInvoiceUuid, purchaseInvoiceUuid));

  const vat =
    Number(invoice.vatHigh ?? 0) +
    Number(invoice.vatMiddle ?? 0) +
    Number(invoice.vatLow ?? 0);
  const reference = `PINV-${invoice.id}`;
  const recipients = await resolveRecipients({
    companyUuid: invoice.companyUuid,
    contactUuid: invoice.contactUuid,
  });

  return deliver(recipients, `Purchase invoice ${reference} booked`, {
    documentLabel: "Purchase invoice",
    reference,
    companyName: invoice.supplierName ?? "Supplier",
    intro:
      "We have booked your invoice and received the goods listed below into stock. The amounts we recorded are shown here — please let us know if they differ from yours.",
    fields: fieldsOf([
      ["Your invoice number", invoice.invoiceNumberSupplier],
      ["Our purchase order", invoice.purchaseOrderNumber],
      ["Creditor number", invoice.creditorNo],
      ["Invoice date", formatDateValue(invoice.invoiceDate, "")],
      ["Booking date", formatDateValue(invoice.bookingDate, "")],
      ["Due date", formatDateValue(invoice.expirationDate, "")],
      ["Payment terms", paymentTermLabel(invoice.paymentTerms)],
    ]),
    tables: [
      {
        caption: "Goods received",
        columns: ["Product", "Description", "Quantity"],
        alignRightFrom: 2,
        rows: items.map((item) => [
          ...productLabel(item.productCode, item.productName),
          quantity(item.quantity),
        ]),
        emptyNote: "No goods were received against this invoice.",
      },
    ],
    totals: [
      { label: "Materials", value: money(invoice.materials) },
      { label: "Options", value: money(invoice.optionsAmount) },
      { label: "Surcharges", value: money(invoice.surcharges) },
      { label: "Credit restriction", value: money(invoice.creditRestriction) },
      { label: "VAT", value: formatMoney(vat) },
      {
        label: "Invoice total",
        value: money(invoice.invoiceTotal),
        emphasis: true,
      },
    ],
    remark: invoice.remarks ?? undefined,
  });
};

/**
 * The sales invoice as sent to the customer: what they are being billed for,
 * how the total is built up, and when it is due.
 */
export const sendInvoiceEmail = async (
  invoiceUuid: string,
): Promise<EmailDeliveryResult> => {
  const [invoice] = await db
    .select({
      id: Invoices.id,
      documentType: Invoices.documentType,
      companyUuid: Invoices.companyUuid,
      debtorNo: Invoices.debtorNo,
      invoiceDate: Invoices.invoiceDate,
      expirationDate: Invoices.expirationDate,
      paymentTerms: Invoices.paymentTerms,
      vatScenario: Invoices.vatScenario,
      invoiceAmountExclVat: Invoices.invoiceAmountExclVat,
      invoiceAmountInclVat: Invoices.invoiceAmountInclVat,
      creditRestriction: Invoices.creditRestriction,
      invoiceTotal: Invoices.invoiceTotal,
      totalWeightKg: Invoices.totalWeightKg,
      explanation: Invoices.explanation,
      companyName: Companies.companyName,
      invoiceEmailEnabled: Companies.invoiceEmailEnabled,
      invoiceEmailTo: Companies.invoiceEmailTo,
      // How this customer's documents are supposed to print: whether prices
      // appear at all, whether only the line total does, which product code
      // leads, and what order the lines go in.
      quoteOrderInvoiceSettings: Companies.quoteOrderInvoiceSettings,
      orderSettings: Companies.orderSettings,
      printProductCodesOnOutgoingDocuments:
        Companies.printProductCodesOnOutgoingDocuments,
      groupLinesByLongProductGroupDescription:
        Companies.groupLinesByLongProductGroupDescription,
    })
    .from(Invoices)
    .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
    .where(eq(Invoices.uuid, invoiceUuid))
    .limit(1);

  if (!invoice) {
    return NOTHING_SENT;
  }

  const lineRows = await db
    .select({
      quantity: InvoiceItems.quantity,
      netPrice: InvoiceItems.netPrice,
      amount: InvoiceItems.amount,
      weightKg: InvoiceItems.weightKg,
      // The originating order line's number, which is what "lowest order line"
      // groups by — an invoice line carries no number of its own.
      lineNumber: OrderItems.lineNumber,
      productCode: Products.productCode,
      externalProductCode: Products.externalProductCode,
      productName: Products.name,
    })
    .from(InvoiceItems)
    .leftJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
    .leftJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
    .where(eq(InvoiceItems.invoiceUuid, invoiceUuid));

  const printPolicy = documentPrintPolicy({
    invoiceSettings: invoice.quoteOrderInvoiceSettings,
    orderSettings: invoice.orderSettings,
    printProductCodes: invoice.printProductCodesOnOutgoingDocuments,
    groupLines: invoice.groupLinesByLongProductGroupDescription,
  });

  // The customer decides the order its lines print in — as entered, by
  // description, or grouped by the lowest line number each description carries.
  const items = orderDocumentLines(lineRows, printPolicy, (line) => ({
    description: line.productName ?? "",
    lineNumber: line.lineNumber ?? 0,
  }));

  const surcharges = await db
    .select({
      description: InvoiceSurcharges.description,
      unit: InvoiceSurcharges.unit,
      surcharge: InvoiceSurcharges.surcharge,
      amount: InvoiceSurcharges.amount,
    })
    .from(InvoiceSurcharges)
    .where(eq(InvoiceSurcharges.invoiceUuid, invoiceUuid))
    .orderBy(asc(InvoiceSurcharges.order));

  // VAT isn't stored on its own — it is the difference the header already
  // records between the net amount and the amount including VAT.
  const vat =
    Number(invoice.invoiceAmountInclVat ?? 0) -
    Number(invoice.invoiceAmountExclVat ?? 0);
  // A credit note is the same row with negative amounts, but it must never
  // arrive calling itself an invoice — the customer is owed this money, not
  // being asked for it.
  const isCreditNote = invoice.documentType === "credit_note";
  const documentLabel = INVOICE_DOCUMENT_TYPE_LABELS[invoice.documentType];
  const reference = invoiceReference(invoice.documentType, invoice.id);
  const dueDate = formatDateValue(invoice.expirationDate, "");
  const recipients = await resolveRecipients({
    companyUuid: invoice.companyUuid,
    // Where the customer asked for invoices to be sent, honour it on top of
    // the contacts we hold.
    routedTo: invoice.invoiceEmailEnabled ? invoice.invoiceEmailTo : null,
  });

  const result = await deliver(recipients, `${documentLabel} ${reference}`, {
    documentLabel,
    reference,
    companyName: invoice.companyName ?? "Customer",
    intro: isCreditNote
      ? `Please find credit note ${reference} below. This amount is credited back to your account and settles against what you owe us.`
      : dueDate
        ? `Please find invoice ${reference} below. The amount is due by ${dueDate}.`
        : `Please find invoice ${reference} below.`,
    fields: fieldsOf([
      [
        isCreditNote ? "Credit note date" : "Invoice date",
        formatDateValue(invoice.invoiceDate, ""),
      ],
      // A credit note isn't due — it is owed the other way.
      ["Due date", isCreditNote ? null : dueDate],
      ["Debtor number", invoice.debtorNo],
      ["Payment terms", paymentTermLabel(invoice.paymentTerms)],
      [
        "VAT scenario",
        invoice.vatScenario
          ? INVOICE_VAT_SCENARIO_LABELS[invoice.vatScenario]
          : null,
      ],
      [
        "Total weight",
        Number(invoice.totalWeightKg ?? 0) > 0
          ? `${quantity(invoice.totalWeightKg)} kg`
          : null,
      ],
    ]),
    tables: [
      {
        caption: "Lines",
        columns: [
          "Product",
          "Description",
          "Quantity",
          "Weight (kg)",
          // "Do not print prices" drops both money columns; "total amount per
          // line" keeps the total and drops the unit price it came from.
          ...(printPolicy.printPrices && !printPolicy.totalAmountPerLine
            ? ["Unit price"]
            : []),
          ...(printPolicy.printPrices ? ["Amount"] : []),
        ],
        alignRightFrom: 2,
        rows: items.map((item) => [
          ...productLabel(
            printedProductCode(item, printPolicy),
            item.productName,
          ),
          quantity(item.quantity),
          quantity(item.weightKg),
          ...(printPolicy.printPrices && !printPolicy.totalAmountPerLine
            ? [money(item.netPrice)]
            : []),
          ...(printPolicy.printPrices ? [money(item.amount)] : []),
        ]),
        emptyNote: "This invoice bills surcharges only.",
      },
      {
        caption: "Surcharges",
        columns: [
          "Description",
          "Unit",
          ...(printPolicy.printPrices ? ["Rate", "Amount"] : []),
        ],
        alignRightFrom: 2,
        rows: surcharges.map((surcharge) => [
          surcharge.description
            ? INVOICE_SURCHARGE_DESCRIPTION_LABELS[surcharge.description]
            : "—",
          surcharge.unit ?? "—",
          ...(printPolicy.printPrices
            ? [money(surcharge.surcharge), money(surcharge.amount)]
            : []),
        ]),
        emptyNote: "No surcharges on this invoice.",
      },
    ],
    totals: [
      { label: "Total excl. VAT", value: money(invoice.invoiceAmountExclVat) },
      { label: "Credit restriction", value: money(invoice.creditRestriction) },
      { label: "VAT", value: formatMoney(vat) },
      {
        label: isCreditNote ? "Credited in total" : "Invoice total",
        value: money(invoice.invoiceTotal),
        emphasis: true,
      },
    ],
    remark: invoice.explanation ?? undefined,
  });

  if (result.sent > 0) {
    await db
      .update(Invoices)
      .set({ mailed: true })
      .where(eq(Invoices.uuid, invoiceUuid));
  }

  return result;
};

/**
 * A reminder that an invoice is past its due date.
 *
 * Deliberately not a copy of the invoice. The customer already has that; what
 * they are being sent is the balance still open, how late it is, and — at the
 * final stage — what happens next. The tone escalates with the stage while the
 * figures stay identical, because the amount owed is not a matter of emphasis.
 */
export const sendPaymentReminderEmail = async (
  invoiceUuid: string,
  stage: ReminderStage,
): Promise<EmailDeliveryResult> => {
  const [invoice] = await db
    .select({
      id: Invoices.id,
      documentType: Invoices.documentType,
      companyUuid: Invoices.companyUuid,
      debtorNo: Invoices.debtorNo,
      invoiceDate: Invoices.invoiceDate,
      expirationDate: Invoices.expirationDate,
      paymentTerms: Invoices.paymentTerms,
      invoiceTotal: Invoices.invoiceTotal,
      outstanding: Invoices.outstanding,
      companyName: Companies.companyName,
      invoiceEmailEnabled: Companies.invoiceEmailEnabled,
      invoiceEmailTo: Companies.invoiceEmailTo,
    })
    .from(Invoices)
    .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
    .where(eq(Invoices.uuid, invoiceUuid))
    .limit(1);

  if (!invoice) {
    return NOTHING_SENT;
  }

  const reference = invoiceReference(invoice.documentType, invoice.id);
  const stageLabel = REMINDER_STAGE_LABELS[stage];
  const overdue = daysOverdue(invoice.expirationDate) ?? 0;
  const outstanding = Number(invoice.outstanding ?? 0);
  const paid = Number(invoice.invoiceTotal ?? 0) - outstanding;
  const dueDate = formatDateValue(invoice.expirationDate, "");

  const intro = {
    first: `Our records show that invoice ${reference} was due on ${dueDate} and is still open. If it has been paid in the meantime, please treat this as settled and accept our apologies for the crossover.`,
    second: `Invoice ${reference} remains unpaid ${overdue} days after its due date of ${dueDate}. We have written to you about it once already. Please arrange payment, or contact us if something about this invoice is in dispute.`,
    final: `Invoice ${reference} is now ${overdue} days overdue and two reminders have gone unanswered. Unless the balance below is paid, or you contact us to agree an arrangement, this account will be passed on for collection.`,
  }[stage];

  const recipients = await resolveRecipients({
    companyUuid: invoice.companyUuid,
    routedTo: invoice.invoiceEmailEnabled ? invoice.invoiceEmailTo : null,
  });

  return deliver(recipients, `${stageLabel} — invoice ${reference}`, {
    documentLabel: stageLabel,
    reference,
    companyName: invoice.companyName ?? "Customer",
    intro,
    fields: fieldsOf([
      ["Invoice date", formatDateValue(invoice.invoiceDate, "")],
      ["Due date", dueDate],
      ["Days overdue", overdue > 0 ? String(overdue) : null],
      ["Debtor number", invoice.debtorNo],
      ["Payment terms", paymentTermLabel(invoice.paymentTerms)],
    ]),
    tables: [
      {
        caption: "Open item",
        columns: [
          "Document",
          "Invoice date",
          "Due date",
          "Days overdue",
          "Outstanding",
        ],
        alignRightFrom: 3,
        rows: [
          [
            reference,
            formatDateValue(invoice.invoiceDate, "—"),
            formatDateValue(invoice.expirationDate, "—"),
            String(overdue),
            money(invoice.outstanding),
          ],
        ],
      },
    ],
    totals: [
      { label: "Invoice total", value: money(invoice.invoiceTotal) },
      // Only worth saying when part of it did arrive; on an untouched invoice
      // "Paid € 0.00" reads as an accusation rather than a fact.
      ...(paid > 0.005
        ? [{ label: "Received so far", value: formatMoney(paid) }]
        : []),
      {
        label: "Still outstanding",
        value: money(invoice.outstanding),
        emphasis: true,
      },
    ],
  });
};

/**
 * The delivery note for a single order line, sent when the goods physically
 * leave the warehouse. Prices are deliberately absent — this says what shipped,
 * the invoice says what it costs.
 */
export const sendDeliveryNoteEmail = async (
  orderItemUuid: string,
): Promise<EmailDeliveryResult> => {
  const [line] = await db
    .select({
      lineId: OrderItems.id,
      lineNumber: OrderItems.lineNumber,
      quantity: OrderItems.quantity,
      unit: OrderItems.unit,
      kgActual: OrderItems.kgActual,
      kgPlanned: OrderItems.kgPlanned,
      lengthMm: OrderItems.lengthMm,
      widthMm: OrderItems.widthMm,
      thicknessMm: OrderItems.thicknessMm,
      deliveryDate: OrderItems.deliveryDate,
      isPickup: OrderItems.isPickup,
      orderId: Orders.id,
      orderCompanyUuid: Orders.companyUuid,
      orderContactUuid: Orders.contactUuid,
      customerRef: Orders.customerRef,
      ourReference: Orders.ourReference,
      companyName: Companies.companyName,
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(OrderItems)
    .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
    .where(eq(OrderItems.uuid, orderItemUuid))
    .limit(1);

  if (!line) {
    return NOTHING_SENT;
  }

  // What actually shipped is what the note reports; the planned figure stands
  // in only for a line delivered before actuals were recorded.
  const weightKg =
    Number(line.kgActual ?? 0) > 0 ? line.kgActual : line.kgPlanned;
  const dimensions = [
    line.lengthMm ? `${line.lengthMm} mm long` : null,
    line.widthMm ? `${line.widthMm} mm wide` : null,
    line.thicknessMm ? `${Number(line.thicknessMm)} mm thick` : null,
  ]
    .filter((part): part is string => !!part)
    .join(", ");

  const reference = `DN-${line.orderId ?? "?"}-${line.lineNumber ?? line.lineId}`;
  const recipients = await resolveRecipients({
    companyUuid: line.orderCompanyUuid,
    contactUuid: line.orderContactUuid,
  });

  return deliver(recipients, `Delivery note ${reference}`, {
    documentLabel: "Delivery note",
    reference,
    companyName: line.companyName ?? "Customer",
    intro: line.isPickup
      ? "The goods below have been picked from stock and are ready for collection."
      : "The goods below have left our warehouse and are on their way to you.",
    fields: fieldsOf([
      ["Order number", line.orderId ? String(line.orderId) : null],
      ["Your reference", line.customerRef],
      ["Our reference", line.ourReference],
      ["Delivery date", formatDateValue(line.deliveryDate, "")],
      ["Method", line.isPickup ? "Collection" : "Delivery"],
      ["Dimensions", dimensions || null],
    ]),
    tables: [
      {
        caption: "Delivered",
        columns: ["Product", "Description", "Quantity", "Unit", "Weight (kg)"],
        alignRightFrom: 2,
        rows: [
          [
            ...productLabel(line.productCode, line.productName),
            quantity(line.quantity),
            line.unit ? STOCK_UNIT_LABELS[line.unit] : "—",
            quantity(weightKg),
          ],
        ],
      },
    ],
    totals: [],
  });
};


/**
 * The order confirmation — the document `Make final` prints.
 *
 * Modelled on the `ORDERBEVESTIGING` produced for order 102191 on 21-9-2026:
 * both references, the contact, the seller and the representative, a line table
 * grouped under the article's family, the delivery and payment conditions, and
 * the totals with VAT.
 *
 * 🔴 **The quantity column prints the TRADE weight.** That paper shows
 * `540 KG × € 2.500,00 per TN = € 1.350,00` on a line whose metal physically
 * weighs 529,9 kg. It is not an internal display quirk — it is what the customer
 * is billed on, which is the whole reason the two weights had to be separated.
 *
 * ⚠️ **The footer is deliberately absent.** The reference's carries *"Deze
 * Vordering is verkocht en gecedeerd aan Boozt24 Finance B.V. Bevrijdende
 * betaling kan uitsluitend plaatsvinden aan Boozt24 Finance B.V."* — the
 * receivables are factored, and payment discharges only to the factor. Printing
 * that on our paper would tell a customer where to send money, and whether the
 * arrangement is current is an open question (O8). A wrong answer there is
 * somebody's money going to the wrong bank, so nothing is printed until it is
 * confirmed.
 */
export const sendOrderConfirmationEmail = async (
  orderUuid: string,
): Promise<EmailDeliveryResult> => {
  const [order] = await db
    .select({
      id: Orders.id,
      companyUuid: Orders.companyUuid,
      contactUuid: Orders.contactUuid,
      customerRef: Orders.customerRef,
      ourReference: Orders.ourReference,
      orderDate: Orders.createdAt,
      deliveryDate: Orders.deliveryDate,
      deliveryTerms: Orders.deliveryTerms,
      paymentTerms: Orders.paymentTerms,
      seller: Orders.seller,
      weightType: Orders.weightType,
      totalExclVat: Orders.totalExclVat,
      vatAmount: Orders.vatAmount,
      totalInclVat: Orders.totalInclVat,
      totalWeightKg: Orders.totalWeightKg,
      companyName: Companies.companyName,
    })
    .from(Orders)
    .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .where(eq(Orders.uuid, orderUuid))
    .limit(1);

  if (!order) {
    return NOTHING_SENT;
  }

  const lines = await db
    .select({
      lineNumber: OrderItems.lineNumber,
      quantity: OrderItems.quantity,
      unit: OrderItems.unit,
      lengthMm: OrderItems.lengthMm,
      widthMm: OrderItems.widthMm,
      thicknessMm: OrderItems.thicknessMm,
      kgPlanned: OrderItems.kgPlanned,
      netPrice: OrderItems.netPrice,
      priceUnit: OrderItems.priceUnit,
      amount: OrderItems.amount,
      deliveryDate: OrderItems.deliveryDate,
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(OrderItems)
    .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
    .where(eq(OrderItems.orderUuid, orderUuid))
    .orderBy(asc(OrderItems.lineNumber));

  if (lines.length === 0) {
    return NOTHING_SENT;
  }

  const reference = `OC-${order.id}`;
  const recipients = await resolveRecipients({
    companyUuid: order.companyUuid,
    contactUuid: order.contactUuid,
  });

  return deliver(recipients, `Order confirmation ${order.id}`, {
    documentLabel: "Order confirmation",
    reference,
    companyName: order.companyName ?? "Customer",
    intro:
      "Thank you for your order. We confirm the delivery of the materials below.",
    fields: fieldsOf([
      ["Order number", String(order.id)],
      ["Order date", formatDateValue(order.orderDate, "")],
      ["Delivery date", formatDateValue(order.deliveryDate, "")],
      ["Your reference", order.customerRef],
      ["Our reference", order.ourReference],
      ["Seller", order.seller],
      [
        "Delivery terms",
        order.deliveryTerms ? DELIVERY_TERM_LABELS[order.deliveryTerms] : null,
      ],
      ["Payment terms", paymentTermLabel(order.paymentTerms)],
      [
        "Weight basis",
        order.weightType ? ORDER_WEIGHT_TYPE_LABELS[order.weightType] : null,
      ],
    ]),
    tables: [
      {
        caption: "Confirmed",
        columns: [
          "Line",
          "Product",
          "Description",
          "Dimensions (mm)",
          "Quantity",
          "Weight (kg)",
          "Price",
          "Per",
          "Amount",
        ],
        alignRightFrom: 4,
        rows: lines.map((line) => [
          line.lineNumber ? String(line.lineNumber) : "—",
          ...productLabel(line.productCode, line.productName),
          [line.lengthMm, line.widthMm, Number(line.thicknessMm ?? 0) || null]
            .filter(Boolean)
            .join(" × ") || "—",
          quantity(line.quantity),
          // The billed weight, which is what the reference's own paper prints.
          quantity(line.kgPlanned),
          money(line.netPrice),
          line.priceUnit ?? "—",
          money(line.amount),
        ]),
      },
    ],
    totals: [
      { label: "Total weight", value: `${quantity(order.totalWeightKg)} kg` },
      { label: "Total excl. VAT", value: money(order.totalExclVat) },
      { label: "VAT", value: money(order.vatAmount) },
      {
        label: "Total incl. VAT",
        value: money(order.totalInclVat),
        emphasis: true,
      },
    ],
  });
};
