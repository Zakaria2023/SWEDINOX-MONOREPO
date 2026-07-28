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
import { describeError, generateUuid } from "@/lib/helpers";
import { desc, eq, getTableColumns } from "drizzle-orm";
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

  const [items, surcharges, texts] = await Promise.all([
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
  ]);

  return { ...returnOrder, items, surcharges, texts };
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
