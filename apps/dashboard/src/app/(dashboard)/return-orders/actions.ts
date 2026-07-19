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
import { InsertTexts, Texts } from "@/db/schema/texts";
import { generateUuid } from "@/lib/helpers";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
  } catch {
    throw new Error("Failed to fetch return orders");
  }
};

export const createReturnOrder = async (
  fields: ReturnOrderFields,
  extras: ReturnOrderExtras,
): Promise<ReturnOrderActionResult> => {
  const uuid = generateUuid();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(ReturnOrders).values({ ...fields, uuid });

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
    revalidatePath("/return-orders");
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
