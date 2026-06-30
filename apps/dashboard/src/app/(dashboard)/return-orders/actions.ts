"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import {
  InsertReturnOrders,
  ReturnOrders,
  SelectReturnOrders,
} from "@/db/schema/return-orders";
import { generateUuid } from "@/lib/helpers";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export { getAddressesForCompany } from "@/app/(dashboard)/companies/actions";
export type { AddressOption } from "@/app/(dashboard)/companies/actions";
export { getOrdersForCompany } from "@/app/(dashboard)/orders/actions";
export type { OrderOption } from "@/app/(dashboard)/orders/actions";

export type ReturnOrderFields = Omit<
  InsertReturnOrders,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

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
    return rows as ReturnOrderListItem[];
  } catch {
    throw new Error("Failed to fetch return orders");
  }
};

export const createReturnOrder = async (
  fields: ReturnOrderFields,
): Promise<ReturnOrderActionResult> => {
  const uuid = generateUuid();
  try {
    await db.insert(ReturnOrders).values({ ...fields, uuid });
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
