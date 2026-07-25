"use server";

import { db } from "@/db";
import {
  InsertOrders,
  InsertOrderSurcharges,
  Orders,
  OrderSurcharges,
  SelectOrders,
} from "@/db/schema/orders";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { Contracts, SelectContracts } from "@/db/schema/contracts";
import { Products, SelectProducts } from "@/db/schema/products";
import { SelectStock, Stock } from "@/db/schema/stock";
import { InsertTexts, Texts } from "@/db/schema/texts";
import { describeError, generateUuid } from "@/lib/helpers";
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gte,
  inArray,
  sql,
} from "drizzle-orm";
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

export type OrderSurchargeInput = Omit<
  InsertOrderSurcharges,
  "id" | "uuid" | "orderUuid" | "createdAt" | "updatedAt"
>;

export type OrderTextInput = Pick<
  InsertTexts,
  "title" | "textBlock" | "textCategoryUuid"
>;

export type OrderExtras = {
  surcharges: OrderSurchargeInput[];
  texts: OrderTextInput[];
  contractUuids: string[];
};

export type ContractOption = Pick<
  SelectContracts,
  "uuid" | "code" | "description" | "contractType"
>;

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

export type OrderHeaderEdit = Pick<
  OrderFields,
  "customerRef" | "ourReference" | "deliveryDate" | "deliveryRemark" | "remarks"
>;

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
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch orders"));
  }
};

export const getContractsByCompanyUuid = async (
  companyUuid: string,
): Promise<ContractOption[]> =>
  db
    .select({
      uuid: Contracts.uuid,
      code: Contracts.code,
      description: Contracts.description,
      contractType: Contracts.contractType,
    })
    .from(Contracts)
    .where(
      and(
        eq(Contracts.companyUuid, companyUuid),
        inArray(Contracts.role, ["customer", "prospect"]),
      ),
    )
    .orderBy(asc(Contracts.code));

export const createOrder = async (
  fields: OrderFields,
  items: OrderItemInput[] = [],
  extras: OrderExtras = { surcharges: [], texts: [], contractUuids: [] },
): Promise<OrderActionResult> => {
  const uuid = generateUuid();
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
    }

    await db.transaction(async (tx) => {
      await tx.insert(Orders).values({ ...fields, uuid });

      let lineNumber = 0;
      for (const item of items) {
        const stockRow = stockByUuid.get(item.stockUuid);
        if (!stockRow) {
          continue;
        }
        lineNumber += 1;

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
          // Planned = the ordered amount; nothing is called off yet, so the
          // full quantity is still "to be called" until call-offs reduce it.
          qtyPlanned: item.quantity,
          qtyReserved: item.quantity,
          lineNumber,
          status: "reserved",
        });
      }

      if (extras.surcharges.length > 0) {
        await tx.insert(OrderSurcharges).values(
          extras.surcharges.map((surcharge) => ({
            ...surcharge,
            uuid: generateUuid(),
            orderUuid: uuid,
          })),
        );
      }

      if (extras.texts.length > 0) {
        await tx.insert(Texts).values(
          extras.texts.map((text) => ({
            uuid: generateUuid(),
            orderUuid: uuid,
            companyUuid: fields.companyUuid,
            title: text.title,
            textBlock: text.textBlock,
            textCategoryUuid: text.textCategoryUuid ?? null,
          })),
        );
      }

      if (extras.contractUuids.length > 0) {
        await tx
          .update(Contracts)
          .set({ orderUuid: uuid })
          .where(inArray(Contracts.uuid, extras.contractUuids));
      }
    });

    revalidatePath("/orders");
    revalidatePath("/stock");
    return { success: true, orderUuid: uuid };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create order",
    };
  }
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

export const cancelOrder = async (uuid: string): Promise<OrderActionResult> => {
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
