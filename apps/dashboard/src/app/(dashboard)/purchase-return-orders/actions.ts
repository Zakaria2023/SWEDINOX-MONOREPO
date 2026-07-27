"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import {
  InsertPurchaseReturnOrders,
  InsertPurchaseReturnOrderSurcharges,
  PurchaseReturnOrders,
  PurchaseReturnOrderSurcharges,
  SelectPurchaseReturnOrders,
} from "@/db/schema/purchase-return-orders";
import { InsertTexts, Texts } from "@/db/schema/texts";
import { describeError, generateUuid } from "@/lib/helpers";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type PurchaseReturnOrderFields = Omit<
  InsertPurchaseReturnOrders,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type PurchaseReturnOrderSurchargeInput = Omit<
  InsertPurchaseReturnOrderSurcharges,
  "id" | "uuid" | "purchaseReturnOrderUuid" | "createdAt" | "updatedAt"
>;

export type PurchaseReturnOrderTextInput = Pick<
  InsertTexts,
  "title" | "textBlock" | "textCategoryUuid"
>;

export type PurchaseReturnOrderExtras = {
  surcharges: PurchaseReturnOrderSurchargeInput[];
  texts: PurchaseReturnOrderTextInput[];
};

export type PurchaseReturnOrderActionResult = {
  purchaseReturnOrderUuid?: string;
  error?: string;
  success?: boolean;
};

export type PurchaseReturnOrderListItem = SelectPurchaseReturnOrders & {
  supplierName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export const getPurchaseReturnOrders = async (): Promise<
  PurchaseReturnOrderListItem[]
> => {
  try {
    const rows = await db
      .select({
        ...getTableColumns(PurchaseReturnOrders),
        supplierName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(PurchaseReturnOrders)
      .leftJoin(Companies, eq(PurchaseReturnOrders.supplierUuid, Companies.uuid))
      .leftJoin(Contacts, eq(PurchaseReturnOrders.contactUuid, Contacts.uuid))
      .orderBy(desc(PurchaseReturnOrders.createdAt));
    return rows;
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase return orders"));
  }
};

export const createPurchaseReturnOrder = async (
  fields: PurchaseReturnOrderFields,
  extras: PurchaseReturnOrderExtras,
): Promise<PurchaseReturnOrderActionResult> => {
  const uuid = generateUuid();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(PurchaseReturnOrders).values({ ...fields, uuid });

      if (extras.surcharges.length > 0) {
        await tx.insert(PurchaseReturnOrderSurcharges).values(
          extras.surcharges.map((surcharge) => ({
            ...surcharge,
            uuid: generateUuid(),
            purchaseReturnOrderUuid: uuid,
          })),
        );
      }

      if (extras.texts.length > 0) {
        await tx.insert(Texts).values(
          extras.texts.map((text) => ({
            uuid: generateUuid(),
            purchaseReturnOrderUuid: uuid,
            companyUuid: fields.supplierUuid,
            title: text.title,
            textBlock: text.textBlock,
            textCategoryUuid: text.textCategoryUuid ?? null,
          })),
        );
      }
    });
    revalidatePath("/purchase-return-orders");
    return { success: true, purchaseReturnOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create purchase return order",
    };
  }
};
