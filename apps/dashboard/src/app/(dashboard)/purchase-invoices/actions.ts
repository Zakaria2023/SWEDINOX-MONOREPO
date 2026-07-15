"use server";

import {
  Companies,
  Contacts,
  db,
  InsertPurchaseInvoices,
  PurchaseInvoices,
  SelectCompanies,
  SelectContacts,
  SelectPurchaseInvoices,
} from "@/db";
import {
  PurchaseInvoiceItems,
  SelectPurchaseInvoiceItems,
} from "@/db/schema/purchase-invoice-items";
import { Products, SelectProducts } from "@/db/schema/products";
import { Stock } from "@/db/schema/stock";
import { StockMovements } from "@/db/schema/stock-movements";
import { generateUuid } from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq, getTableColumns, gte, inArray } from "drizzle-orm";
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

export type PurchaseInvoiceListItem = SelectPurchaseInvoices & {
  companyName: SelectCompanies["companyName"] | null;
  supplierCode: SelectCompanies["searchCode1"] | null;
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
      supplierCode: Companies.searchCode1,
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
): Promise<PurchaseInvoiceActionResult> => {
  const uuid = generateUuid();
  try {
    if (items.length > 0) {
      const stockUuids = items.map((item) => item.stockUuid);
      const stockRows = await db
        .select()
        .from(Stock)
        .where(inArray(Stock.uuid, stockUuids));
      const stockByUuid = new Map(stockRows.map((row) => [row.uuid, row]));

      for (const item of items) {
        const stockRow = stockByUuid.get(item.stockUuid);
        if (!stockRow) {
          return { error: "One or more selected stock items could not be found." };
        }
        if (stockRow.status !== "pending") {
          return {
            error: "One or more selected stock items are no longer pending.",
          };
        }
        if (Number(item.quantity) > Number(stockRow.quantity)) {
          return {
            error: `Cannot take more than the available pending quantity (${stockRow.quantity}).`,
          };
        }
      }

      const user = await currentUser();
      const userId = user?.id;
      if (!userId) {
        return { error: "User not authenticated" };
      }

      await db.transaction(async (tx) => {
        await tx.insert(PurchaseInvoices).values({ ...fields, uuid });

        for (const item of items) {
          const stockRow = stockByUuid.get(item.stockUuid);
          if (!stockRow) {
            continue;
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
                gte(Stock.quantity, item.quantity),
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
        }
      });
    } else {
      await db.insert(PurchaseInvoices).values({ ...fields, uuid });
    }
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

export type PurchaseInvoiceItemDetail = SelectPurchaseInvoiceItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type PurchaseInvoiceDetail = SelectPurchaseInvoices & {
  companyName: SelectCompanies["companyName"] | null;
  supplierCode: SelectCompanies["searchCode1"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  items: PurchaseInvoiceItemDetail[];
};

export const getPurchaseInvoiceDetail = async (
  uuid: string,
): Promise<PurchaseInvoiceDetail | null> => {
  const [invoice] = await db
    .select({
      ...getTableColumns(PurchaseInvoices),
      companyName: Companies.companyName,
      supplierCode: Companies.searchCode1,
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

  return { ...invoice, items };
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
