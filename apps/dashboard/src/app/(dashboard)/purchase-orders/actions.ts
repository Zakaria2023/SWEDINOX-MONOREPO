"use server";

import { db } from "@/db";
import {
  InsertPurchaseOrders,
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { Stock } from "@/db/schema/stock";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { Products } from "@/db/schema/products";
import { generateUuid } from "@/lib/helpers";
import { desc, eq, getTableColumns, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type PurchaseOrderFields = Omit<
  InsertPurchaseOrders,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type PurchaseOrderItemInput = {
  productUuid: string;
  quantity: string;
};

export type PurchaseOrderActionResult = {
  purchaseOrderUuid?: string;
  error?: string;
  success?: boolean;
};

export type PurchaseOrderListItem = SelectPurchaseOrders & {
  supplierName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export const getPurchaseOrders = async (): Promise<PurchaseOrderListItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(PurchaseOrders),
        supplierName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(PurchaseOrders)
      .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .leftJoin(Contacts, eq(PurchaseOrders.contactUuid, Contacts.uuid))
      .orderBy(desc(PurchaseOrders.createdAt));
  } catch {
    throw new Error("Failed to fetch purchase orders");
  }
};

const companyHasProducts = async (companyUuid: string): Promise<boolean> => {
  const rows = await db
    .select({ id: Products.id })
    .from(Products)
    .where(eq(Products.companyUuid, companyUuid))
    .limit(1);
  return rows.length > 0;
};

export const createPurchaseOrder = async (
  fields: PurchaseOrderFields,
  items: PurchaseOrderItemInput[],
): Promise<PurchaseOrderActionResult> => {
  const uuid = generateUuid();
  try {
    if (!(await companyHasProducts(fields.supplierUuid))) {
      return {
        error:
          "Selected supplier has no products. Add products to this company before creating a purchase order.",
      };
    }

    if (fields.agentUuid && !(await companyHasProducts(fields.agentUuid))) {
      return {
        error:
          "Selected agent has no products. Add products to this company before creating a purchase order.",
      };
    }

    if (items.length === 0) {
      return { error: "At least one product is required." };
    }

    const productUuids = items.map((item) => item.productUuid);
    const validProducts = await db
      .select({ uuid: Products.uuid })
      .from(Products)
      .where(inArray(Products.uuid, productUuids));
    const validProductUuids = new Set(validProducts.map((p) => p.uuid));

    if (productUuids.some((productUuid) => !validProductUuids.has(productUuid))) {
      return { error: "One or more selected products could not be found." };
    }

    await db.transaction(async (tx) => {
      await tx.insert(PurchaseOrders).values({ ...fields, uuid });

      for (const item of items) {
        const itemUuid = generateUuid();
        await tx.insert(PurchaseOrderItems).values({
          uuid: itemUuid,
          purchaseOrderUuid: uuid,
          productUuid: item.productUuid,
          quantity: item.quantity,
        });

        await tx.insert(Stock).values({
          uuid: generateUuid(),
          productUuid: item.productUuid,
          purchaseOrderUuid: uuid,
          purchaseOrderItemUuid: itemUuid,
          quantity: item.quantity,
          status: "pending",
        });
      }
    });

    revalidatePath("/purchase-orders");
    revalidatePath("/stock");
    return { success: true, purchaseOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create purchase order",
    };
  }
};
