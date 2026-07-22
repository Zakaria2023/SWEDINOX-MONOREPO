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
import { SelectStock, Stock } from "@/db/schema/stock";
import {
  SelectStockMovements,
  StockMovements,
} from "@/db/schema/stock-movements";
import { JournalEntries } from "@/db/schema/journal-entries";
import { buildPurchaseInvoiceJournalEntry } from "@/lib/server/accounting";
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
  stockUuid: string;
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
    // Validate stock availability before opening the transaction.
    const stockByUuid = new Map<string, SelectStock>();
    if (items.length > 0) {
      const stockUuids = items.map((item) => item.stockUuid);
      const stockRows = await db
        .select()
        .from(Stock)
        .where(inArray(Stock.uuid, stockUuids));
      for (const row of stockRows) {
        stockByUuid.set(row.uuid, row);
      }

      for (const item of items) {
        const stockRow = stockByUuid.get(item.stockUuid);
        if (!stockRow) {
          return {
            error: "One or more selected stock items could not be found.",
          };
        }
        if (stockRow.status !== "pending") {
          return {
            error: "One or more selected stock items are no longer pending.",
          };
        }
        const freeQuantity =
          Number(stockRow.quantity) - Number(stockRow.reservedQuantity);
        if (Number(item.quantity) > freeQuantity) {
          return {
            error: `Cannot take more than the unreserved pending quantity (${freeQuantity.toFixed(3)}).`,
          };
        }
      }
    }

    const user = await currentUser();
    const userId = user?.id ?? null;
    // Consuming stock records who did it, so require an authenticated user.
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
      await tx
        .insert(PurchaseInvoices)
        .values({ ...fields, expirationDate: derivedExpiration, uuid });

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
        const stockRow = stockByUuid.get(item.stockUuid);
        if (!stockRow) {
          continue;
        }
        if (!userId) {
          throw new Error("User not authenticated");
        }

        await tx.insert(PurchaseInvoiceItems).values({
          uuid: generateUuid(),
          purchaseInvoiceUuid: uuid,
          stockUuid: item.stockUuid,
          productUuid: stockRow.productUuid,
          quantity: item.quantity,
        });

        const remainingQuantity = (
          Number(stockRow.quantity) - Number(item.quantity)
        ).toFixed(3);

        // Guard the update with the quantity/status we validated above so a
        // concurrent invoice against the same lot can't oversell it — if
        // another transaction already changed the row, affectedRows is 0
        // and we roll back instead of silently double-spending stock.
        const [updateResult] = await tx
          .update(Stock)
          .set({
            quantity: remainingQuantity,
            status: Number(remainingQuantity) > 0 ? "pending" : "received",
          })
          .where(
            and(
              eq(Stock.uuid, item.stockUuid),
              eq(Stock.status, "pending"),
              gte(
                sql`(${Stock.quantity} - ${Stock.reservedQuantity})`,
                item.quantity,
              ),
            ),
          );

        if (updateResult.affectedRows === 0) {
          throw new Error(
            "Stock changed while processing this invoice — please refresh and try again.",
          );
        }

        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid: stockRow.productUuid,
          stockUuid: item.stockUuid,
          type: "out",
          reason: "invoice_consumption",
          quantity: item.quantity,
          purchaseInvoiceUuid: uuid,
          createdByUserId: userId,
        });

        await recordFreightMovement(tx, {
          productUuid: stockRow.productUuid,
          quantity: item.quantity,
          type: "out",
          reason: "invoice_consumption",
          supplierUuid: fields.companyUuid ?? null,
          valuationPrice: stockRow.valuationPrice,
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

        const restoredQuantity = (
          Number(stockRow.quantity) + Number(item.quantity)
        ).toFixed(3);

        await tx
          .update(Stock)
          .set({ quantity: restoredQuantity, status: "pending" })
          .where(eq(Stock.uuid, item.stockUuid));

        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid: item.productUuid,
          stockUuid: item.stockUuid,
          type: "in",
          reason: "invoice_cancelled",
          quantity: item.quantity,
          purchaseInvoiceUuid: uuid,
          createdByUserId: userId,
        });
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
