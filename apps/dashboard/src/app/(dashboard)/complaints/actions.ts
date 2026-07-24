"use server";

import { db } from "@/db";
import {
  Complaints,
  InsertComplaints,
  SelectComplaints,
} from "@/db/schema/complaints";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { Products, SelectProducts } from "@/db/schema/products";
import { describeError, generateUuid } from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ComplaintFields = Omit<
  InsertComplaints,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type ComplaintActionResult = {
  complaintUuid?: string;
  error?: string;
  success?: boolean;
};

export type ComplaintListItem = SelectComplaints & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  productCode: SelectProducts["productCode"] | null;
};

export const getComplaints = async (): Promise<ComplaintListItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(Complaints),
        companyName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
        productCode: Products.productCode,
      })
      .from(Complaints)
      .leftJoin(Companies, eq(Complaints.companyUuid, Companies.uuid))
      .leftJoin(Contacts, eq(Complaints.contactUuid, Contacts.uuid))
      .leftJoin(Products, eq(Complaints.productUuid, Products.uuid))
      .orderBy(desc(Complaints.createdAt));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch complaints"));
  }
};

export const createComplaint = async (
  fields: ComplaintFields,
): Promise<ComplaintActionResult> => {
  const uuid = generateUuid();
  try {
    // The initial status history entry is stamped server-side with the current
    // user, so "Assigned by" always reflects who actually created the record.
    const user = await currentUser();
    const assignedByName =
      user?.fullName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.username ||
      "";
    const statusHistory = [
      {
        status: fields.status ?? "new",
        statusDate: new Date().toISOString(),
        assignedByUserId: user?.id ?? "",
        assignedByName,
      },
    ];

    await db.insert(Complaints).values({ ...fields, uuid, statusHistory });
    revalidatePath("/complaints");
    return { success: true, complaintUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create complaint",
    };
  }
};
