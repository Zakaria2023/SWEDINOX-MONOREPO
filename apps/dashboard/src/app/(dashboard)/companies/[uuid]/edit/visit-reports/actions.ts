"use server";

import { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import {
  visitReportDialogSchema,
  VisitReportDialogValues,
} from "@/app/(dashboard)/companies/validation";
import { db } from "@/db";
import { Contacts } from "@/db/schema/contacts";
import { SelectVisitReports, VisitReports } from "@/db/schema/visit-reports";
import { describeError, generateUuid } from "@/lib/helpers";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { contactDisplayName, visitReportValuesToColumns } from "./mappers";

export type SaveVisitReportPayload = {
  companyUuid: string;
  visitReportUuid: string | null;
  values: VisitReportDialogValues;
};

export type DeleteVisitReportPayload = {
  companyUuid: string;
  visitReportUuid: string;
};

const revalidateVisitReportPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/visit-reports`);
  revalidatePath(`/companies/${companyUuid}/edit`);
};

export const getVisitReportsForCompany = async (
  companyUuid: string,
): Promise<SelectVisitReports[]> =>
  await db
    .select()
    .from(VisitReports)
    .where(eq(VisitReports.companyUuid, companyUuid))
    .orderBy(asc(VisitReports.id));

// Inserts a new visit report or updates an existing one by uuid. The dialog's
// contact field carries a real contact uuid here; `representative` is derived
// server-side from that contact's name — the same auto-fill the legacy create
// flow applied. Updates write only the dialog-editable columns, so the
// marketing/planning fields a report may carry are never clobbered.
export const saveVisitReport = async (
  _prevState: CompanyActionResult,
  payload: SaveVisitReportPayload,
): Promise<CompanyActionResult> => {
  const parsed = visitReportDialogSchema.safeParse(payload.values);
  if (!parsed.success) {
    return {
      error: "Invalid visit report data — check the fields and try again",
    };
  }

  try {
    const contactUuid = parsed.data.contactIndex || null;

    const [contact] = contactUuid
      ? await db
          .select()
          .from(Contacts)
          .where(
            and(
              eq(Contacts.uuid, contactUuid),
              eq(Contacts.companyUuid, payload.companyUuid),
            ),
          )
          .limit(1)
      : [];

    if (contactUuid && !contact) {
      return { error: "The selected contact no longer exists" };
    }

    const representative = contact ? contactDisplayName(contact) : null;

    const columns = {
      ...visitReportValuesToColumns(parsed.data),
      contactUuid,
      representative,
    };

    if (payload.visitReportUuid) {
      await db
        .update(VisitReports)
        .set(columns)
        .where(
          and(
            eq(VisitReports.uuid, payload.visitReportUuid),
            eq(VisitReports.companyUuid, payload.companyUuid),
          ),
        );
    } else {
      await db.insert(VisitReports).values({
        ...columns,
        uuid: generateUuid(),
        companyUuid: payload.companyUuid,
      });
    }

    revalidateVisitReportPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save visit report") };
  }
};

export const deleteVisitReport = async (
  _prevState: CompanyActionResult,
  payload: DeleteVisitReportPayload,
): Promise<CompanyActionResult> => {
  try {
    await db
      .delete(VisitReports)
      .where(
        and(
          eq(VisitReports.uuid, payload.visitReportUuid),
          eq(VisitReports.companyUuid, payload.companyUuid),
        ),
      );

    revalidateVisitReportPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to delete visit report") };
  }
};
