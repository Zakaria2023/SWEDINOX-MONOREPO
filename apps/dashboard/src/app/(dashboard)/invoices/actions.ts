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
import { InvoiceItems, SelectInvoiceItems } from "@/db/schema/invoice-items";
import { JournalEntries } from "@/db/schema/journal-entries";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { buildSalesInvoiceJournalEntry } from "@/lib/server/accounting";
import {
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
};

export type InvoiceHeaderEdit = Pick<
  InvoiceFields,
  "debtorNo" | "invoiceDate" | "expirationDate" | "paymentTerms" | "explanation"
>;

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
  const exclVat = surcharges.reduce(
    (sum, s) => sum + parseFloat(s.amount ?? "0"),
    0,
  );
  // VAT follows the invoice's VAT scenario: reverse-charge scenarios charge 0%,
  // everything else the standard rate. (Previously hard-coded at 21%.)
  const vatRate = getInvoiceVatRatePercent(fields.vatScenario);
  const vatAmount = exclVat * (vatRate / 100);
  const invoiceAmountInclVat = (exclVat + vatAmount).toFixed(2);
  const creditRestriction = "0.00";
  const invoiceTotal = invoiceAmountInclVat;
  const outstanding = invoiceTotal;

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
    }

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
        invoiceAmountInclVat,
        creditRestriction,
        invoiceTotal,
        outstanding,
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

      for (const id of orderItemUuids) {
        const orderItem = orderItemByUuid.get(id);
        if (!orderItem) {
          continue;
        }

        // Guard: only bill a line that's still "delivered" — a concurrent
        // invoice or cancellation can't double-bill it. Stock already left at
        // delivery, so billing is purely financial: no stock change, no
        // movement — just the invoice line (the journal posting is booked
        // once for the whole invoice above).
        const [itemUpdateResult] = await tx
          .update(OrderItems)
          .set({ status: "invoiced" })
          .where(
            and(eq(OrderItems.uuid, id), eq(OrderItems.status, "delivered")),
          );

        if (itemUpdateResult.affectedRows === 0) {
          throw new Error(
            "One of the selected lines was already billed or cancelled — please refresh and try again.",
          );
        }

        await tx.insert(InvoiceItems).values({
          uuid: generateUuid(),
          invoiceUuid: uuid,
          orderItemUuid: id,
          productUuid: orderItem.productUuid,
          quantity: orderItem.quantity,
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

  return { ...invoice, surcharges, items };
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
      .select({ cancelled: Invoices.cancelled })
      .from(Invoices)
      .where(eq(Invoices.uuid, uuid))
      .limit(1);

    if (!invoice) {
      return { error: "Invoice not found." };
    }
    if (invoice.cancelled) {
      return { error: "Cannot edit a cancelled invoice." };
    }

    // Fill in the due date from the payment term when it wasn't set explicitly.
    const expirationDate =
      fields.expirationDate ??
      (() => {
        const due = getPaymentTermDueDate(
          fields.paymentTerms ?? null,
          fields.invoiceDate ? toDateString(fields.invoiceDate) : null,
        );
        return due ? new Date(`${due}T00:00:00`) : null;
      })();

    await db
      .update(Invoices)
      .set({ ...fields, expirationDate })
      .where(eq(Invoices.uuid, uuid));
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
