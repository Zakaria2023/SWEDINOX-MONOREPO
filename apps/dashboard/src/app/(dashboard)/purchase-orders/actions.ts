"use server";

import { db } from "@/db";
import {
  InsertPurchaseOrders,
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { CompanyAddresses, SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { generateUuid } from "@/lib/helpers";
import { asc, desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type PurchaseOrderFields = Omit<
  InsertPurchaseOrders,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

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

export type AddressOption = Pick<
  SelectCompanyAddresses,
  "uuid" | "streetAndNo" | "city" | "postalCode" | "altName"
>;

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

export const getAddressesForCompany = async (
  companyUuid: string,
): Promise<AddressOption[]> => {
  return db
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
};

export const createPurchaseOrder = async (
  fields: PurchaseOrderFields,
): Promise<PurchaseOrderActionResult> => {
  const uuid = generateUuid();
  try {
    await db.insert(PurchaseOrders).values({ ...fields, uuid });
    revalidatePath("/purchase-orders");
    return { success: true, purchaseOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create purchase order",
    };
  }
};
