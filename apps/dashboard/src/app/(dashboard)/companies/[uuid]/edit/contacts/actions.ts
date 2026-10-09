"use server";

import { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import {
  contactDialogSchema,
  ContactDialogValues,
} from "@/app/(dashboard)/companies/validation";
import { db, SelectCompanies } from "@/db";
import { Companies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { VisitReports } from "@/db/schema/visit-reports";
import { sendCompanyWelcomeEmails } from "@/emails/actions";
import { mailDocument } from "@/emails/documents";
import {
  describeError,
  firstCount,
  generateUuid,
  pluralize,
} from "@/lib/helpers";
import { and, asc, count, eq } from "drizzle-orm";
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
  revalidatePath(`/companies/${companyUuid}`);
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

// Inserts a new contact or updates an existing one by uuid. A contact stores
// only its own columns; the company's are joined wherever a contact is shown.
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

      await db.insert(Contacts).values({
        ...columns,
        uuid: generateUuid(),
        companyUuid: payload.companyUuid,
      });

      // A contact added here gets the same welcome the create-company flow
      // sends. This was the one thing that path copied and this one didn't, so a
      // contact added to an existing company was silently never written to.
      //
      // Only on insert. Re-welcoming somebody because a typo in their name was
      // corrected is worse than sending nothing, and an edit gives no way to
      // tell a new address from a fixed one.
      const welcomeTo = [columns.email, columns.addressEmail].filter(
        (email): email is string => !!email,
      );

      if (welcomeTo.length > 0) {
        await mailDocument(
          () => sendCompanyWelcomeEmails(company.companyName, welcomeTo),
          `Welcome email for a new contact at ${company.companyName}`,
        );
      }
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
    const linked = await db
      .select({ value: count() })
      .from(VisitReports)
      .where(eq(VisitReports.contactUuid, payload.contactUuid));
    const linkedCount = firstCount(linked);

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
