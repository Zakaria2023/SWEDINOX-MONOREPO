"use server";

import { db } from "@/db";
import { InsertOrders, Orders, SelectOrders } from "@/db/schema/orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  CompanyAddresses,
  SelectCompanyAddresses,
} from "@/db/schema/company-addresses";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { generateUuid } from "@/lib/helpers";
import { desc, eq, getTableColumns, asc } from "drizzle-orm";
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

export type AddressOption = Pick<
  SelectCompanyAddresses,
  "uuid" | "streetAndNo" | "city" | "postalCode" | "altName"
>;

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

export const getAddressesForCompany = async (
  companyUuid: string,
): Promise<AddressOption[]> =>
  db
    .select({
      uuid: CompanyAddresses.uuid,
      streetAndNo: CompanyAddresses.streetAndNo,
      city: CompanyAddresses.city,
      postalCode: CompanyAddresses.postalCode,
      altName: CompanyAddresses.altName,
    })
    .from(CompanyAddresses)
    .where(eq(CompanyAddresses.companyUuid, companyUuid))
    .orderBy(asc(CompanyAddresses.sequenceNumber));

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
