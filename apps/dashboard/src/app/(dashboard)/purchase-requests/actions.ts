"use server";

import { db } from "@/db";
import {
  InsertPurchaseRequests,
  PurchaseRequests,
  SelectPurchaseRequests,
} from "@/db/schema/purchase-requests";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { resolveCompanyType } from "@/app/(dashboard)/companies/actions";
import { describeError, generateUuid } from "@/lib/helpers";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type PurchaseRequestFields = Omit<
  InsertPurchaseRequests,
  "id" | "uuid" | "companyType" | "createdAt" | "updatedAt"
>;

export type PurchaseRequestActionResult = {
  purchaseRequestUuid?: string;
  error?: string;
  success?: boolean;
};

export type PurchaseRequestListItem = SelectPurchaseRequests & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export const getPurchaseRequests = async (): Promise<
  PurchaseRequestListItem[]
> => {
  try {
    return (await db
      .select({
        ...getTableColumns(PurchaseRequests),
        companyName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(PurchaseRequests)
      .leftJoin(Companies, eq(PurchaseRequests.companyUuid, Companies.uuid))
      .leftJoin(Contacts, eq(PurchaseRequests.contactUuid, Contacts.uuid))
      .orderBy(desc(PurchaseRequests.createdAt))) as PurchaseRequestListItem[];
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase requests"));
  }
};

export const createPurchaseRequest = async (
  fields: PurchaseRequestFields,
): Promise<PurchaseRequestActionResult> => {
  const uuid = generateUuid();
  try {
    const companyType = await resolveCompanyType(fields.companyUuid);
    await db.insert(PurchaseRequests).values({ ...fields, companyType, uuid });
    revalidatePath("/purchase-requests");
    return { success: true, purchaseRequestUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create purchase request",
    };
  }
};
