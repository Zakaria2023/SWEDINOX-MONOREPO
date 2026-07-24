"use server";

import { db } from "@/db";
import {
  InsertPurchaseOrders,
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { SelectStock, Stock } from "@/db/schema/stock";
import { StockMovements } from "@/db/schema/stock-movements";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { Products } from "@/db/schema/products";
import { describeError, generateUuid } from "@/lib/helpers";
import { recordFreightMovement } from "@/lib/server/freight";
import { currentUser } from "@clerk/nextjs/server";
import { desc, eq, getTableColumns, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

export type PurchaseOrderOption = Pick<
  SelectPurchaseOrders,
  "uuid" | "id" | "reference"
>;

export const getPurchaseOrdersForCompany = async (
  supplierUuid: string,
): Promise<PurchaseOrderOption[]> =>
  db
    .select({
      uuid: PurchaseOrders.uuid,
      id: PurchaseOrders.id,
      reference: PurchaseOrders.reference,
    })
    .from(PurchaseOrders)
    .where(eq(PurchaseOrders.supplierUuid, supplierUuid))
    .orderBy(desc(PurchaseOrders.createdAt));

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
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase orders"));
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

    if (
      productUuids.some((productUuid) => !validProductUuids.has(productUuid))
    ) {
      return { error: "One or more selected products could not be found." };
    }

    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      await tx.insert(PurchaseOrders).values({ ...fields, uuid });

      for (const [index, item] of items.entries()) {
        const itemUuid = generateUuid();
        await tx.insert(PurchaseOrderItems).values({
          uuid: itemUuid,
          purchaseOrderUuid: uuid,
          productUuid: item.productUuid,
          quantity: item.quantity,
          lineNumber: index + 1,
        });

        const stockUuid = generateUuid();
        await tx.insert(Stock).values({
          uuid: stockUuid,
          productUuid: item.productUuid,
          purchaseOrderUuid: uuid,
          purchaseOrderItemUuid: itemUuid,
          quantity: item.quantity,
          status: "pending",
        });

        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid: item.productUuid,
          stockUuid,
          type: "in",
          reason: "purchase_receipt",
          quantity: item.quantity,
          purchaseOrderUuid: uuid,
          createdByUserId: userId,
        });

        await recordFreightMovement(tx, {
          productUuid: item.productUuid,
          quantity: item.quantity,
          type: "in",
          reason: "purchase_receipt",
          purchaseOrderUuid: uuid,
          supplierUuid: fields.supplierUuid,
          operator: userId,
        });
      }
    });

    revalidatePath("/purchase-orders");
    revalidatePath("/stock");
    revalidatePath("/stock-movements");
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

export type PurchaseOrderItemDetail = {
  uuid: string;
  productUuid: string;
  productCode: string;
  productName: string;
  orderedQuantity: string;
  stockUuid: string | null;
  stockQuantity: string | null;
  stockStatus: SelectStock["status"] | null;
};

export type PurchaseOrderDetail = SelectPurchaseOrders & {
  supplierName: SelectCompanies["companyName"] | null;
  agentName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  items: PurchaseOrderItemDetail[];
};

export const getPurchaseOrderDetail = async (
  uuid: string,
): Promise<PurchaseOrderDetail | null> => {
  const [order] = await db
    .select({
      ...getTableColumns(PurchaseOrders),
      supplierName: Companies.companyName,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
    })
    .from(PurchaseOrders)
    .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
    .leftJoin(Contacts, eq(PurchaseOrders.contactUuid, Contacts.uuid))
    .where(eq(PurchaseOrders.uuid, uuid))
    .limit(1);

  if (!order) {
    return null;
  }

  const [agent] = order.agentUuid
    ? await db
        .select({ companyName: Companies.companyName })
        .from(Companies)
        .where(eq(Companies.uuid, order.agentUuid))
        .limit(1)
    : [];

  const items = await db
    .select({
      uuid: PurchaseOrderItems.uuid,
      productUuid: PurchaseOrderItems.productUuid,
      productCode: Products.productCode,
      productName: Products.name,
      orderedQuantity: PurchaseOrderItems.quantity,
      stockUuid: Stock.uuid,
      stockQuantity: Stock.quantity,
      stockStatus: Stock.status,
    })
    .from(PurchaseOrderItems)
    .innerJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
    .leftJoin(Stock, eq(Stock.purchaseOrderItemUuid, PurchaseOrderItems.uuid))
    .where(eq(PurchaseOrderItems.purchaseOrderUuid, uuid));

  return {
    ...order,
    agentName: agent?.companyName ?? null,
    items,
  };
};

export const cancelPurchaseOrder = async (
  uuid: string,
): Promise<PurchaseOrderActionResult> => {
  try {
    const [order] = await db
      .select()
      .from(PurchaseOrders)
      .where(eq(PurchaseOrders.uuid, uuid))
      .limit(1);

    if (!order) {
      return { error: "Purchase order not found." };
    }

    if (order.status === "cancelled") {
      return { error: "This purchase order is already cancelled." };
    }

    const stockRows = await db
      .select()
      .from(Stock)
      .where(eq(Stock.purchaseOrderUuid, uuid));

    if (
      stockRows.some(
        (row) => row.status !== "pending" || Number(row.reservedQuantity) > 0,
      )
    ) {
      return {
        error:
          "Cannot cancel: some products from this order have already been invoiced or reserved by a sales order.",
      };
    }

    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(PurchaseOrders)
        .set({ status: "cancelled" })
        .where(eq(PurchaseOrders.uuid, uuid));

      for (const stockRow of stockRows) {
        await tx
          .update(Stock)
          .set({ quantity: "0.000", status: "cancelled" })
          .where(eq(Stock.uuid, stockRow.uuid));

        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid: stockRow.productUuid,
          stockUuid: stockRow.uuid,
          type: "out",
          reason: "purchase_order_cancelled",
          quantity: stockRow.quantity,
          purchaseOrderUuid: uuid,
          createdByUserId: userId,
        });
      }
    });

    revalidatePath("/purchase-orders");
    revalidatePath(`/purchase-orders/${uuid}`);
    revalidatePath("/stock");
    revalidatePath("/stock-movements");
    return { success: true, purchaseOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to cancel purchase order",
    };
  }
};

export type PurchaseOrderHeaderEdit = Pick<
  PurchaseOrderFields,
  | "reference"
  | "ourReference"
  | "orderCategory"
  | "paymentTerms"
  | "deliveryDate"
  | "deliveryRemark"
  | "remarks"
>;

export const updatePurchaseOrder = async (
  uuid: string,
  fields: PurchaseOrderHeaderEdit,
): Promise<PurchaseOrderActionResult> => {
  try {
    const [order] = await db
      .select({ status: PurchaseOrders.status })
      .from(PurchaseOrders)
      .where(eq(PurchaseOrders.uuid, uuid))
      .limit(1);

    if (!order) {
      return { error: "Purchase order not found." };
    }
    if (order.status === "cancelled") {
      return { error: "Cannot edit a cancelled purchase order." };
    }

    await db
      .update(PurchaseOrders)
      .set(fields)
      .where(eq(PurchaseOrders.uuid, uuid));
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update purchase order",
    };
  }

  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${uuid}`);
  redirect(`/purchase-orders/${uuid}`);
};
