"use server";

import { db } from "@/db";
import { InsertOrders, Orders, SelectOrders } from "@/db/schema/orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { generateUuid } from "@/lib/helpers";
import { count, desc, eq, getTableColumns, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
export type OrderFields = Omit<
  InsertOrders,
  "id" | "uuid" | "createdAt" | "updatedAt"
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

export const getOrderCountsByCompany = async (): Promise<
  Map<string, number>
> => {
  const rows = await db
    .select({ companyUuid: Orders.companyUuid, value: count() })
    .from(Orders)
    .groupBy(Orders.companyUuid);
  return new Map(rows.map((row) => [row.companyUuid, row.value] as const));
};

/** Most recent order per company, regardless of order count. */
export const getLastOrderDatesByCompany = async (): Promise<
  Map<string, Date>
> => {
  const rows = await db
    .select({ companyUuid: Orders.companyUuid, value: max(Orders.createdAt) })
    .from(Orders)
    .groupBy(Orders.companyUuid);
  const map = new Map<string, Date>();
  for (const row of rows) {
    if (row.companyUuid && row.value) map.set(row.companyUuid, row.value);
  }
  return map;
};

export const createOrder = async (
  fields: OrderFields,
): Promise<OrderActionResult> => {
  const uuid = generateUuid();
  try {
    await db.insert(Orders).values({ ...fields, uuid });
    revalidatePath("/orders");
    return { success: true, orderUuid: uuid };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create order",
    };
  }
};
