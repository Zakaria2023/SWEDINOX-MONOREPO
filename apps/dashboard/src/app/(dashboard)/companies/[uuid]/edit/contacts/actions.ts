"use server";

import type { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import {
  contactDialogSchema,
  ContactDialogValues,
} from "@/app/(dashboard)/companies/validation";
import { db, SelectCompanies } from "@/db";
import { Companies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { VisitReports } from "@/db/schema/visit-reports";
import { describeError, generateUuid, pluralize } from "@/lib/helpers";
import { and, asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { contactValuesToColumns } from "./mappers";

export type CompanyEditHeader = Pick<SelectCompanies, "uuid" | "companyName">;

export type SaveContactPayload = {
  companyUuid: string;
  contactUuid: string | null;
  values: ContactDialogValues;
};

export type DeleteContactPayload = {
  companyUuid: string;
  contactUuid: string;
};

const revalidateContactPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/contacts`);
  revalidatePath(`/companies/${companyUuid}/edit`);
};

export const getCompanyHeader = async (
  companyUuid: string,
): Promise<CompanyEditHeader | null> => {
  const [company] = await db
    .select({ uuid: Companies.uuid, companyName: Companies.companyName })
    .from(Companies)
    .where(eq(Companies.uuid, companyUuid))
    .limit(1);

  return company ?? null;
};

export const getCompanyContacts = async (
  companyUuid: string,
): Promise<SelectContacts[]> =>
  await db
    .select()
    .from(Contacts)
    .where(eq(Contacts.companyUuid, companyUuid))
    .orderBy(asc(Contacts.id));

// Inserts a new contact or updates an existing one by uuid. New contacts
// inherit the company's search codes, role flags, and zeroed revenue targets —
// the same defaults the create-company flow applies. Updates write only the
// dialog-editable columns.
export const saveCompanyContact = async (
  _prevState: CompanyActionResult,
  payload: SaveContactPayload,
): Promise<CompanyActionResult> => {
  const parsed = contactDialogSchema.safeParse(payload.values);
  if (!parsed.success) {
    return { error: "Invalid contact data — check the fields and try again" };
  }

  try {
    const columns = contactValuesToColumns(parsed.data);

    if (payload.contactUuid) {
      await db
        .update(Contacts)
        .set(columns)
        .where(
          and(
            eq(Contacts.uuid, payload.contactUuid),
            eq(Contacts.companyUuid, payload.companyUuid),
          ),
        );
    } else {
      const [company] = await db
        .select()
        .from(Companies)
        .where(eq(Companies.uuid, payload.companyUuid))
        .limit(1);

      if (!company) {
        return { error: "Company not found" };
      }

      const roles = company.roles ?? [];
      const isSupplier = roles.includes("supplier");
      const isCustomerOrProspect =
        roles.includes("customer") || roles.includes("prospect");
      const inheritsCompanyCodes = isSupplier || isCustomerOrProspect;

      await db.insert(Contacts).values({
        ...columns,
        uuid: generateUuid(),
        companyUuid: payload.companyUuid,
        searchCode1: inheritsCompanyCodes ? company.searchCode1 : null,
        searchCode2: inheritsCompanyCodes ? company.searchCode2 : null,
        searchCode3: inheritsCompanyCodes ? company.searchCode3 : null,
        revenueLastYear: inheritsCompanyCodes ? "0.00" : null,
        revenueThisYear: inheritsCompanyCodes ? "0.00" : null,
        targetYearRevenue: isCustomerOrProspect ? "0.00" : null,
        targetAnnualSales: isCustomerOrProspect ? "0.00" : null,
        isCustomer: roles.includes("customer"),
        isProspect: roles.includes("prospect"),
        isSupplier,
        isProcessor: roles.includes("processor"),
        isTransporter: roles.includes("transporter"),
        isAgent: roles.includes("agent"),
        isOther: roles.includes("other"),
      });
    }

    revalidateContactPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save contact") };
  }
};

export const deleteCompanyContact = async (
  _prevState: CompanyActionResult,
  payload: DeleteContactPayload,
): Promise<CompanyActionResult> => {
  try {
    const [linked] = await db
      .select({ value: sql<number>`COUNT(*)` })
      .from(VisitReports)
      .where(eq(VisitReports.contactUuid, payload.contactUuid));
    const linkedCount = Number(linked?.value ?? 0);

    if (linkedCount > 0) {
      return {
        error: `This contact is linked to ${linkedCount} ${pluralize(
          linkedCount,
          "visit report",
        )} and can't be deleted`,
      };
    }

    await db
      .delete(Contacts)
      .where(
        and(
          eq(Contacts.uuid, payload.contactUuid),
          eq(Contacts.companyUuid, payload.companyUuid),
        ),
      );

    revalidateContactPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to delete contact") };
  }
};
