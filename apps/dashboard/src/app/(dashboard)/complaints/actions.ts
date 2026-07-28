"use server";

import { db } from "@/db";
import {
  Complaints,
  InsertComplaints,
  SelectComplaints,
} from "@/db/schema/complaints";
import {
  ComplaintItems,
  SelectComplaintItems,
} from "@/db/schema/complaint-items";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { describeError, generateUuid } from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

// A complaint line, with the order it was raised against resolved. This is the
// link the schema has always carried and nothing surfaced: a complaint is only
// actionable once you can see which order line it is about.
export type ComplaintItemDetail = SelectComplaintItems & {
  orderId: SelectOrders["id"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type ComplaintDetail = SelectComplaints & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  items: ComplaintItemDetail[];
};

export const getComplaintDetail = async (
  uuid: string,
): Promise<ComplaintDetail | null> => {
  const [complaint] = await db
    .select({
      ...getTableColumns(Complaints),
      companyName: Companies.companyName,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(Complaints)
    .leftJoin(Companies, eq(Complaints.companyUuid, Companies.uuid))
    .leftJoin(Contacts, eq(Complaints.contactUuid, Contacts.uuid))
    .leftJoin(Products, eq(Complaints.productUuid, Products.uuid))
    .where(eq(Complaints.uuid, uuid))
    .limit(1);

  if (!complaint) {
    return null;
  }

  const items = await db
    .select({
      ...getTableColumns(ComplaintItems),
      orderId: Orders.id,
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(ComplaintItems)
    .leftJoin(Orders, eq(ComplaintItems.orderUuid, Orders.uuid))
    .leftJoin(Products, eq(ComplaintItems.productUuid, Products.uuid))
    .where(eq(ComplaintItems.complaintUuid, uuid))
    .orderBy(ComplaintItems.lineNumber);

  return { ...complaint, items };
};

export const updateComplaint = async (
  uuid: string,
  fields: ComplaintFields,
): Promise<ComplaintActionResult> => {
  try {
    const [existing] = await db
      .select({ status: Complaints.status, statusHistory: Complaints.statusHistory })
      .from(Complaints)
      .where(eq(Complaints.uuid, uuid))
      .limit(1);

    if (!existing) {
      return { error: "Complaint not found." };
    }

    // The status trail is append-only, and only grows when the status actually
    // moves — re-saving a complaint without touching its status should not
    // manufacture a history entry that says somebody changed something.
    const user = await currentUser();
    const statusChanged = fields.status && fields.status !== existing.status;
    const statusHistory = statusChanged
      ? [
          ...(existing.statusHistory ?? []),
          {
            status: fields.status ?? "new",
            statusDate: new Date().toISOString(),
            assignedByUserId: user?.id ?? "",
            assignedByName:
              user?.fullName ||
              [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
              user?.username ||
              "",
          },
        ]
      : existing.statusHistory;

    await db
      .update(Complaints)
      .set({ ...fields, statusHistory })
      .where(eq(Complaints.uuid, uuid));
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update complaint",
    };
  }

  revalidatePath("/complaints");
  revalidatePath(`/complaints/${uuid}`);
  redirect(`/complaints/${uuid}`);
};

export const deleteComplaint = async (
  uuid: string,
): Promise<ComplaintActionResult> => {
  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(ComplaintItems)
        .where(eq(ComplaintItems.complaintUuid, uuid));
      await tx.delete(Complaints).where(eq(Complaints.uuid, uuid));
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete complaint",
    };
  }

  revalidatePath("/complaints");
  revalidatePath("/complaint-lines");
  redirect("/complaints");
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
