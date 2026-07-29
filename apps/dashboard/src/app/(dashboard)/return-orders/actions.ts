"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import {
  InsertReturnOrders,
  InsertReturnOrderSurcharges,
  ReturnOrders,
  ReturnOrderSurcharges,
  SelectReturnOrders,
} from "@/db/schema/return-orders";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  ReturnOrderItems,
  SelectReturnOrderItems,
} from "@/db/schema/return-order-items";
import { SelectReturnOrderSurcharges } from "@/db/schema/return-orders";
import { InsertTexts, SelectTexts, Texts } from "@/db/schema/texts";
import { InvoiceItems, SelectInvoiceItems } from "@/db/schema/invoice-items";
import { Invoices, SelectInvoices } from "@/db/schema/invoices";
import { JournalEntries } from "@/db/schema/journal-entries";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Stock } from "@/db/schema/stock";
import { StockMovements } from "@/db/schema/stock-movements";
import { mailDocument, sendInvoiceEmail } from "@/emails/documents";
import { ReturnOrderReason } from "@/lib/enums";
import {
  describeError,
  generateUuid,
  getInvoiceVatRatePercent,
  getQuoteVatRatePercent,
  todayDateString,
} from "@/lib/helpers";
import { buildSalesJournalEntry } from "@/lib/server/ledger";
import { recordFreightMovement } from "@/lib/server/freight";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq, getTableColumns, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ReturnOrderFields = Omit<
  InsertReturnOrders,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type ReturnOrderSurchargeInput = Omit<
  InsertReturnOrderSurcharges,
  "id" | "uuid" | "returnOrderUuid" | "createdAt" | "updatedAt"
>;

export type ReturnOrderTextInput = Pick<
  InsertTexts,
  "title" | "textBlock" | "textCategoryUuid"
>;

export type ReturnOrderExtras = {
  surcharges: ReturnOrderSurchargeInput[];
  texts: ReturnOrderTextInput[];
};

// Which invoiced line is coming back, and how much of it.
export type ReturnOrderItemInput = {
  orderItemUuid: string;
  returnQty: string;
  returnReason?: ReturnOrderReason | null;
};

// An invoiced order line the customer could send back, priced at what they were
// actually charged for it — not at what the order says today.
export type ReturnableLine = {
  orderItemUuid: SelectOrderItems["uuid"];
  orderUuid: SelectOrderItems["orderUuid"];
  orderId: SelectOrders["id"];
  lineNumber: SelectOrderItems["lineNumber"];
  productUuid: SelectOrderItems["productUuid"];
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  unit: SelectOrderItems["unit"];
  quantity: SelectInvoiceItems["quantity"];
  netPrice: SelectInvoiceItems["netPrice"];
  amount: SelectInvoiceItems["amount"];
  weightKg: SelectInvoiceItems["weightKg"];
  invoiceUuid: NonNullable<SelectInvoices["uuid"]>;
  invoiceId: SelectInvoices["id"];
};

// The invoice lines behind a return — the "Invoice lines" section of the
// document, and the only thing a credit note is allowed to credit against.
export type ReturnInvoiceLine = {
  returnOrderItemUuid: SelectReturnOrderItems["uuid"];
  invoiceUuid: NonNullable<SelectInvoices["uuid"]>;
  invoiceId: SelectInvoices["id"];
  invoiceDate: SelectInvoices["invoiceDate"];
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  invoicedQuantity: SelectInvoiceItems["quantity"];
  netPrice: SelectInvoiceItems["netPrice"];
  amount: SelectInvoiceItems["amount"];
};

export type ReturnOrderActionResult = {
  returnOrderUuid?: string;
  error?: string;
  success?: boolean;
};

export type ReturnOrderListItem = SelectReturnOrders & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export const getReturnOrders = async (): Promise<ReturnOrderListItem[]> => {
  try {
    const rows = await db
      .select({
        ...getTableColumns(ReturnOrders),
        companyName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(ReturnOrders)
      .leftJoin(Companies, eq(ReturnOrders.companyUuid, Companies.uuid))
      .leftJoin(Contacts, eq(ReturnOrders.contactUuid, Contacts.uuid))
      .orderBy(desc(ReturnOrders.createdAt));
    return rows;
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch return orders"));
  }
};

export type ReturnOrderLineDetail = SelectReturnOrderItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type ReturnOrderDetail = SelectReturnOrders & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  // The order being returned against — the link the schema carries and nothing
  // surfaced. A return is only checkable once you can open what it came from.
  originalOrderId: SelectOrders["id"] | null;
  originalOrderStatus: SelectOrders["status"] | null;
  items: ReturnOrderLineDetail[];
  surcharges: SelectReturnOrderSurcharges[];
  texts: SelectTexts[];
  // The "Invoice lines" section: what each returned line was billed on.
  invoiceLines: ReturnInvoiceLine[];
  // The "Credits" section: credit notes raised against this return.
  credits: SelectInvoices[];
};

export const getReturnOrderDetail = async (
  uuid: string,
): Promise<ReturnOrderDetail | null> => {
  const [returnOrder] = await db
    .select({
      ...getTableColumns(ReturnOrders),
      companyName: Companies.companyName,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
      originalOrderId: Orders.id,
      originalOrderStatus: Orders.status,
    })
    .from(ReturnOrders)
    .leftJoin(Companies, eq(ReturnOrders.companyUuid, Companies.uuid))
    .leftJoin(Contacts, eq(ReturnOrders.contactUuid, Contacts.uuid))
    .leftJoin(Orders, eq(ReturnOrders.orderUuid, Orders.uuid))
    .where(eq(ReturnOrders.uuid, uuid))
    .limit(1);

  if (!returnOrder) {
    return null;
  }

  const [items, surcharges, texts, credits] = await Promise.all([
    db
      .select({
        ...getTableColumns(ReturnOrderItems),
        productCode: Products.productCode,
        productName: Products.name,
      })
      .from(ReturnOrderItems)
      .leftJoin(Products, eq(ReturnOrderItems.productUuid, Products.uuid))
      .where(eq(ReturnOrderItems.returnOrderUuid, uuid))
      .orderBy(ReturnOrderItems.lineNumber),

    db
      .select()
      .from(ReturnOrderSurcharges)
      .where(eq(ReturnOrderSurcharges.returnOrderUuid, uuid)),

    db.select().from(Texts).where(eq(Texts.returnOrderUuid, uuid)),

    // Credit notes raised against this return, newest first.
    db
      .select()
      .from(Invoices)
      .where(eq(Invoices.returnOrderUuid, uuid))
      .orderBy(desc(Invoices.createdAt)),
  ]);

  // The invoice line behind each returned line — what it was billed on and for
  // how much, which is the only figure a credit note may be based on.
  const orderItemUuids = items.flatMap((item) =>
    item.originalOrderItemUuid ? [item.originalOrderItemUuid] : [],
  );

  const invoicedRows =
    orderItemUuids.length > 0
      ? await db
          .select({
            orderItemUuid: InvoiceItems.orderItemUuid,
            invoiceUuid: InvoiceItems.invoiceUuid,
            invoiceId: Invoices.id,
            invoiceDate: Invoices.invoiceDate,
            productCode: Products.productCode,
            productName: Products.name,
            invoicedQuantity: InvoiceItems.quantity,
            netPrice: InvoiceItems.netPrice,
            amount: InvoiceItems.amount,
          })
          .from(InvoiceItems)
          .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
          .leftJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
          .where(
            and(
              inArray(InvoiceItems.orderItemUuid, orderItemUuids),
              eq(Invoices.documentType, "invoice"),
            ),
          )
      : [];

  const invoicedByOrderItem = new Map(
    invoicedRows.map((row) => [row.orderItemUuid, row]),
  );

  const invoiceLines = items.flatMap((item) => {
    const invoiced = item.originalOrderItemUuid
      ? invoicedByOrderItem.get(item.originalOrderItemUuid)
      : undefined;
    if (!invoiced) {
      return [];
    }
    return [{ returnOrderItemUuid: item.uuid, ...invoiced }];
  });

  return {
    ...returnOrder,
    items,
    surcharges,
    texts,
    invoiceLines,
    credits,
  };
};

export const updateReturnOrder = async (
  uuid: string,
  fields: ReturnOrderFields,
  extras: ReturnOrderExtras,
): Promise<ReturnOrderActionResult> => {
  try {
    const [existing] = await db
      .select({ status: ReturnOrders.status })
      .from(ReturnOrders)
      .where(eq(ReturnOrders.uuid, uuid))
      .limit(1);

    if (!existing) {
      return { error: "Return order not found." };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(ReturnOrders)
        .set(fields)
        .where(eq(ReturnOrders.uuid, uuid));

      // Surcharges and texts are replaced wholesale: the form submits the
      // complete set, so reconciling row by row would only risk the saved
      // state disagreeing with what was on screen.
      await tx
        .delete(ReturnOrderSurcharges)
        .where(eq(ReturnOrderSurcharges.returnOrderUuid, uuid));
      await tx.delete(Texts).where(eq(Texts.returnOrderUuid, uuid));

      if (extras.surcharges.length > 0) {
        await tx.insert(ReturnOrderSurcharges).values(
          extras.surcharges.map((surcharge) => ({
            ...surcharge,
            uuid: generateUuid(),
            returnOrderUuid: uuid,
          })),
        );
      }

      if (extras.texts.length > 0) {
        await tx.insert(Texts).values(
          extras.texts.map((text) => ({
            uuid: generateUuid(),
            returnOrderUuid: uuid,
            companyUuid: fields.companyUuid,
            title: text.title,
            textBlock: text.textBlock,
            textCategoryUuid: text.textCategoryUuid ?? null,
          })),
        );
      }
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update return order",
    };
  }

  revalidatePath("/return-orders");
  revalidatePath(`/return-orders/${uuid}`);
  redirect(`/return-orders/${uuid}`);
};

export const deleteReturnOrder = async (
  uuid: string,
): Promise<ReturnOrderActionResult> => {
  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(ReturnOrderItems)
        .where(eq(ReturnOrderItems.returnOrderUuid, uuid));
      await tx
        .delete(ReturnOrderSurcharges)
        .where(eq(ReturnOrderSurcharges.returnOrderUuid, uuid));
      await tx.delete(Texts).where(eq(Texts.returnOrderUuid, uuid));
      await tx.delete(ReturnOrders).where(eq(ReturnOrders.uuid, uuid));
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete return order",
    };
  }

  revalidatePath("/return-orders");
  revalidatePath("/return-lines");
  redirect("/return-orders");
};

// The invoice line that billed an order line, joined so a return is always
// priced at what the customer was actually charged. An order line that was
// never invoiced can't come back through this door: there is nothing to credit.
const invoicedLineColumns = {
  orderItemUuid: OrderItems.uuid,
  orderUuid: OrderItems.orderUuid,
  orderId: Orders.id,
  lineNumber: OrderItems.lineNumber,
  productUuid: OrderItems.productUuid,
  productCode: Products.productCode,
  productName: Products.name,
  unit: OrderItems.unit,
  quantity: InvoiceItems.quantity,
  netPrice: InvoiceItems.netPrice,
  amount: InvoiceItems.amount,
  weightKg: InvoiceItems.weightKg,
  invoiceUuid: InvoiceItems.invoiceUuid,
  invoiceId: Invoices.id,
};

/**
 * Invoiced lines a customer could send back.
 *
 * Only lines still at "invoiced" appear: one already returned is terminal, so
 * the same delivery can't be credited twice. Cancelled invoices are excluded —
 * crediting against a voided invoice would hand back money never charged.
 */
export const getReturnableLines = async (
  companyUuid: string,
): Promise<ReturnableLine[]> =>
  db
    .select(invoicedLineColumns)
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .innerJoin(InvoiceItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
    .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
    .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
    .where(
      and(
        eq(Orders.companyUuid, companyUuid),
        eq(OrderItems.status, "invoiced"),
        eq(Invoices.cancelled, false),
        eq(Invoices.documentType, "invoice"),
      ),
    )
    .orderBy(desc(OrderItems.createdAt));

/**
 * Rolls the return's lines and surcharges up into the header snapshot the
 * document shows — the same shape the sales order and invoice report, so a
 * return reads like the thing it reverses.
 */
const buildReturnOrderSummary = async (
  tx: Pick<typeof db, "select">,
  returnOrderUuid: string,
  companyUuid: string,
  calculateVatIfApplicable: boolean,
) => {
  const [lines, surcharges, [company]] = await Promise.all([
    tx
      .select({
        amount: ReturnOrderItems.amount,
        weightKg: ReturnOrderItems.weightKg,
      })
      .from(ReturnOrderItems)
      .where(eq(ReturnOrderItems.returnOrderUuid, returnOrderUuid)),
    tx
      .select({ amount: ReturnOrderSurcharges.amount })
      .from(ReturnOrderSurcharges)
      .where(eq(ReturnOrderSurcharges.returnOrderUuid, returnOrderUuid)),
    tx
      .select({ calculateVat: Companies.calculateVat })
      .from(Companies)
      .where(eq(Companies.uuid, companyUuid))
      .limit(1),
  ]);

  const materialsRevenue = lines.reduce(
    (sum, line) => sum + Number(line.amount ?? 0),
    0,
  );
  const surchargesRevenue = surcharges.reduce(
    (sum, surcharge) => sum + Number(surcharge.amount ?? 0),
    0,
  );
  const totalWeightKg = lines.reduce(
    (sum, line) => sum + Number(line.weightKg ?? 0),
    0,
  );

  const totalExclVat = materialsRevenue + surchargesRevenue;
  const vatRate = getQuoteVatRatePercent(
    calculateVatIfApplicable,
    company?.calculateVat,
  );
  const vatAmount = totalExclVat * (vatRate / 100);

  return {
    materialsRevenue: materialsRevenue.toFixed(2),
    // Options aren't priced separately anywhere yet, so this stays zero rather
    // than quietly folding option value into materials.
    optionsRevenue: "0.00",
    surchargesRevenue: surchargesRevenue.toFixed(2),
    totalExclVat: totalExclVat.toFixed(2),
    vatAmount: vatAmount.toFixed(2),
    totalInclVat: (totalExclVat + vatAmount).toFixed(2),
    totalWeightKg: totalWeightKg.toFixed(2),
  };
};

/**
 * Books a received return back into stock and marks it received.
 *
 * The goods go back onto the exact lot they were picked from, at the value they
 * left at. That keeps the stock ledger symmetrical with the delivery that
 * consumed it, and it is the only valuation we can defend: whatever the lot was
 * worth when it shipped is what it is worth coming back.
 *
 * Receiving is separate from crediting on purpose. Goods arriving and money
 * being handed back are two different decisions, and the reference system
 * carries two statuses for exactly that reason.
 */
export const receiveReturnOrder = async (
  uuid: string,
): Promise<ReturnOrderActionResult> => {
  try {
    const [returnOrder] = await db
      .select({ status: ReturnOrders.status })
      .from(ReturnOrders)
      .where(eq(ReturnOrders.uuid, uuid))
      .limit(1);

    if (!returnOrder) {
      return { error: "Return order not found." };
    }
    if (returnOrder.status === "received" || returnOrder.status === "credited") {
      return { error: "This return has already been received." };
    }
    if (returnOrder.status === "cancelled") {
      return { error: "This return was cancelled." };
    }

    const items = await db
      .select()
      .from(ReturnOrderItems)
      .where(eq(ReturnOrderItems.returnOrderUuid, uuid));

    if (items.length === 0) {
      return { error: "This return has no lines to receive." };
    }

    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      const [claimed] = await tx
        .update(ReturnOrders)
        .set({ status: "received", returnDate: new Date() })
        .where(
          and(
            eq(ReturnOrders.uuid, uuid),
            inArray(ReturnOrders.status, ["open", "in_progress"]),
          ),
        );

      if (claimed.affectedRows === 0) {
        throw new Error(
          "This return was already received — please refresh and try again.",
        );
      }

      for (const item of items) {
        if (!item.originalOrderItemUuid) {
          continue;
        }

        const [orderItem] = await tx
          .select({
            stockUuid: OrderItems.stockUuid,
            productUuid: OrderItems.productUuid,
            orderUuid: OrderItems.orderUuid,
          })
          .from(OrderItems)
          .where(eq(OrderItems.uuid, item.originalOrderItemUuid))
          .limit(1);

        if (!orderItem) {
          continue;
        }

        const [stockRow] = await tx
          .select()
          .from(Stock)
          .where(eq(Stock.uuid, orderItem.stockUuid))
          .limit(1);

        if (!stockRow) {
          continue;
        }

        const returned = Number(item.returnQty ?? 0);
        const nextQuantity = (Number(stockRow.quantity) + returned).toFixed(3);

        const [stockUpdate] = await tx
          .update(Stock)
          .set({
            quantity: nextQuantity,
            // Anything back on the shelf is sellable again.
            status: "pending",
          })
          .where(
            and(
              eq(Stock.uuid, orderItem.stockUuid),
              eq(Stock.quantity, stockRow.quantity),
            ),
          );

        if (stockUpdate.affectedRows === 0) {
          throw new Error(
            "Stock changed while receiving the return — please refresh and try again.",
          );
        }

        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid: orderItem.productUuid,
          stockUuid: orderItem.stockUuid,
          type: "in",
          reason: "sales_return",
          quantity: item.returnQty ?? "0.000",
          orderUuid: orderItem.orderUuid,
          createdByUserId: userId,
        });

        await recordFreightMovement(tx, {
          productUuid: orderItem.productUuid,
          quantity: item.returnQty ?? "0.000",
          type: "in",
          reason: "sales_return",
          orderUuid: orderItem.orderUuid,
          operator: userId,
        });
      }
    });

    revalidatePath("/return-orders");
    revalidatePath(`/return-orders/${uuid}`);
    revalidatePath("/stock");
    revalidatePath("/stock-movements");
    return { success: true, returnOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to receive return order",
    };
  }
};

/**
 * Raises the credit note for a received return.
 *
 * The credit note is an Invoices row with its amounts negated, so it ages,
 * posts and settles through the machinery invoices already use — and its
 * negative `outstanding` nets the customer's balance down, handing back the
 * credit space the original invoice consumed.
 *
 * Every line is credited at the price it was invoiced at, never at what the
 * order says today, and never for more than was billed.
 */
export const creditReturnOrder = async (
  uuid: string,
): Promise<ReturnOrderActionResult> => {
  const creditNoteUuid = generateUuid();
  try {
    const [returnOrder] = await db
      .select()
      .from(ReturnOrders)
      .where(eq(ReturnOrders.uuid, uuid))
      .limit(1);

    if (!returnOrder) {
      return { error: "Return order not found." };
    }
    if (returnOrder.status === "credited") {
      return { error: "This return has already been credited." };
    }
    if (returnOrder.status !== "received") {
      return {
        error: "Receive the goods before crediting them back to the customer.",
      };
    }
    if (returnOrder.invoiceBlockage) {
      return {
        error: `This return is blocked for invoicing${returnOrder.blockingReason ? ` — ${returnOrder.blockingReason}` : ""}.`,
      };
    }

    const items = await db
      .select()
      .from(ReturnOrderItems)
      .where(eq(ReturnOrderItems.returnOrderUuid, uuid));

    const creditable = items.filter((item) => !!item.originalOrderItemUuid);
    if (creditable.length === 0) {
      return {
        error:
          "None of these lines point at an invoiced order line, so there is nothing to credit.",
      };
    }

    // What each line was actually billed at. Re-read now rather than trusting
    // the copy taken when the return was raised: the invoice may have been
    // corrected or cancelled in between.
    const invoicedRows = await db
      .select({
        orderItemUuid: InvoiceItems.orderItemUuid,
        quantity: InvoiceItems.quantity,
        netPrice: InvoiceItems.netPrice,
        costPrice: InvoiceItems.costPrice,
        replacementPrice: InvoiceItems.replacementPrice,
        weightKg: InvoiceItems.weightKg,
        productUuid: InvoiceItems.productUuid,
        invoiceUuid: InvoiceItems.invoiceUuid,
        vatScenario: Invoices.vatScenario,
        paymentTerms: Invoices.paymentTerms,
        debtorNo: Invoices.debtorNo,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .where(
        and(
          inArray(
            InvoiceItems.orderItemUuid,
            creditable.flatMap((item) =>
              item.originalOrderItemUuid ? [item.originalOrderItemUuid] : [],
            ),
          ),
          eq(Invoices.cancelled, false),
          eq(Invoices.documentType, "invoice"),
        ),
      );

    const invoicedByOrderItem = new Map(
      invoicedRows.map((row) => [row.orderItemUuid, row]),
    );

    const creditLines: {
      orderItemUuid: string;
      productUuid: string;
      quantity: number;
      netPrice: number;
      costPrice: number;
      replacementPrice: number;
      weightKg: number;
      invoiceUuid: string;
    }[] = [];

    for (const item of creditable) {
      const orderItemUuid = item.originalOrderItemUuid;
      if (!orderItemUuid) {
        continue;
      }

      const invoiced = invoicedByOrderItem.get(orderItemUuid);
      if (!invoiced) {
        return {
          error:
            "One or more lines were never invoiced, or their invoice was cancelled — there is nothing to credit against.",
        };
      }

      const returnQty = Number(item.returnQty ?? 0);
      if (returnQty <= 0) {
        return { error: "Every credited line needs a return quantity." };
      }
      // The guard that matters: a return can never hand back more than was
      // charged for it.
      if (returnQty > Number(invoiced.quantity)) {
        return {
          error: `Cannot credit more than was invoiced (${Number(invoiced.quantity).toFixed(3)}).`,
        };
      }

      const invoicedQty = Number(invoiced.quantity) || 1;
      creditLines.push({
        orderItemUuid,
        productUuid: invoiced.productUuid,
        quantity: returnQty,
        netPrice: Number(invoiced.netPrice ?? 0),
        costPrice: Number(invoiced.costPrice ?? 0),
        replacementPrice: Number(invoiced.replacementPrice ?? 0),
        // Weight was billed for the whole line; credit it in proportion.
        weightKg: (Number(invoiced.weightKg ?? 0) / invoicedQty) * returnQty,
        invoiceUuid: invoiced.invoiceUuid,
      });
    }

    const [first] = invoicedRows;
    // Only claim to credit one specific invoice when every line came from it.
    const sourceInvoiceUuids = new Set(
      creditLines.map((line) => line.invoiceUuid),
    );
    const creditsInvoiceUuid =
      sourceInvoiceUuids.size === 1 ? [...sourceInvoiceUuids][0] : null;

    const materials = creditLines.reduce(
      (sum, line) => sum + line.netPrice * line.quantity,
      0,
    );
    const surchargeRows = await db
      .select({ amount: ReturnOrderSurcharges.amount })
      .from(ReturnOrderSurcharges)
      .where(eq(ReturnOrderSurcharges.returnOrderUuid, uuid));
    const surchargeTotal = surchargeRows.reduce(
      (sum, row) => sum + Number(row.amount ?? 0),
      0,
    );

    const exclVat = materials + surchargeTotal;
    const vatRate = getInvoiceVatRatePercent(first?.vatScenario ?? null);
    const vatAmount = exclVat * (vatRate / 100);
    const inclVat = exclVat + vatAmount;

    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      // Claim the return first: whoever gets here second finds it credited and
      // stops, so a double click can't raise two credit notes.
      const [claimed] = await tx
        .update(ReturnOrders)
        .set({ status: "credited" })
        .where(
          and(eq(ReturnOrders.uuid, uuid), eq(ReturnOrders.status, "received")),
        );

      if (claimed.affectedRows === 0) {
        throw new Error(
          "This return was already credited — please refresh and try again.",
        );
      }

      // Every figure negative: this document takes value off the customer's
      // account rather than adding it.
      await tx.insert(Invoices).values({
        uuid: creditNoteUuid,
        documentType: "credit_note",
        returnOrderUuid: uuid,
        creditsInvoiceUuid,
        companyUuid: returnOrder.companyUuid,
        debtorNo: first?.debtorNo ?? null,
        invoiceDate: new Date(),
        expirationDate: new Date(),
        paymentTerms: returnOrder.paymentTerms ?? first?.paymentTerms ?? null,
        vatScenario: first?.vatScenario ?? null,
        invoiceAmountExclVat: (-exclVat).toFixed(2),
        invoiceAmountInclVat: (-inclVat).toFixed(2),
        // A credit note extends no credit, so it carries no surcharge for it.
        creditRestriction: "0.00",
        invoiceTotal: (-inclVat).toFixed(2),
        outstanding: (-inclVat).toFixed(2),
        materialsRevenue: (-materials).toFixed(2),
        surchargesRevenue: (-surchargeTotal).toFixed(2),
        totalWeightKg: (-creditLines.reduce(
          (sum, line) => sum + line.weightKg,
          0,
        )).toFixed(2),
        explanation: `Credit note for return order ${returnOrder.id}`,
      });

      const [inserted] = await tx
        .select({ id: Invoices.id })
        .from(Invoices)
        .where(eq(Invoices.uuid, creditNoteUuid))
        .limit(1);

      await tx.insert(JournalEntries).values(
        buildSalesJournalEntry({
          invoiceUuid: creditNoteUuid,
          invoiceId: inserted?.id ?? null,
          companyUuid: returnOrder.companyUuid,
          debCreditor: first?.debtorNo ?? null,
          invoiceDate: new Date(),
          // Already negative, so this books as a reduction of revenue without
          // needing the reversal flag.
          amountExclVat: -exclVat,
          vatAmount: -vatAmount,
          userId,
          description: "Credit note",
        }),
      );

      for (const line of creditLines) {
        // Guard: only credit a line still sitting at "invoiced". A line already
        // returned is terminal, so the same goods can't be credited twice.
        const [lineClaimed] = await tx
          .update(OrderItems)
          .set({ status: "returned" })
          .where(
            and(
              eq(OrderItems.uuid, line.orderItemUuid),
              eq(OrderItems.status, "invoiced"),
            ),
          );

        if (lineClaimed.affectedRows === 0) {
          throw new Error(
            "One of these lines was already returned or cancelled — please refresh and try again.",
          );
        }

        const amount = -(line.netPrice * line.quantity);
        const costAmount = -(line.costPrice * line.quantity);

        await tx.insert(InvoiceItems).values({
          uuid: generateUuid(),
          invoiceUuid: creditNoteUuid,
          orderItemUuid: line.orderItemUuid,
          productUuid: line.productUuid,
          quantity: (-line.quantity).toFixed(3),
          netPrice: line.netPrice.toFixed(2),
          amount: amount.toFixed(2),
          costPrice: line.costPrice.toFixed(4),
          costAmount: costAmount.toFixed(2),
          replacementPrice: line.replacementPrice.toFixed(2),
          // Margin reverses with the sale: the profit booked on the original
          // line is given back along with the revenue.
          profit: (amount - costAmount).toFixed(2),
          profitMargin: "0.00",
          profitReplPrice: (
            amount +
            line.replacementPrice * line.quantity
          ).toFixed(2),
          weightKg: (-line.weightKg).toFixed(2),
        });
      }
    });

    await mailDocument(
      () => sendInvoiceEmail(creditNoteUuid),
      `Credit note ${creditNoteUuid}`,
    );

    revalidatePath("/return-orders");
    revalidatePath(`/return-orders/${uuid}`);
    revalidatePath("/invoices");
    revalidatePath("/orders");
    revalidatePath("/financially-blocked");
    return { success: true, returnOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to credit return order",
    };
  }
};

export const createReturnOrder = async (
  fields: ReturnOrderFields,
  extras: ReturnOrderExtras,
  items: ReturnOrderItemInput[] = [],
): Promise<ReturnOrderActionResult> => {
  const uuid = generateUuid();
  try {
    // Resolve what is coming back before writing anything: the line has to be
    // one this customer was actually invoiced for.
    const returnable = await getReturnableLines(fields.companyUuid);
    const returnableByUuid = new Map(
      returnable.map((line) => [line.orderItemUuid, line]),
    );

    for (const item of items) {
      const line = returnableByUuid.get(item.orderItemUuid);
      if (!line) {
        return {
          error:
            "One or more selected lines are not invoiced to this customer, or have already been returned.",
        };
      }
      const returnQty = Number(item.returnQty ?? 0);
      if (returnQty <= 0) {
        return { error: "Every returned line needs a quantity." };
      }
      if (returnQty > Number(line.quantity)) {
        return {
          error: `Cannot return more than was invoiced (${Number(line.quantity).toFixed(3)}).`,
        };
      }
    }

    await db.transaction(async (tx) => {
      await tx.insert(ReturnOrders).values({
        ...fields,
        uuid,
        orderDate: fields.orderDate ?? todayDateString(),
      });

      // Lines were previously dropped on the floor here — a return order was
      // only ever a header, which is why nothing downstream could credit it.
      for (const [index, item] of items.entries()) {
        const line = returnableByUuid.get(item.orderItemUuid);
        if (!line) {
          continue;
        }

        const returnQty = Number(item.returnQty);
        const invoicedQty = Number(line.quantity) || 1;
        const netPrice = Number(line.netPrice ?? 0);

        await tx.insert(ReturnOrderItems).values({
          uuid: generateUuid(),
          returnOrderUuid: uuid,
          productUuid: line.productUuid,
          originalOrderUuid: line.orderUuid,
          originalOrderLine: line.lineNumber,
          originalOrderItemUuid: line.orderItemUuid,
          lineNumber: index + 1,
          reference: line.orderId != null ? String(line.orderId) : null,
          unit: line.unit,
          quantity: line.quantity,
          returnQty: returnQty.toFixed(3),
          returnReason: item.returnReason ?? fields.returnReason ?? null,
          netPrice: netPrice.toFixed(2),
          amount: (netPrice * returnQty).toFixed(2),
          weightKg: (
            (Number(line.weightKg ?? 0) / invoicedQty) *
            returnQty
          ).toFixed(2),
        });
      }

      if (extras.surcharges.length > 0) {
        await tx.insert(ReturnOrderSurcharges).values(
          extras.surcharges.map((surcharge) => ({
            ...surcharge,
            uuid: generateUuid(),
            returnOrderUuid: uuid,
          })),
        );
      }

      if (extras.texts.length > 0) {
        await tx.insert(Texts).values(
          extras.texts.map((text) => ({
            uuid: generateUuid(),
            returnOrderUuid: uuid,
            companyUuid: fields.companyUuid,
            title: text.title,
            textBlock: text.textBlock,
            textCategoryUuid: text.textCategoryUuid ?? null,
          })),
        );
      }

      // The Summary panel on the document — materials, surcharges, VAT and
      // weight — rolled up once the lines and surcharges are in.
      await tx
        .update(ReturnOrders)
        .set(
          await buildReturnOrderSummary(
            tx,
            uuid,
            fields.companyUuid,
            fields.calculateVatIfApplicable ?? false,
          ),
        )
        .where(eq(ReturnOrders.uuid, uuid));
    });
    revalidatePath("/return-orders");
    revalidatePath("/return-lines");
    return { success: true, returnOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create return order",
    };
  }
};
