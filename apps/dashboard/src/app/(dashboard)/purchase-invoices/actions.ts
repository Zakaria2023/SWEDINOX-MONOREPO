"use server";

import {
  Companies,
  Contacts,
  db,
  InsertPurchaseInvoices,
  InsertPurchaseInvoiceSurcharges,
  PurchaseInvoices,
  PurchaseInvoiceSurcharges,
  SelectCompanies,
  SelectContacts,
  SelectPurchaseInvoices,
} from "@/db";
import {
  PurchaseInvoiceItems,
  SelectPurchaseInvoiceItems,
} from "@/db/schema/purchase-invoice-items";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import { Stock } from "@/db/schema/stock";
import {
  SelectStockMovements,
  StockMovements,
} from "@/db/schema/stock-movements";
import {
  InsertJournalEntries,
  JournalEntries,
} from "@/db/schema/journal-entries";
import { recordFreightMovement } from "@/lib/server/freight";
import {
  generateUuid,
  getPaymentTermDueDate,
  toDateString,
} from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq, getTableColumns, gte, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PurchaseInvoiceActionResult = {
  purchaseInvoiceUuid?: string;
  error?: string;
  success?: boolean;
};

export type PurchaseInvoiceFields = Omit<
  InsertPurchaseInvoices,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type PurchaseInvoiceItemInput = {
  purchaseOrderItemUuid: string;
  quantity: string;
};

export type PurchaseInvoiceSurchargeInput = Omit<
  InsertPurchaseInvoiceSurcharges,
  "id" | "uuid" | "purchaseInvoiceUuid" | "createdAt" | "updatedAt"
>;

export type PurchaseInvoiceListItem = SelectPurchaseInvoices & {
  companyName: SelectCompanies["companyName"] | null;
  supplierCode: SelectCompanies["id"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export type PurchaseInvoiceHeaderEdit = Pick<
  PurchaseInvoiceFields,
  | "invoiceNumberSupplier"
  | "creditorNo"
  | "creditorNo2"
  | "invoiceDate"
  | "expirationDate"
  | "paymentTerms"
  | "remarks"
>;

export type PurchaseInvoiceItemDetail = SelectPurchaseInvoiceItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type PurchaseInvoiceDetail = SelectPurchaseInvoices & {
  companyName: SelectCompanies["companyName"] | null;
  supplierCode: SelectCompanies["id"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  items: PurchaseInvoiceItemDetail[];
  movements: SelectStockMovements[];
};

type PurchaseInvoicePosting = {
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
};

// Placeholder GL account code for purchases; swap for the real chart of
// accounts later.
const PURCHASES_ACCOUNT = "7000";

// A purchase invoice posts to the purchase journal with the creditor as the
// counter-account. `invoiceUuid` here is the purchase invoice's uuid and is
// linked via purchaseInvoiceUuid (invoiceUuid is reserved for sales invoices).
const buildPurchaseInvoiceJournalEntry = (
  posting: PurchaseInvoicePosting,
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
    journal: "purchase",
    account: PURCHASES_ACCOUNT,
    debCreditor: posting.debCreditor,
    description: posting.reversal
      ? "Purchase invoice cancelled"
      : "Purchase invoice",
    amount: (sign * posting.amountExclVat).toFixed(2),
    vat: (sign * posting.vatAmount).toFixed(2),
    companyUuid: posting.companyUuid,
    purchaseInvoiceUuid: posting.invoiceUuid,
    createdByUserId: posting.userId,
  };
};

export const getPurchaseInvoices = async (): Promise<
  PurchaseInvoiceListItem[]
> =>
  db
    .select({
      ...getTableColumns(PurchaseInvoices),
      companyName: Companies.companyName,
      supplierCode: Companies.id,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
    })
    .from(PurchaseInvoices)
    .leftJoin(Companies, eq(PurchaseInvoices.companyUuid, Companies.uuid))
    .leftJoin(
      Contacts,
      eq(PurchaseInvoices.invoiceSentByContactUuid, Contacts.uuid),
    )
    .orderBy(desc(PurchaseInvoices.createdAt));

export const createPurchaseInvoice = async (
  fields: PurchaseInvoiceFields,
  items: PurchaseInvoiceItemInput[] = [],
  surcharges: PurchaseInvoiceSurchargeInput[] = [],
): Promise<PurchaseInvoiceActionResult> => {
  const uuid = generateUuid();
  // Amounts posted to the purchase journal.
  const exclVat =
    Number(fields.materials ?? 0) +
    Number(fields.optionsAmount ?? 0) +
    Number(fields.surcharges ?? 0);
  const vatAmount =
    Number(fields.vatHigh ?? 0) +
    Number(fields.vatMiddle ?? 0) +
    Number(fields.vatLow ?? 0);
  try {
    // Validate the selected purchase-order lines before opening the
    // transaction. Receiving goods draws down the outstanding ordered quantity.
    const poItemByUuid = new Map<string, SelectPurchaseOrderItems>();
    if (items.length > 0) {
      const poItemUuids = items.map((item) => item.purchaseOrderItemUuid);
      const poItemRows = await db
        .select()
        .from(PurchaseOrderItems)
        .where(inArray(PurchaseOrderItems.uuid, poItemUuids));
      for (const row of poItemRows) {
        poItemByUuid.set(row.uuid, row);
      }

      for (const item of items) {
        const poItem = poItemByUuid.get(item.purchaseOrderItemUuid);
        if (!poItem) {
          return {
            error: "One or more selected order lines could not be found.",
          };
        }
        const remaining =
          Number(poItem.quantity) - Number(poItem.qtyReceived ?? 0);
        if (Number(item.quantity) <= 0) {
          return { error: "Received quantity must be greater than zero." };
        }
        if (Number(item.quantity) > remaining) {
          return {
            error: `Cannot receive more than the outstanding ordered quantity (${remaining.toFixed(3)}).`,
          };
        }
      }
    }

    const user = await currentUser();
    const userId = user?.id ?? null;
    // Receiving stock records who did it, so require an authenticated user.
    if (items.length > 0 && !userId) {
      return { error: "User not authenticated" };
    }

    // Derive the due date from the payment term when it isn't set and the term
    // pins a date to the supplier's invoice date (e.g. "within 30 days").
    const derivedExpiration =
      fields.expirationDate ??
      (() => {
        const due = getPaymentTermDueDate(
          fields.paymentTerms ?? null,
          fields.invoiceDate ? toDateString(fields.invoiceDate) : null,
        );
        return due ? new Date(`${due}T00:00:00`) : null;
      })();

    await db.transaction(async (tx) => {
      await tx.insert(PurchaseInvoices).values({
        ...fields,
        expirationDate: derivedExpiration,
        uuid,
        // Owed to the supplier in full until payments are registered against
        // it. Falls back to the computed gross when no total was supplied.
        outstanding: (
          Number(fields.invoiceTotal ?? 0) || exclVat + vatAmount
        ).toFixed(2),
      });

      const [inserted] = await tx
        .select({ id: PurchaseInvoices.id })
        .from(PurchaseInvoices)
        .where(eq(PurchaseInvoices.uuid, uuid))
        .limit(1);

      await tx.insert(JournalEntries).values(
        buildPurchaseInvoiceJournalEntry({
          invoiceUuid: uuid,
          invoiceId: inserted?.id ?? null,
          companyUuid: fields.companyUuid ?? null,
          debCreditor: fields.creditorNo ?? null,
          invoiceDate: fields.invoiceDate ?? null,
          amountExclVat: exclVat,
          vatAmount,
          userId,
        }),
      );

      for (const item of items) {
        const poItem = poItemByUuid.get(item.purchaseOrderItemUuid);
        if (!poItem) {
          continue;
        }
        if (!userId) {
          throw new Error("User not authenticated");
        }

        // Book the receipt against the PO line, guarding with the outstanding
        // quantity so a concurrent invoice can't over-receive the same line —
        // if another transaction already received it, affectedRows is 0 and we
        // roll back instead of double-booking stock.
        const [poUpdateResult] = await tx
          .update(PurchaseOrderItems)
          .set({
            qtyReceived: sql`${PurchaseOrderItems.qtyReceived} + ${item.quantity}`,
          })
          .where(
            and(
              eq(PurchaseOrderItems.uuid, item.purchaseOrderItemUuid),
              gte(
                sql`(${PurchaseOrderItems.quantity} - ${PurchaseOrderItems.qtyReceived})`,
                item.quantity,
              ),
            ),
          );

        if (poUpdateResult.affectedRows === 0) {
          throw new Error(
            "The order line changed while processing this invoice — please refresh and try again.",
          );
        }

        // The goods physically arrive now: create the stock lot and log the
        // "in". This is the receipt — the purchase order only recorded intent.
        //
        // The lot is valued at what was agreed to pay for it. This is the
        // moment a cost enters the business: every sales order later drawn from
        // this lot is costed against this figure, so a lot received without one
        // would make every downstream margin a fiction.
        const valuationPrice = Number(poItem.netPrice ?? 0);
        const stockUuid = generateUuid();
        await tx.insert(Stock).values({
          uuid: stockUuid,
          productUuid: poItem.productUuid,
          purchaseOrderUuid: poItem.purchaseOrderUuid,
          purchaseOrderItemUuid: poItem.uuid,
          supplierUuid: fields.companyUuid ?? null,
          quantity: item.quantity,
          status: "pending",
          valuationPrice: valuationPrice.toFixed(4),
          valuationEuro: (valuationPrice * Number(item.quantity)).toFixed(2),
        });

        await tx.insert(PurchaseInvoiceItems).values({
          uuid: generateUuid(),
          purchaseInvoiceUuid: uuid,
          stockUuid,
          productUuid: poItem.productUuid,
          quantity: item.quantity,
        });

        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid: poItem.productUuid,
          stockUuid,
          type: "in",
          reason: "purchase_receipt",
          quantity: item.quantity,
          purchaseOrderUuid: poItem.purchaseOrderUuid,
          purchaseInvoiceUuid: uuid,
          createdByUserId: userId,
        });

        await recordFreightMovement(tx, {
          productUuid: poItem.productUuid,
          quantity: item.quantity,
          type: "in",
          reason: "purchase_receipt",
          purchaseOrderUuid: poItem.purchaseOrderUuid,
          supplierUuid: fields.companyUuid ?? null,
          operator: userId,
        });
      }

      if (surcharges.length > 0) {
        await tx.insert(PurchaseInvoiceSurcharges).values(
          surcharges.map((surcharge) => ({
            ...surcharge,
            uuid: generateUuid(),
            purchaseInvoiceUuid: uuid,
          })),
        );
      }
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create purchase invoice",
    };
  }

  revalidatePath("/purchase-invoices");
  revalidatePath("/stock");
  revalidatePath("/stock-movements");
  redirect("/purchase-invoices");
};

export const updatePurchaseInvoice = async (
  uuid: string,
  fields: PurchaseInvoiceHeaderEdit,
): Promise<PurchaseInvoiceActionResult> => {
  try {
    const [invoice] = await db
      .select({ cancelled: PurchaseInvoices.cancelled })
      .from(PurchaseInvoices)
      .where(eq(PurchaseInvoices.uuid, uuid))
      .limit(1);

    if (!invoice) {
      return { error: "Purchase invoice not found." };
    }
    if (invoice.cancelled) {
      return { error: "Cannot edit a cancelled purchase invoice." };
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
      .update(PurchaseInvoices)
      .set({ ...fields, expirationDate })
      .where(eq(PurchaseInvoices.uuid, uuid));
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update purchase invoice",
    };
  }

  revalidatePath("/purchase-invoices");
  revalidatePath(`/purchase-invoices/${uuid}`);
  redirect(`/purchase-invoices/${uuid}`);
};

export const getPurchaseInvoiceDetail = async (
  uuid: string,
): Promise<PurchaseInvoiceDetail | null> => {
  const [invoice] = await db
    .select({
      ...getTableColumns(PurchaseInvoices),
      companyName: Companies.companyName,
      supplierCode: Companies.id,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
    })
    .from(PurchaseInvoices)
    .leftJoin(Companies, eq(PurchaseInvoices.companyUuid, Companies.uuid))
    .leftJoin(
      Contacts,
      eq(PurchaseInvoices.invoiceSentByContactUuid, Contacts.uuid),
    )
    .where(eq(PurchaseInvoices.uuid, uuid))
    .limit(1);

  if (!invoice) {
    return null;
  }

  const items = await db
    .select({
      ...getTableColumns(PurchaseInvoiceItems),
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(PurchaseInvoiceItems)
    .leftJoin(Products, eq(PurchaseInvoiceItems.productUuid, Products.uuid))
    .where(eq(PurchaseInvoiceItems.purchaseInvoiceUuid, uuid));

  const movements = await db
    .select()
    .from(StockMovements)
    .where(eq(StockMovements.purchaseInvoiceUuid, uuid))
    .orderBy(desc(StockMovements.createdAt));

  return { ...invoice, items, movements };
};

export const cancelPurchaseInvoice = async (
  uuid: string,
): Promise<PurchaseInvoiceActionResult> => {
  try {
    const [invoice] = await db
      .select()
      .from(PurchaseInvoices)
      .where(eq(PurchaseInvoices.uuid, uuid))
      .limit(1);

    if (!invoice) {
      return { error: "Purchase invoice not found." };
    }

    if (invoice.cancelled) {
      return { error: "This purchase invoice is already cancelled." };
    }

    const items = await db
      .select()
      .from(PurchaseInvoiceItems)
      .where(eq(PurchaseInvoiceItems.purchaseInvoiceUuid, uuid));

    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(PurchaseInvoices)
        .set({ cancelled: true })
        .where(eq(PurchaseInvoices.uuid, uuid));

      // Reverse the purchase invoice's ledger posting.
      await tx.insert(JournalEntries).values(
        buildPurchaseInvoiceJournalEntry({
          invoiceUuid: uuid,
          invoiceId: invoice.id,
          companyUuid: invoice.companyUuid,
          debCreditor: invoice.creditorNo,
          invoiceDate: invoice.invoiceDate,
          amountExclVat:
            Number(invoice.materials) +
            Number(invoice.optionsAmount) +
            Number(invoice.surcharges),
          vatAmount:
            Number(invoice.vatHigh) +
            Number(invoice.vatMiddle) +
            Number(invoice.vatLow),
          userId: userId ?? null,
          reversal: true,
        }),
      );

      for (const item of items) {
        const [stockRow] = await tx
          .select()
          .from(Stock)
          .where(eq(Stock.uuid, item.stockUuid))
          .limit(1);

        if (!stockRow) {
          continue;
        }

        // The receipt can only be reversed while the lot is still fully on hand
        // and unreserved — once any of it is reserved or sold, undoing the
        // invoice would leave stock in an impossible state, so block it.
        if (
          stockRow.status === "cancelled" ||
          Number(stockRow.reservedQuantity) > 0 ||
          Number(stockRow.quantity) < Number(item.quantity)
        ) {
          throw new Error(
            "Cannot cancel: received stock from this invoice has already been reserved or consumed.",
          );
        }

        const remainingQuantity = (
          Number(stockRow.quantity) - Number(item.quantity)
        ).toFixed(3);

        // Reverse the "in" — pull the received goods back out of stock.
        await tx
          .update(Stock)
          .set({ quantity: remainingQuantity, status: "cancelled" })
          .where(eq(Stock.uuid, item.stockUuid));

        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid: item.productUuid,
          stockUuid: item.stockUuid,
          type: "out",
          reason: "invoice_cancelled",
          quantity: item.quantity,
          purchaseInvoiceUuid: uuid,
          createdByUserId: userId,
        });

        await recordFreightMovement(tx, {
          productUuid: item.productUuid,
          quantity: item.quantity,
          type: "out",
          reason: "invoice_cancelled",
          supplierUuid: invoice.companyUuid,
          valuationPrice: stockRow.valuationPrice,
          operator: userId,
        });

        // Give the received quantity back to the PO line so it can be
        // re-received on a corrected invoice.
        if (stockRow.purchaseOrderItemUuid) {
          await tx
            .update(PurchaseOrderItems)
            .set({
              qtyReceived: sql`GREATEST(${PurchaseOrderItems.qtyReceived} - ${item.quantity}, 0)`,
            })
            .where(eq(PurchaseOrderItems.uuid, stockRow.purchaseOrderItemUuid));
        }
      }
    });

    revalidatePath("/purchase-invoices");
    revalidatePath(`/purchase-invoices/${uuid}`);
    revalidatePath("/stock");
    revalidatePath("/stock-movements");
    return { success: true, purchaseInvoiceUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to cancel purchase invoice",
    };
  }
};
