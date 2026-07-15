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
import { PurchaseInvoiceItems } from "@/db/schema/purchase-invoice-items";
import { Stock } from "@/db/schema/stock";
import { generateUuid } from "@/lib/helpers";
import { desc, eq, getTableColumns, inArray } from "drizzle-orm";
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

          await tx
            .update(Stock)
            .set({
              quantity: remainingQuantity,
              status: Number(remainingQuantity) > 0 ? "pending" : "received",
            })
            .where(eq(Stock.uuid, item.stockUuid));
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
  redirect("/purchase-invoices");
};
