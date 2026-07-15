"use server";

import { db } from "@/db";
import { InsertOrders, Orders, SelectOrders } from "@/db/schema/orders";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { Products, SelectProducts } from "@/db/schema/products";
import { Stock } from "@/db/schema/stock";
import { generateUuid } from "@/lib/helpers";
import { and, desc, eq, getTableColumns, gte, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type OrderFields = Omit<
  InsertOrders,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type OrderItemInput = {
  stockUuid: string;
  quantity: string;
};

export type OrderActionResult = {
  orderUuid?: string;
  error?: string;
  success?: boolean;
};

export type OrderListItem = SelectOrders & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export type OrderOption = Pick<SelectOrders, "uuid" | "id">;

export const getOrdersForCompany = async (
  companyUuid: string,
): Promise<OrderOption[]> =>
  db
    .select({ uuid: Orders.uuid, id: Orders.id })
    .from(Orders)
    .where(eq(Orders.companyUuid, companyUuid))
    .orderBy(desc(Orders.createdAt));

export const getOrders = async (): Promise<OrderListItem[]> => {
  try {
    const rows = await db
      .select({
        ...getTableColumns(Orders),
        companyName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(Orders)
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(Contacts, eq(Orders.contactUuid, Contacts.uuid))
      .orderBy(desc(Orders.createdAt));
    return rows as OrderListItem[];
  } catch {
    throw new Error("Failed to fetch orders");
  }
};

export const createOrder = async (
  fields: OrderFields,
  items: OrderItemInput[] = [],
): Promise<OrderActionResult> => {
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
          return {
            error: "One or more selected stock items could not be found.",
          };
        }
        if (stockRow.status !== "pending") {
          return {
            error: "One or more selected stock items are no longer available.",
          };
        }
        const freeQuantity =
          Number(stockRow.quantity) - Number(stockRow.reservedQuantity);
        if (Number(item.quantity) > freeQuantity) {
          return {
            error: `Cannot reserve more than the available quantity (${freeQuantity.toFixed(3)}).`,
          };
        }
      }

      await db.transaction(async (tx) => {
        await tx.insert(Orders).values({ ...fields, uuid });

        for (const item of items) {
          const stockRow = stockByUuid.get(item.stockUuid);
          if (!stockRow) {
            continue;
          }

          const nextReserved = (
            Number(stockRow.reservedQuantity) + Number(item.quantity)
          ).toFixed(3);

          // Guard: only reserve if the free quantity we validated above is
          // still there — a concurrent reservation/consumption can't cause
          // this lot to be oversold.
          const [updateResult] = await tx
            .update(Stock)
            .set({ reservedQuantity: nextReserved })
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
              "Stock changed while reserving — please refresh and try again.",
            );
          }

          await tx.insert(OrderItems).values({
            uuid: generateUuid(),
            orderUuid: uuid,
            stockUuid: item.stockUuid,
            productUuid: stockRow.productUuid,
            quantity: item.quantity,
            status: "reserved",
          });
        }
      });
    } else {
      await db.insert(Orders).values({ ...fields, uuid });
    }

    revalidatePath("/orders");
    revalidatePath("/stock");
    return { success: true, orderUuid: uuid };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create order",
    };
  }
};

export type OrderItemDetail = SelectOrderItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type OrderDetail = SelectOrders & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  items: OrderItemDetail[];
};

export const getOrderDetail = async (
  uuid: string,
): Promise<OrderDetail | null> => {
  const [order] = await db
    .select({
      ...getTableColumns(Orders),
      companyName: Companies.companyName,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
    })
    .from(Orders)
    .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .leftJoin(Contacts, eq(Orders.contactUuid, Contacts.uuid))
    .where(eq(Orders.uuid, uuid))
    .limit(1);

  if (!order) {
    return null;
  }

  const items = await db
    .select({
      ...getTableColumns(OrderItems),
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(OrderItems)
    .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
    .where(eq(OrderItems.orderUuid, uuid));

  return { ...order, items };
};

export const cancelOrder = async (
  uuid: string,
): Promise<OrderActionResult> => {
  try {
    const [order] = await db
      .select()
      .from(Orders)
      .where(eq(Orders.uuid, uuid))
      .limit(1);

    if (!order) {
      return { error: "Order not found." };
    }
    if (order.status === "cancelled") {
      return { error: "This order is already cancelled." };
    }

    const items = await db
      .select()
      .from(OrderItems)
      .where(eq(OrderItems.orderUuid, uuid));

    if (items.some((item) => item.status === "invoiced")) {
      return {
        error:
          "Cannot cancel: some products on this order have already been invoiced.",
      };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(Orders)
        .set({ status: "cancelled" })
        .where(eq(Orders.uuid, uuid));

      for (const item of items) {
        if (item.status !== "reserved") {
          continue;
        }

        await tx
          .update(OrderItems)
          .set({ status: "cancelled" })
          .where(eq(OrderItems.uuid, item.uuid));

        const [stockRow] = await tx
          .select()
          .from(Stock)
          .where(eq(Stock.uuid, item.stockUuid))
          .limit(1);

        if (!stockRow) {
          continue;
        }

        const releasedReserved = Math.max(
          0,
          Number(stockRow.reservedQuantity) - Number(item.quantity),
        ).toFixed(3);

        await tx
          .update(Stock)
          .set({ reservedQuantity: releasedReserved })
          .where(eq(Stock.uuid, item.stockUuid));
      }
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${uuid}`);
    revalidatePath("/stock");
    return { success: true, orderUuid: uuid };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to cancel order",
    };
  }
};

export type OrderHeaderEdit = Pick<
  OrderFields,
  "customerRef" | "ourReference" | "deliveryDate" | "deliveryRemark" | "remarks"
>;

export const updateOrder = async (
  uuid: string,
  fields: OrderHeaderEdit,
): Promise<OrderActionResult> => {
  try {
    const [order] = await db
      .select({ status: Orders.status })
      .from(Orders)
      .where(eq(Orders.uuid, uuid))
      .limit(1);

    if (!order) {
      return { error: "Order not found." };
    }
    if (order.status === "cancelled") {
      return { error: "Cannot edit a cancelled order." };
    }

    await db.update(Orders).set(fields).where(eq(Orders.uuid, uuid));
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update order",
    };
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${uuid}`);
  redirect(`/orders/${uuid}`);
};
